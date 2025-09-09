use crate::orders::orders_data::{
    OrderItemRecord, OrderItemWithProduct, OrderWithItems, StoreOrderRecord, UserContext,
};
use crate::orders::store_order_status::StoreOrderStatus;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use sqlx::{Executor, MySqlPool, Row};

// Define a custom struct for the order items with products query
#[derive(sqlx::FromRow)]
struct OrderItemWithProductQuery {
    // OrderItem fields
    id: u64,
    order_id: u64,
    product_id: u64,
    quantity: i32,
    unit_price: Decimal,
    total_price: Decimal,
    created_at: chrono::NaiveDateTime,
    // Product fields
    product_name: String,
    product_sku: String,
    product_image_url: Option<String>,
}

impl From<OrderItemWithProductQuery> for OrderItemWithProduct {
    fn from(query_result: OrderItemWithProductQuery) -> Self {
        Self {
            item: OrderItemRecord {
                id: query_result.id,
                order_id: query_result.order_id,
                product_id: query_result.product_id,
                quantity: query_result.quantity,
                unit_price: query_result.unit_price,
                total_price: query_result.total_price,
                created_at: query_result.created_at,
            },
            product_name: query_result.product_name,
            product_sku: query_result.product_sku,
            product_image_url: query_result.product_image_url,
        }
    }
}

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
    // Create orders table
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS `orders` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `order_number` VARCHAR(50) NOT NULL UNIQUE,
            `user_id` BIGINT UNSIGNED NOT NULL,
            `store_id` BIGINT UNSIGNED NOT NULL,
            `status` ENUM('PENDING','SHIPPED','DELIVERED') NOT NULL DEFAULT 'PENDING',
            `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `notes` TEXT,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `status_changed_to_pending` DATETIME,
            `status_changed_to_completed` DATETIME,
            PRIMARY KEY (`id`),
            INDEX `idx_user_id` (`user_id`),
            INDEX `idx_store_id` (`store_id`),
            INDEX `idx_status` (`status`),
            INDEX `idx_order_number` (`order_number`)
        )
        "#,
    )
    .await?;

    // Normalize any existing values and enforce ENUM set regardless of current type
    pool.execute("UPDATE orders SET status = UPPER(status)")
        .await
        .ok();
    pool.execute("UPDATE orders SET status = 'PENDING' WHERE status NOT IN ('PENDING','SHIPPED','DELIVERED')").await.ok();
    pool.execute("ALTER TABLE orders MODIFY COLUMN `status` ENUM('PENDING','SHIPPED','DELIVERED') NOT NULL DEFAULT 'PENDING'").await.ok();

    // Create order_items table
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS `order_items` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `order_id` BIGINT UNSIGNED NOT NULL,
            `product_id` BIGINT UNSIGNED NOT NULL,
            `quantity` INT NOT NULL,
            `unit_price` DECIMAL(10,2) NOT NULL,
            `total_price` DECIMAL(10,2) NOT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
            INDEX `idx_order_id` (`order_id`),
            INDEX `idx_product_id` (`product_id`)
        )
        "#,
    )
    .await?;

    Ok(())
}

impl StoreOrderRecord {
    pub async fn get_all(pool: &MySqlPool) -> anyhow::Result<Vec<Self>> {
        let orders = sqlx::query_as::<_, Self>(
            r#"
            SELECT *
            FROM `orders`
            ORDER BY `created_at` DESC
            "#,
        )
        .fetch_all(pool);
        Ok(orders.await?)
    }
    pub async fn get_orders_for_user(pool: &MySqlPool, user_id: u64) -> anyhow::Result<Vec<Self>> {
        let orders = sqlx::query_as::<_, Self>(
            r#"
            SELECT id, order_number, user_id, store_id, status, total_amount,
                   notes, created_at, updated_at, status_changed_to_pending, status_changed_to_completed
            FROM `orders`
            WHERE `user_id` = ?
            ORDER BY `created_at` DESC
            "#
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(orders)
    }

    pub async fn get_orders_for_store(
        pool: &MySqlPool,
        store_id: u64,
    ) -> anyhow::Result<Vec<Self>> {
        let orders = sqlx::query_as::<_, Self>(
            r#"
            SELECT id, order_number, user_id, store_id, status, total_amount,
                   notes, created_at, updated_at, status_changed_to_pending, status_changed_to_completed
            FROM `orders`
            WHERE `store_id` = ?
            ORDER BY `created_at` DESC
            "#
        )
        .bind(store_id)
        .fetch_all(pool)
        .await?;

        Ok(orders)
    }

    pub async fn get_by_id(pool: &MySqlPool, id: u64) -> anyhow::Result<Option<Self>> {
        let order = sqlx::query_as::<_, Self>(
            r#"
            SELECT id, order_number, user_id, store_id, status, total_amount,
                   notes, created_at, updated_at, status_changed_to_pending, status_changed_to_completed
            FROM `orders`
            WHERE `id` = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(order)
    }

    pub async fn get_with_items(
        pool: &MySqlPool,
        id: u64,
    ) -> anyhow::Result<Option<OrderWithItems>> {
        let order = Self::get_by_id(pool, id).await?;

        if let Some(order) = order {
            let items = OrderItemRecord::get_items_with_products(pool, id).await?;
            Ok(Some(OrderWithItems { order, items }))
        } else {
            Ok(None)
        }
    }

    pub async fn create_order(
        pool: &MySqlPool,
        user_context: &UserContext,
        store_id: u64,
        items: &[(u64, i32)], // (product_id, quantity)
        notes: Option<&str>,
    ) -> anyhow::Result<u64> {
        let mut transaction = pool.begin().await?;

        // Generate order number
        let order_number = Self::generate_order_number().await;

        // Calculate total amount
        let mut total_amount: Decimal = Decimal::from_i32(0).unwrap();
        for (product_id, quantity) in items {
            let price_row = sqlx::query("SELECT price FROM products WHERE id = ?")
                .bind(product_id)
                .fetch_one(&mut *transaction)
                .await?;
            let unit_price: Decimal = price_row.get("price");
            let qty = Decimal::from_i32(*quantity).unwrap_or_else(|| Decimal::from_i32(0).unwrap());
            total_amount += unit_price * qty;
        }

        // Create order
        let order_result = sqlx::query(
            r#"
            INSERT INTO `orders` (`order_number`, `user_id`, `store_id`, `total_amount`, `notes`, `status_changed_to_pending`)
            VALUES (?, ?, ?, ?, ?, NOW())
            "#
        )
        .bind(&order_number)
        .bind(user_context.user_id)
        .bind(store_id)
        .bind(total_amount)
        .bind(notes)
        .execute(&mut *transaction)
        .await?;

        let order_id = order_result.last_insert_id();

        // Create order items
        for (product_id, quantity) in items {
            let price_row = sqlx::query("SELECT price FROM products WHERE id = ?")
                .bind(product_id)
                .fetch_one(&mut *transaction)
                .await?;
            let unit_price: Decimal = price_row.get("price");
            let qty = Decimal::from_i32(*quantity).unwrap_or_else(|| Decimal::from_i32(0).unwrap());
            let total_price = unit_price * qty;

            sqlx::query(
                r#"
                INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `unit_price`, `total_price`)
                VALUES (?, ?, ?, ?, ?)
                "#
            )
            .bind(order_id)
            .bind(product_id)
            .bind(quantity)
            .bind(unit_price)
            .bind(total_price)
            .execute(&mut *transaction)
            .await?;

            // Update product stock
            sqlx::query(
                r#"
                UPDATE `products`
                SET `stock_quantity` = `stock_quantity` - ?,
                    `in_stock` = (`stock_quantity` - ?) > 0
                WHERE `id` = ?
                "#,
            )
            .bind(quantity)
            .bind(quantity)
            .bind(product_id)
            .execute(&mut *transaction)
            .await?;
        }

        transaction.commit().await?;
        Ok(order_id)
    }

    pub async fn get_order_by_id(id: u64, pool: &MySqlPool) -> anyhow::Result<Option<Self>> {
        Ok(
            sqlx::query_as::<_, Self>(r#"select * from orders WHERE id = ? limit 1"#)
                .bind(id)
                .fetch_optional(pool)
                .await?,
        )
    }

    pub async fn update_status(
        pool: &MySqlPool,
        id: u64,
        status: StoreOrderStatus,
        notes: Option<&str>,
    ) -> anyhow::Result<bool> {
        let mut query = String::from("UPDATE `orders` SET `status` = ?");
        let mut params: Vec<String> = vec![status.as_db_str().to_string()];

        if let Some(n) = notes {
            query.push_str(", `notes` = ?");
            params.push(n.to_string());
        }

        // Update status change timestamps
        match status {
            StoreOrderStatus::Pending => {
                query.push_str(", `status_changed_to_pending` = NOW()");
            }
            StoreOrderStatus::Delivered => {
                query.push_str(", `status_changed_to_completed` = NOW()");
            }
            _ => {}
        }

        query.push_str(" WHERE `id` = ?");
        params.push(id.to_string());

        let mut sql_query = sqlx::query(&query);
        for param in params {
            sql_query = sql_query.bind(param);
        }

        let result = sql_query.execute(pool).await?;
        Ok(result.rows_affected() > 0)
    }

    async fn generate_order_number() -> String {
        use chrono::Utc;
        let now = Utc::now();
        format!(
            "ORD-{}-{:06}",
            now.format("%Y%m%d"),
            rand::random::<u32>() % 1000000
        )
    }
}

impl OrderItemRecord {
    pub async fn get_items_with_products(
        pool: &MySqlPool,
        order_id: u64,
    ) -> anyhow::Result<Vec<OrderItemWithProduct>> {
        let query_results = sqlx::query_as::<_, OrderItemWithProductQuery>(
            r#"
            SELECT
                oi.id, oi.order_id, oi.product_id, oi.quantity,
                oi.unit_price AS unit_price,
                oi.total_price AS total_price,
                oi.created_at,
                p.name as product_name,
                p.sku as product_sku,
                p.image_url as product_image_url
            FROM `order_items` oi
            JOIN `products` p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            ORDER BY oi.created_at ASC
            "#,
        )
        .bind(order_id)
        .fetch_all(pool)
        .await?;

        let items = query_results.into_iter().map(|q| q.into()).collect();
        Ok(items)
    }
}
