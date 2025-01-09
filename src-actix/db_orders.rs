use crate::data_database_connection::DatabaseConnectionData;
use crate::data_orders::{Order, OrderListResponse, OrderStatus};
use crate::traits::FromNumber;
use crate::DEBUG;
use log::{debug, error};
use sqlx::{AnyPool, Row};
use std::error::Error;

pub async fn initialize(data: Option<&DatabaseConnectionData>) -> Result<(), Box<dyn Error>> {
    let pool = create_pool(data).await?;
    sqlx::query(
        r#"
		CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			products TEXT NOT NULL,
			store_id INTEGER NOT NULL,
			status INTEGER NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		)
		"#,
    )
    .execute(&pool)
    .await?;

    Ok(())
}

async fn create_pool(data: Option<&DatabaseConnectionData>) -> Result<AnyPool, Box<dyn Error>> {
    if DEBUG {
        debug!("Creating SQLite debug connection");
        Ok(AnyPool::connect("sqlite://./orders.db").await?)
    } else if let Some(data) = data {
        debug!("Creating MySQL production connection");
        Ok(AnyPool::connect(
            format!(
                "mysql://{}:{}@{}/stores",
                data.user, data.password, data.host
            )
            .as_str(),
        )
        .await?)
    } else {
        error!("No database connection data provided");
        Err("No database connection data provided".into())
    }
}

pub async fn list(
    search: Option<String>,
    limit: u32,
    offset: u32,
    data: Option<&DatabaseConnectionData>,
) -> Result<OrderListResponse, Box<dyn Error>> {
    let pool = create_pool(data).await?;

    let query = format!(
        r#"
		SELECT * FROM orders
		{}
		LIMIT {}
		OFFSET {}
		"#,
        if let Some(search) = search {
            format!("WHERE store_id = {}", search)
        } else {
            "".to_string()
        },
        limit,
        offset,
    );

    let result = sqlx::query(query.as_str()).fetch_all(&pool).await?;
    let total = result.len() as u32;
    let results = result
        .into_iter()
        .map(|row| Order {
            id: row.get("id"),
            store: row.get::<i64, _>("store_id") as u8,
            status: OrderStatus::from_number(row.get::<i64, _>("status"))
                .unwrap_or(OrderStatus::CANCELLED),
            week: row.get::<i64, _>("week") as u8,
            created_at: row.get("created_at"),
        })
        .collect();
    Ok(OrderListResponse {
        results,
        total,
        limit,
        offset,
    })
}

pub async fn all(
    data: Option<&DatabaseConnectionData>,
) -> Result<OrderListResponse, Box<dyn Error>> {
    list(None, u32::MAX, 0, data).await
}

pub async fn insert(
    order: Order,
    data: Option<&DatabaseConnectionData>,
) -> Result<(), Box<dyn Error>> {
    let pool = create_pool(data).await?;
    sqlx::query(
        r#"
		INSERT INTO orders (store_id, status, week)
		VALUES (?, ?, ?)
		"#,
    )
    .bind(order.store as i64)
    .bind(order.status as i64)
    .bind(order.week as i64)
    .execute(&pool)
    .await?;
    Ok(())
}
