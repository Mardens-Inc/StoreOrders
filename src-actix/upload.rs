use crate::auth::ClaimsExtractor;
use actix_web::{post, web, HttpRequest, HttpResponse, Responder};
use database_common_lib::http_error::Result;
use serde_json::json;
use tokio::fs;
use uuid::Uuid;

#[post("/upload")]
pub async fn upload_product_image(req: HttpRequest, bytes: web::Bytes) -> Result<impl Responder> {
    // Check if user is admin
    if let Some(claims) = req.get_claims() {
        if claims.role != "admin" {
            return Ok(HttpResponse::Forbidden().json(json!({
                "error": "Admin access required"
            })));
        }
    } else {
        return Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Authentication required"
        })));
    }

    // Create products directory if it doesn't exist
    let products_dir = "products";
    if fs::metadata(products_dir).await.is_err() {
        fs::create_dir_all(products_dir).await?;
    }

    // Check if we have any data
    if bytes.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "No file data provided"
        })));
    }

    // Generate unique filename with .png extension (since cropped images are PNG)
    let unique_filename = format!(
        "product_{}_{}.png",
        &Uuid::new_v4().to_string().replace("-", "")[..8],
        chrono::Utc::now().timestamp()
    );

    let filepath = format!("{}/{}", products_dir, unique_filename);

    // Write the file data directly
    match fs::write(&filepath, &bytes).await {
        Ok(_) => {
            // Return the file URL
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "url": format!("/products/{}", unique_filename),
                "filename": unique_filename
            })))
        }
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": format!("Failed to save file: {}", e)
        }))),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(upload_product_image);
}
