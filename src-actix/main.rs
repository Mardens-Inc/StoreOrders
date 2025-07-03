#[actix_web::main]
async fn main()->anyhow::Result<()>{
	store_orders_lib::run().await
}
