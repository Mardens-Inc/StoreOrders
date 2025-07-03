use sqlx::{Executor, MySqlPool};
use crate::orders::inventory;

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
	pool.execute(
		r#"
		
		"#,
	)
	    .await?;
	
	inventory::inventory_db::initialize(pool).await?;
	Ok(())
}