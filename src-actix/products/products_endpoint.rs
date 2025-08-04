use crate::auth::{jwt_validator, ClaimsExtractor};
use crate::products::products_data::{CreateProductRequest, ProductFilter, ProductRecord, UpdateProductRequest};
use actix_web::{delete, get, post, put, web, HttpRequest, HttpResponse, Responder};
use actix_web_httpauth::middleware::HttpAuthentication;
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
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateProductRequest>,
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

    let pool = connection_data.get_pool().await?;

    // Decode category_id
    let category_id = serde_hash::hashids::decode_single(&request.category_id)?;

    let product = ProductRecord::create(
        &pool,
        &request.name,
        &request.description,
        &request.sku,
        request.price,
        category_id,
        request.image_url.as_deref(),
        request.stock_quantity,
    ).await?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": product
    })))
}

#[put("/{id}")]
pub async fn update_product(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<UpdateProductRequest>,
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

    let pool = connection_data.get_pool().await?;
    let product_id = serde_hash::hashids::decode_single(&path.as_str())?;

    // Decode category_id if provided
    let category_id = if let Some(category_id_str) = &request.category_id {
        Some(serde_hash::hashids::decode_single(category_id_str)?)
    } else {
        None
    };

    match ProductRecord::update(
        &pool,
        product_id,
        request.name.as_deref(),
        request.description.as_deref(),
        request.sku.as_deref(),
        request.price,
        category_id,
        request.image_url.as_deref(),
        request.in_stock,
        request.stock_quantity,
        request.is_active,
    ).await? {
        Some(product) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": product
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "error": "Product not found"
        })))
    }
}

#[delete("/{id}")]
pub async fn delete_product(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
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

    let pool = connection_data.get_pool().await?;
    let product_id = serde_hash::hashids::decode_single(&path.as_str())?;

    let deleted = ProductRecord::delete(&pool, product_id).await?;

    if deleted {
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Product deleted successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "error": "Product not found"
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    let auth = HttpAuthentication::bearer(jwt_validator);

    cfg.service(
        web::scope("/products")
            .service(get_products)  // Public endpoint - no auth required
            .service(get_product)   // Public endpoint - no auth required
            .service(get_products_by_category)  // Public endpoint - no auth required
            .service(
                web::scope("/admin")
                    .wrap(auth)  // Admin-only endpoints
                    .service(create_product)
                    .service(update_product)
                    .service(delete_product)
            )
            .default_service(web::to(|| async {
                HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
            }))
    );
}
