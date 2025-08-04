use actix_web::{get, web, HttpResponse, Responder};
use serde_json::json;
use database_common_lib::http_error::Result;

#[get("")]
pub async fn get_orders() -> Result<impl Responder> {

	Ok(HttpResponse::Ok().finish())
}

pub fn configure(cfg: &mut web::ServiceConfig) {
	cfg.service(
		web::scope("/orders")
			.default_service(web::to(|| async {
				HttpResponse::NotFound().json(json!({
                    "error": "API endpoint not found".to_string(),
                }))
			})),
	);
}