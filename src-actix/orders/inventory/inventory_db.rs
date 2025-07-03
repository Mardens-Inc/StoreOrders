use sqlx::{Executor, MySqlPool};

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
	pool.execute(
		r#"
		
		"#,
	)
	    .await?;
	
	Ok(())
}