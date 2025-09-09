use crate::auth::{jwt_validator, ClaimsExtractor, UserRole};
use crate::orders::orders_data::{
    AddToCartRequest, CreateOrderRequest, OrderWithItemsDto, StoreOrderRecord, StoreOrderRecordDto,
    UpdateOrderStatusRequest, UserContext,
};
use actix_web::{get, post, put, web, HttpRequest, HttpResponse, Responder};
use actix_web_httpauth::middleware::HttpAuthentication;
use database_common_lib::{database_connection::DatabaseConnectionData, http_error::Result};
use serde_json::json;
static MANIFEST_TEMPLATE: &str = include_str!("../../templates/order-manifest-template.html.tera");
#[get("")]
pub async fn get_orders(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    let claims = req
        .get_claims()
        .ok_or_else(|| anyhow::anyhow!("Authentication required"))?;
    if claims.role == "admin" {
        let orders = StoreOrderRecord::get_all(&pool).await?;
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": orders
        })))
    } else if let Some(store_id) = claims.store_id {
        let orders = StoreOrderRecord::get_orders_for_store(&pool, store_id).await?;
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": orders
        })))
    } else {
        Ok(HttpResponse::Forbidden().json(json!({
            "success": false,
            "error": "Access denied: You can only view orders for your store"
        })))
    }
}

#[get("/store/{store_id}")]
pub async fn get_store_orders(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let store_id = serde_hash::hashids::decode_single(path.as_str())?;

    let claims = req
        .get_claims()
        .ok_or_else(|| anyhow::anyhow!("Authentication required"))?;

    // Only allow access if user is admin or belongs to this store
    let role = UserRole::from_str(&claims.role)?;
    match role {
        UserRole::Admin => {} // Admins can access any store
        UserRole::Store => {
            if claims.store_id != Some(store_id) {
                return Ok(HttpResponse::Forbidden().json(json!({
                    "success": false,
                    "error": "Access denied: You can only view orders for your store"
                })));
            }
        }
    }

    let orders = StoreOrderRecord::get_orders_for_store(&pool, store_id).await?;
    let dto: Vec<StoreOrderRecordDto> = orders.iter().map(|o| o.into()).collect();
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": dto
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
        Some(order) => {
            let dto = OrderWithItemsDto::from(&order);
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "data": dto
            })))
        }
        None => Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Order not found"
        }))),
    }
}

#[post("")]
pub async fn create_order(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateOrderRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    let claims = req
        .get_claims()
        .ok_or_else(|| anyhow::anyhow!("Authentication required"))?;

    let store_id = serde_hash::hashids::decode_single(&request.store_id)?;

    // Store users can only create orders for their own store
    let role = UserRole::from_str(&claims.role)?;
    if matches!(role, UserRole::Store) && claims.store_id != Some(store_id) {
        return Ok(HttpResponse::Forbidden().json(json!({
            "success": false,
            "error": "Access denied: You can only create orders for your store"
        })));
    }

    // Create user context from JWT claims
    let user_context = UserContext::from_claims(claims.sub, claims.store_id, claims.role.clone());

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
    let dto = OrderWithItemsDto::from(&order);
    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": dto,
        "message": "Order created successfully"
    })))
}

#[put("/{id}/status")]
pub async fn update_order_status(
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<UpdateOrderStatusRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let order_id = serde_hash::hashids::decode_single(path.as_str())?;

    // Require authentication and extract role/store ownership
    let claims = req
        .get_claims()
        .ok_or_else(|| anyhow::anyhow!("Authentication required"))?;
    let role = UserRole::from_str(&claims.role)?;

    // Load current order to enforce ownership and transitions
    let existing = StoreOrderRecord::get_by_id(&pool, order_id).await?;
    let Some(existing_order) = existing else {
        return Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Order not found"
        })));
    };

    // Ownership: store users can only modify orders for their own store
    match role {
        UserRole::Admin => { /* allowed */ }
        UserRole::Store => {
            if claims.store_id != Some(existing_order.store_id) {
                return Ok(HttpResponse::Forbidden().json(json!({
                    "success": false,
                    "error": "Access denied: You can only update orders for your store"
                })));
            }
        }
    }

    // Enforce allowed status transitions per role
    use crate::orders::store_order_status::StoreOrderStatus;
    let target_status = request.status.clone();

    match role {
        UserRole::Admin => {
            // Admins can change orders from Pending to Shipped or Delivered only
            if existing_order.status != StoreOrderStatus::Pending {
                return Ok(HttpResponse::BadRequest().json(json!({
                    "success": false,
                    "error": "Only orders in Pending status can be updated by admin"
                })));
            }
            if !(matches!(
                target_status,
                StoreOrderStatus::Shipped | StoreOrderStatus::Delivered
            )) {
                return Ok(HttpResponse::BadRequest().json(json!({
                    "success": false,
                    "error": "Admin can only set status to Shipped or Delivered"
                })));
            }
        }
        UserRole::Store => {
            // Store can only mark as Delivered
            if target_status != StoreOrderStatus::Delivered {
                return Ok(HttpResponse::BadRequest().json(json!({
                    "success": false,
                    "error": "Store can only set status to Delivered"
                })));
            }
            // Optional: prevent redundant updates
            if existing_order.status == StoreOrderStatus::Delivered {
                let current = StoreOrderRecord::get_with_items(&pool, order_id).await?;
                if let Some(o) = current {
                    let dto = OrderWithItemsDto::from(&o);
                    return Ok(HttpResponse::Ok().json(json!({
                        "success": true,
                        "data": dto,
                        "message": "Order already delivered"
                    })));
                }
            }
        }
    }

    let updated =
        StoreOrderRecord::update_status(&pool, order_id, target_status, request.notes.as_deref())
            .await?;

    if updated {
        let order = StoreOrderRecord::get_with_items(&pool, order_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Order not found after update"))?;
        let dto = OrderWithItemsDto::from(&order);
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": dto,
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
    req: HttpRequest,
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<AddToCartRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    let claims = req
        .get_claims()
        .ok_or_else(|| anyhow::anyhow!("Authentication required"))?;

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
                "quantity": request.quantity,
                "user_id": serde_hash::hashids::encode_single(claims.sub)
            }
        })))
    } else {
        Ok(HttpResponse::BadRequest().json(json!({
            "success": false,
            "error": "Product not found or out of stock"
        })))
    }
}

#[get("/{id}/manifest")]
pub async fn get_order_manifest(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let order_id = serde_hash::hashids::decode_single(path.as_str())?;

    let order = match StoreOrderRecord::get_with_items(&pool, order_id).await? {
        Some(order) => OrderWithItemsDto::from(&order),
        None => {
            return Ok(HttpResponse::NotFound().json(json!({
                "success": false,
                "error": "Order not found"
            })))
        }
    };
    let mut tera = tera::Tera::default();
    tera.add_raw_template("order-manifest-template", MANIFEST_TEMPLATE)
        .unwrap();
    let manifest = tera
        .render(
            "order-manifest-template",
            &tera::Context::from_serialize(order).map_err(|_| {
                HttpResponse::InternalServerError().json(json!({
                    "message": "Failed to render manifest template",
                }))
            })?,
        )
        .unwrap();
    Ok(HttpResponse::Ok().content_type("text/html").body(manifest))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    let auth = HttpAuthentication::bearer(jwt_validator);

    cfg.service(
        web::scope("/orders")
            .wrap(auth)
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
