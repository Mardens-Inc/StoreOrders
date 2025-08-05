use crate::products::products_data::{ProductFilter, ProductRecord, ProductWithCategory};
use rust_decimal::Decimal;
use sqlx::{Executor, MySqlPool};
use tokio::fs;

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
    fs::create_dir_all("products").await?;

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
    price: Decimal,
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
    pub async fn get_all_with_filter(
        pool: &MySqlPool,
        filter: &ProductFilter,
    ) -> anyhow::Result<Vec<ProductWithCategory>> {
        let mut query = String::from(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.is_active = TRUE AND c.is_active = TRUE
            "#,
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

    pub async fn get_by_id(
        pool: &MySqlPool,
        id: u64,
    ) -> anyhow::Result<Option<ProductWithCategory>> {
        let query_result = sqlx::query_as::<_, ProductWithCategoryQuery>(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = TRUE AND c.is_active = TRUE
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(query_result.map(|q| q.into()))
    }

    pub async fn get_by_category(
        pool: &MySqlPool,
        category_id: u64,
    ) -> anyhow::Result<Vec<ProductWithCategory>> {
        let query_results = sqlx::query_as::<_, ProductWithCategoryQuery>(
            r#"
            SELECT p.*, c.name as category_name
            FROM `products` p
            JOIN `categories` c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.is_active = TRUE AND c.is_active = TRUE
            ORDER BY p.name ASC
            "#,
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
        price: Decimal,
        category_id: u64,
        image_url: Option<&str>,
        stock_quantity: i32,
    ) -> anyhow::Result<ProductRecord> {
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

        let product_id = result.last_insert_id();
        ProductRecord::get_by_id_simple(pool, product_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created product"))
    }

    pub async fn update(
        pool: &MySqlPool,
        id: u64,
        name: Option<&str>,
        description: Option<&str>,
        sku: Option<&str>,
        price: Option<Decimal>,
        category_id: Option<u64>,
        image_url: Option<&str>,
        in_stock: Option<bool>,
        stock_quantity: Option<i32>,
        is_active: Option<bool>,
    ) -> anyhow::Result<Option<ProductRecord>> {
        let mut query = "UPDATE products SET ".to_string();
        let mut updates = Vec::new();
        let mut bind_count = 0;

        if name.is_some() {
            updates.push("name = ?");
            bind_count += 1;
        }
        if description.is_some() {
            updates.push("description = ?");
            bind_count += 1;
        }
        if sku.is_some() {
            updates.push("sku = ?");
            bind_count += 1;
        }
        if price.is_some() {
            updates.push("price = ?");
            bind_count += 1;
        }
        if category_id.is_some() {
            updates.push("category_id = ?");
            bind_count += 1;
        }
        if image_url.is_some() {
            updates.push("image_url = ?");
            bind_count += 1;
        }
        if in_stock.is_some() {
            updates.push("in_stock = ?");
            bind_count += 1;
        }
        if stock_quantity.is_some() {
            updates.push("stock_quantity = ?");
            bind_count += 1;
        }
        if is_active.is_some() {
            updates.push("is_active = ?");
            bind_count += 1;
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");

        if bind_count == 0 {
            return ProductRecord::get_by_id_simple(pool, id).await;
        }

        query.push_str(&updates.join(", "));
        query.push_str(" WHERE id = ?");

        let mut query_builder = sqlx::query(&query);

        // Bind all the update values in order
        if let Some(name_val) = name {
            query_builder = query_builder.bind(name_val);
        }
        if let Some(desc_val) = description {
            query_builder = query_builder.bind(desc_val);
        }
        if let Some(sku_val) = sku {
            query_builder = query_builder.bind(sku_val);
        }
        if let Some(price_val) = price {
            query_builder = query_builder.bind(price_val);
        }
        if let Some(cat_id_val) = category_id {
            query_builder = query_builder.bind(cat_id_val);
        }
        if let Some(img_val) = image_url {
            query_builder = query_builder.bind(img_val);
        }
        if let Some(stock_val) = in_stock {
            query_builder = query_builder.bind(stock_val);
        }
        if let Some(qty_val) = stock_quantity {
            query_builder = query_builder.bind(qty_val);
        }
        if let Some(active_val) = is_active {
            query_builder = query_builder.bind(active_val);
        }

        // Bind the product_id for WHERE clause
        query_builder = query_builder.bind(id);

        let result = query_builder.execute(pool).await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        ProductRecord::get_by_id_simple(pool, id).await
    }

    pub async fn delete(pool: &MySqlPool, id: u64) -> anyhow::Result<bool> {
        let result = sqlx::query("DELETE FROM products WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    // Add a new function that returns just ProductRecord without category info
    pub async fn get_by_id_simple(
        pool: &MySqlPool,
        id: u64,
    ) -> anyhow::Result<Option<ProductRecord>> {
        let product = sqlx::query_as::<_, ProductRecord>(
            r#"
            SELECT id, name, description, sku, price, category_id, image_url, 
                   in_stock, stock_quantity, is_active, created_at, updated_at
            FROM `products`
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(product)
    }
}
