use crate::orders::orders_data::{
    AddToCartRequest, CreateOrderRequest, StoreOrderRecord, UpdateOrderStatusRequest, UserContext,
};
use actix_web::{get, post, put, web, HttpResponse, Responder};
use database_common_lib::{database_connection::DatabaseConnectionData, http_error::Result};
use serde_json::json;

#[get("")]
pub async fn get_orders(
    connection_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let user_context = UserContext::from_request(); // Stub authentication

    let orders = StoreOrderRecord::get_orders_for_user(&pool, user_context.user_id).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": orders
    })))
}

#[get("/store/{store_id}")]
pub async fn get_store_orders(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let store_id = serde_hash::hashids::decode_single(path.as_str())?;

    let orders = StoreOrderRecord::get_orders_for_store(&pool, store_id).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": orders
    })))
}

#[get("/{id}")]
pub async fn get_order(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let order_id = serde_hash::hashids::decode_single(path.as_str())?;

    match StoreOrderRecord::get_with_items(&pool, order_id).await? {
        Some(order) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": order
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Order not found"
        }))),
    }
}

#[post("")]
pub async fn create_order(
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateOrderRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let user_context = UserContext::from_request(); // Stub authentication

    let store_id = serde_hash::hashids::decode_single(&request.store_id)?;

    // Convert items to (product_id, quantity) tuples
    let mut items = Vec::new();
    for item in &request.items {
        let product_id = serde_hash::hashids::decode_single(&item.product_id)?;
        items.push((product_id, item.quantity));
    }

    let order_id = StoreOrderRecord::create_order(
        &pool,
        &user_context,
        store_id,
        &items,
        request.notes.as_deref(),
    )
    .await?;

    let order = StoreOrderRecord::get_with_items(&pool, order_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created order"))?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": order,
        "message": "Order created successfully"
    })))
}

#[put("/{id}/status")]
pub async fn update_order_status(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<UpdateOrderStatusRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let order_id = serde_hash::hashids::decode_single(path.as_str())?;

    let updated = StoreOrderRecord::update_status(
        &pool,
        order_id,
        request.status.clone(),
        request.notes.as_deref(),
    )
    .await?;

    if updated {
        let order = StoreOrderRecord::get_with_items(&pool, order_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Order not found after update"))?;

        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": order,
            "message": "Order status updated successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Order not found"
        })))
    }
}

#[post("/cart/add")]
pub async fn add_to_cart(
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<AddToCartRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let user_context = UserContext::from_request(); // Stub authentication

    let product_id = serde_hash::hashids::decode_single(&request.product_id)?;

    // In a real implementation, you might have a separate cart table
    // For now, we'll just validate the product exists and return success
    let product_exists = sqlx::query(
        "SELECT id FROM products WHERE id = ? AND is_active = TRUE AND in_stock = TRUE",
    )
    .bind(product_id)
    .fetch_optional(&pool)
    .await?;

    if product_exists.is_some() {
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Product added to cart successfully",
            "data": {
                "product_id": request.product_id,
                "quantity": request.quantity
            }
        })))
    } else {
        Ok(HttpResponse::BadRequest().json(json!({
            "success": false,
            "error": "Product not found or out of stock"
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/orders")
            .service(get_orders)
            .service(get_store_orders)
            .service(get_order)
            .service(create_order)
            .service(update_order_status)
            .service(add_to_cart)
            .default_service(web::to(|| async {
                HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
            })),
    );
}
