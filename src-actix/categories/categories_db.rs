use sqlx::{Executor, MySqlPool};
use crate::categories::categories_data::CategoryRecord;

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
    pool.execute(
        r#"
        CREATE TABLE IF NOT EXISTS `categories` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `icon` VARCHAR(255),
            `parent_id` BIGINT UNSIGNED,
            `sort_order` INT NOT NULL DEFAULT 0,
            `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
            INDEX `idx_parent_id` (`parent_id`),
            INDEX `idx_active_sort` (`is_active`, `sort_order`)
        )
        "#,
    )
    .await?;

    Ok(())
}

impl CategoryRecord {
    pub async fn get_all(pool: &MySqlPool) -> anyhow::Result<Vec<Self>> {
        let categories = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM `categories`
            WHERE `is_active` = TRUE
            ORDER BY `sort_order` ASC, `name` ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(categories)
    }

    pub async fn get_by_id(pool: &MySqlPool, id: u64) -> anyhow::Result<Option<Self>> {
        let category = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM `categories`
            WHERE `id` = ? AND `is_active` = TRUE
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }

    pub async fn get_by_parent(pool: &MySqlPool, parent_id: Option<u64>) -> anyhow::Result<Vec<Self>> {
        let categories = match parent_id {
            Some(pid) => {
                sqlx::query_as::<_, Self>(
                    r#"
                    SELECT * FROM `categories`
                    WHERE `parent_id` = ? AND `is_active` = TRUE
                    ORDER BY `sort_order` ASC, `name` ASC
                    "#
                )
                .bind(pid)
                .fetch_all(pool)
                .await?
            },
            None => {
                sqlx::query_as::<_, Self>(
                    r#"
                    SELECT * FROM `categories`
                    WHERE `parent_id` IS NULL AND `is_active` = TRUE
                    ORDER BY `sort_order` ASC, `name` ASC
                    "#
                )
                .fetch_all(pool)
                .await?
            }
        };

        Ok(categories)
    }

    pub async fn create(
        pool: &MySqlPool,
        name: &str,
        description: Option<&str>,
        icon: Option<&str>,
        parent_id: Option<u64>,
        sort_order: i32,
    ) -> anyhow::Result<u64> {
        let result = sqlx::query(
            r#"
            INSERT INTO `categories` (`name`, `description`, `icon`, `parent_id`, `sort_order`)
            VALUES (?, ?, ?, ?, ?)
            "#
        )
        .bind(name)
        .bind(description)
        .bind(icon)
        .bind(parent_id)
        .bind(sort_order)
        .execute(pool)
        .await?;

        Ok(result.last_insert_id())
    }

    pub async fn update(
        pool: &MySqlPool,
        id: u64,
        name: Option<&str>,
        description: Option<&str>,
        icon: Option<&str>,
        parent_id: Option<u64>,
        sort_order: Option<i32>,
        is_active: Option<bool>,
    ) -> anyhow::Result<bool> {
        let mut query_parts = Vec::new();
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(n) = name {
            query_parts.push("`name` = ?");
            bind_values.push(n.to_string());
        }
        if let Some(d) = description {
            query_parts.push("`description` = ?");
            bind_values.push(d.to_string());
        }
        if let Some(i) = icon {
            query_parts.push("`icon` = ?");
            bind_values.push(i.to_string());
        }
        if let Some(pid) = parent_id {
            query_parts.push("`parent_id` = ?");
            bind_values.push(pid.to_string());
        }
        if let Some(so) = sort_order {
            query_parts.push("`sort_order` = ?");
            bind_values.push(so.to_string());
        }
        if let Some(active) = is_active {
            query_parts.push("`is_active` = ?");
            bind_values.push(active.to_string());
        }

        if query_parts.is_empty() {
            return Ok(false);
        }

        let query_str = format!(
            "UPDATE `categories` SET {} WHERE `id` = ?",
            query_parts.join(", ")
        );

        let mut query = sqlx::query(&query_str);
        for value in &bind_values {
            query = query.bind(value);
        }
        query = query.bind(id);

        let result = query.execute(pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &MySqlPool, id: u64) -> anyhow::Result<bool> {
        let result = sqlx::query(
            r#"
            UPDATE `categories` SET `is_active` = FALSE WHERE `id` = ?
            "#
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
