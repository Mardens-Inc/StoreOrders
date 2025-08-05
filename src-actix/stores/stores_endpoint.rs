use crate::stores::stores_data::{CreateStoreRequest, StoreRecord, UpdateStoreRequest};
use actix_web::{delete, get, post, put, web, HttpResponse, Responder};
use database_common_lib::{database_connection::DatabaseConnectionData, http_error::Result};
use serde_json::json;
use crate::auth::{jwt_validator};
use actix_web_httpauth::middleware::HttpAuthentication;

#[get("")]
pub async fn get_stores(
    connection_data: web::Data<DatabaseConnectionData>,
    query: web::Query<serde_json::Value>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    // Check if city filter is provided
    let stores = if let Some(city) = query.get("city").and_then(|v| v.as_str()) {
        StoreRecord::get_by_city(&pool, city).await?
    } else {
        StoreRecord::get_all(&pool).await?
    };

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": stores,
        "count": stores.len()
    })))
}

#[get("/{id}")]
pub async fn get_store(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let store_id = serde_hash::hashids::decode_single(&path.as_str())?;

    match StoreRecord::get_by_id(&pool, store_id).await? {
        Some(store) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": store
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "error": "Store not found"
        }))),
    }
}

#[post("")]
pub async fn create_store(
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateStoreRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    let store = StoreRecord::create(&pool, &request).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": store
    })))
}

#[put("/{id}")]
pub async fn update_store(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<UpdateStoreRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let store_id = serde_hash::hashids::decode_single(&path.as_str())?;

    match StoreRecord::update(&pool, store_id, &request).await? {
        Some(store) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": store
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "error": "Store not found"
        }))),
    }
}

#[delete("/{id}")]
pub async fn delete_store(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let store_id = serde_hash::hashids::decode_single(&path.as_str())?;

    let deleted = StoreRecord::delete(&pool, store_id).await?;

    if deleted {
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Store deleted successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "error": "Store not found"
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    let auth = HttpAuthentication::bearer(jwt_validator);

    cfg.service(
        web::scope("/stores")
            // Public endpoints - no auth required for reading
            .service(get_stores)
            .service(get_store)
            // Admin-only endpoints with authentication
            .service(
                web::scope("/admin")
                    .wrap(auth)
                    .service(create_store)
                    .service(update_store)
                    .service(delete_store)
            )
            .default_service(web::to(|| async {
                HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
            })),
    );
}
