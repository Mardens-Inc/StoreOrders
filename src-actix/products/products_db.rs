use sqlx::{Executor, MySqlPool};
use crate::products::products_data::{ProductRecord, ProductWithCategory, ProductFilter};

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS `products` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT NOT NULL,
            `sku` VARCHAR(100) NOT NULL UNIQUE,
            `price` DECIMAL(10,2) NOT NULL,
            `category_id` BIGINT UNSIGNED NOT NULL,
            `image_url` VARCHAR(500),
            `in_stock` BOOLEAN NOT NULL DEFAULT TRUE,
            `stock_quantity` INT NOT NULL DEFAULT 0,
            `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
            INDEX `idx_category_id` (`category_id`),
            INDEX `idx_sku` (`sku`),
            INDEX `idx_active_stock` (`is_active`, `in_stock`),
            INDEX `idx_name` (`name`)
        )
        "#,
    )
    .await?;

    Ok(())
}

// Define a custom struct for the query result that matches the SELECT
#[derive(sqlx::FromRow)]
struct ProductWithCategoryQuery {
    // Product fields
    id: u64,
    name: String,
    description: String,
    sku: String,
    price: f32,
    category_id: u64,
    image_url: Option<String>,
    in_stock: bool,
    stock_quantity: i32,
    is_active: bool,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
    // Category field
    category_name: String,
}

impl From<ProductWithCategoryQuery> for ProductWithCategory {
    fn from(query_result: ProductWithCategoryQuery) -> Self {
        Self {
            product: ProductRecord {
                id: query_result.id,
                name: query_result.name,
                description: query_result.description,
                sku: query_result.sku,
                price: query_result.price,
                category_id: query_result.category_id,
                image_url: query_result.image_url,
                in_stock: query_result.in_stock,
                stock_quantity: query_result.stock_quantity,
                is_active: query_result.is_active,
                created_at: query_result.created_at,
                updated_at: query_result.updated_at,
            },
            category_name: query_result.category_name,
        }
    }
}

impl ProductRecord {
    pub async fn get_all_with_filter(pool: &MySqlPool, filter: &ProductFilter) -> anyhow::Result<Vec<ProductWithCategory>> {
        let mut query = String::from(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.is_active = TRUE AND c.is_active = TRUE
            "#
        );

        let mut bind_values = Vec::new();
        let mut conditions = Vec::new();

        if let Some(category_id_str) = &filter.category_id {
            if let Ok(category_id) = serde_hash::hashids::decode_single(category_id_str) {
                conditions.push("p.category_id = ?");
                bind_values.push(category_id.to_string());
            }
        }

        if let Some(search_term) = &filter.search {
            conditions.push("(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)");
            let search_pattern = format!("%{}%", search_term);
            bind_values.push(search_pattern.clone());
            bind_values.push(search_pattern.clone());
            bind_values.push(search_pattern);
        }

        if filter.in_stock_only.unwrap_or(false) {
            conditions.push("p.in_stock = TRUE AND p.stock_quantity > 0");
        }

        if !conditions.is_empty() {
            query.push_str(" AND ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY p.name ASC");

        if let Some(limit) = filter.limit {
            query.push_str(&format!(" LIMIT {}", limit));
            if let Some(offset) = filter.offset {
                query.push_str(&format!(" OFFSET {}", offset));
            }
        }

        let mut sql_query = sqlx::query_as::<_, ProductWithCategoryQuery>(&query);

        // Bind values in order
        for value in bind_values {
            sql_query = sql_query.bind(value);
        }

        let query_results = sql_query.fetch_all(pool).await?;
        let products = query_results.into_iter().map(|q| q.into()).collect();

        Ok(products)
    }

    pub async fn get_by_id(pool: &MySqlPool, id: u64) -> anyhow::Result<Option<ProductWithCategory>> {
        let query_result = sqlx::query_as::<_, ProductWithCategoryQuery>(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = TRUE AND c.is_active = TRUE
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(query_result.map(|q| q.into()))
    }

    pub async fn get_by_category(pool: &MySqlPool, category_id: u64) -> anyhow::Result<Vec<ProductWithCategory>> {
        let query_results = sqlx::query_as::<_, ProductWithCategoryQuery>(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.is_active = TRUE AND c.is_active = TRUE
            ORDER BY p.name ASC
            "#
        )
        .bind(category_id)
        .fetch_all(pool)
        .await?;

        let products = query_results.into_iter().map(|q| q.into()).collect();
        Ok(products)
    }

    pub async fn create(
        pool: &MySqlPool,
        name: &str,
        description: &str,
        sku: &str,
        price: f32,
        category_id: u64,
        image_url: Option<&str>,
        stock_quantity: i32,
    ) -> anyhow::Result<u64> {
        let result = sqlx::query(
            r#"
            INSERT INTO `products` (`name`, `description`, `sku`, `price`, `category_id`, `image_url`, `stock_quantity`, `in_stock`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(name)
        .bind(description)
        .bind(sku)
        .bind(price)
        .bind(category_id)
        .bind(image_url)
        .bind(stock_quantity)
        .bind(stock_quantity > 0)
        .execute(pool)
        .await?;

        Ok(result.last_insert_id())
    }

    pub async fn update_stock(pool: &MySqlPool, id: u64, quantity: i32) -> anyhow::Result<bool> {
        let result = sqlx::query(
            r#"
            UPDATE `products`
            SET `stock_quantity` = ?, `in_stock` = ?
            WHERE `id` = ?
            "#
        )
        .bind(quantity)
        .bind(quantity > 0)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
