use crate::products::products_data::{CreateProductRequest, ProductFilter, ProductRecord};
use actix_web::{get, post, put, web, HttpResponse, Responder};
use database_common_lib::{database_connection::DatabaseConnectionData, http_error::Result};
use serde_json::json;

#[get("")]
pub async fn get_products(
    connection_data: web::Data<DatabaseConnectionData>,
    query: web::Query<ProductFilter>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let products = ProductRecord::get_all_with_filter(&pool, &query).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": products,
        "count": products.len()
    })))
}

#[get("/{id}")]
pub async fn get_product(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let product_id = serde_hash::hashids::decode_single(path.as_str())?;

    match ProductRecord::get_by_id(&pool, product_id).await? {
        Some(product) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": product
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Product not found"
        })))
    }
}

#[get("/category/{category_id}")]
pub async fn get_products_by_category(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let category_id = serde_hash::hashids::decode_single(path.as_str())?;

    let products = ProductRecord::get_by_category(&pool, category_id).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": products,
        "count": products.len()
    })))
}

#[post("")]
pub async fn create_product(
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateProductRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let category_id = serde_hash::hashids::decode_single(&request.category_id)?;

    let product_id = ProductRecord::create(
        &pool,
        &request.name,
        &request.description,
        &request.sku,
        request.price,
        category_id,
        request.image_url.as_deref(),
        request.stock_quantity,
    ).await?;

    let product = ProductRecord::get_by_id(&pool, product_id).await?
        .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created product"))?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": product,
        "message": "Product created successfully"
    })))
}

#[put("/{id}/stock")]
pub async fn update_product_stock(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<serde_json::Value>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let product_id = serde_hash::hashids::decode_single(path.as_str())?;

    let quantity = request.get("quantity")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| anyhow::anyhow!("Invalid quantity"))? as i32;

    let updated = ProductRecord::update_stock(&pool, product_id, quantity).await?;

    if updated {
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Product stock updated successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Product not found"
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/products")
            .service(get_products)
            .service(get_product)
            .service(get_products_by_category)
            .service(create_product)
            .service(update_product_stock)
            .default_service(web::to(|| async {
                HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
            }))
    );
}
