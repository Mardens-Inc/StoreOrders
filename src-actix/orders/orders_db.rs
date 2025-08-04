use sqlx::{Executor, MySqlPool};
use crate::orders::inventory;
use crate::orders::orders_data::StoreOrderRecord;

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
	pool.execute(
		r#"
		
		"#,
	)
	    .await?;
	
	inventory::inventory_db::initialize(pool).await?;
	Ok(())
}

impl StoreOrderRecord{
	pub async fn get_orders(pool: &MySqlPool)->anyhow::Result<Vec<Self>>{
		let orders:Vec<Self> = sqlx::query_as(r#"select * from `orders`"#).fetch_all(pool).await?;
		Ok(orders)
	}
}