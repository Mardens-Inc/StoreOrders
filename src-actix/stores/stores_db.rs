use anyhow::Result;
use sqlx::{Executor, MySqlPool};
use crate::stores::stores_data::{StoreRecord, CreateStoreRequest, UpdateStoreRequest};

pub async fn initialize(pool: &MySqlPool) -> Result<()> {
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS `stores` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `city` VARCHAR(100),
            `address` VARCHAR(255),
            PRIMARY KEY (`id`),
            INDEX `idx_city` (`city`)
        )
        "#,
    )
    .await?;

    Ok(())
}

impl StoreRecord {
    pub async fn get_all(pool: &MySqlPool) -> Result<Vec<StoreRecord>> {
        let stores = sqlx::query_as::<_, StoreRecord>(
            r#"
            SELECT id, city, address
            FROM stores
            ORDER BY city ASC, address ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(stores)
    }

    pub async fn get_by_id(pool: &MySqlPool, store_id: u64) -> Result<Option<StoreRecord>> {
        let store = sqlx::query_as::<_, StoreRecord>(
            r#"
            SELECT id, city, address
            FROM stores
            WHERE id = ?
            "#
        )
        .bind(store_id)
        .fetch_optional(pool)
        .await?;

        Ok(store)
    }

    pub async fn create(pool: &MySqlPool, request: &CreateStoreRequest) -> Result<StoreRecord> {
        let result = sqlx::query(
            r#"
            INSERT INTO stores (city, address)
            VALUES (?, ?)
            "#
        )
        .bind(&request.city)
        .bind(&request.address)
        .execute(pool)
        .await?;

        let store_id = result.last_insert_id();

        let store = StoreRecord::get_by_id(pool, store_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created store"))?;

        Ok(store)
    }

    pub async fn update(pool: &MySqlPool, store_id: u64, request: &UpdateStoreRequest) -> Result<Option<StoreRecord>> {
        // Build dynamic update query based on provided fields
        let mut query = "UPDATE stores SET ".to_string();
        let mut updates = Vec::new();
        let mut values: Vec<Option<String>> = Vec::new();

        if request.city.is_some() {
            updates.push("city = ?");
            values.push(request.city.clone());
        }

        if request.address.is_some() {
            updates.push("address = ?");
            values.push(request.address.clone());
        }

        if updates.is_empty() {
            // No fields to update, return existing store
            return StoreRecord::get_by_id(pool, store_id).await;
        }

        query.push_str(&updates.join(", "));
        query.push_str(" WHERE id = ?");

        let mut query_builder = sqlx::query(&query);
        
        // Bind all the update values
        for value in &values {
            query_builder = query_builder.bind(value);
        }
        
        // Bind the store_id for WHERE clause
        query_builder = query_builder.bind(store_id);

        let result = query_builder.execute(pool).await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        StoreRecord::get_by_id(pool, store_id).await
    }

    pub async fn delete(pool: &MySqlPool, store_id: u64) -> Result<bool> {
        let result = sqlx::query(
            "DELETE FROM stores WHERE id = ?"
        )
        .bind(store_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_by_city(pool: &MySqlPool, city: &str) -> Result<Vec<StoreRecord>> {
        let stores = sqlx::query_as::<_, StoreRecord>(
            r#"
            SELECT id, city, address
            FROM stores
            WHERE city = ?
            ORDER BY address ASC
            "#
        )
        .bind(city)
        .fetch_all(pool)
        .await?;

        Ok(stores)
    }
}
