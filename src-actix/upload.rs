use crate::auth::{jwt_validator, ClaimsExtractor};
use actix_web::{post, web, HttpRequest, HttpResponse, Responder};
use actix_web_httpauth::middleware::HttpAuthentication;
use database_common_lib::http_error::Result;
use serde_json::json;
use tokio::fs;
use database_common_lib::database_connection::DatabaseConnectionData;
use crate::products::ProductRecord;

#[post("/product-image/{product_id}")]
pub async fn upload_product_image(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    bytes: web::Bytes,
) -> Result<impl Responder> {
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

    // Ensure we have data
    if bytes.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "No file data provided"
        })));
    }

    let products_dir = "./products";
    if fs::metadata(products_dir).await.is_err() {
        fs::create_dir_all(products_dir).await?;
    }

    let product_id_hash = path.into_inner();

    // Decode hashed product id -> numeric id
    let numeric_id = match serde_hash::hashids::decode_single(product_id_hash.as_str()) {
        Ok(id) => id,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid product id"
            })));
        }
    };

    // Deterministic filename so re-uploads overwrite
    // Use the hashed id in filename to avoid exposing numeric id pattern
    let sanitized: String = product_id_hash
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect();
    if sanitized.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({ "error": "Invalid product id" })));
    }

    let filename = format!("product_{}.png", sanitized);
    let filepath = format!("{}/{}", products_dir, filename);

    // Write (overwrite) file
    if let Err(e) = fs::write(&filepath, &bytes).await {
        return Ok(HttpResponse::InternalServerError().json(json!({
            "error": format!("Failed to save file: {}", e)
        })));
    }

    let url = format!("/products/{}", filename);

    // Update product record image_url
    let pool = connection_data.get_pool().await?;
    match ProductRecord::update(
        &pool,
        numeric_id,
        None,
        None,
        None,
        None,
        Some(url.as_str()),
        None,
        None,
    )
    .await? {
        Some(_product) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "url": url,
            "filename": filename
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "error": "Product not found"
        }))),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    let auth = HttpAuthentication::bearer(jwt_validator);

    cfg.service(
        web::scope("/upload")
            .wrap(auth)
            .service(upload_product_image)
    );
}
