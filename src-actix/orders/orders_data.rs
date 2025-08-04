use crate::orders::store_order_status::StoreOrderStatus;
use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct StoreOrderRecord {
    #[hash]
    pub id: u64,
    pub order_number: String,
    pub user_id: u64,
    pub store_id: u64,
    pub status: StoreOrderStatus,
    pub total_amount: f32,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub status_changed_to_pending: Option<chrono::NaiveDateTime>,
    pub status_changed_to_completed: Option<chrono::NaiveDateTime>,
}

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct OrderItemRecord {
    #[hash]
    pub id: u64,
    pub order_id: u64,
    pub product_id: u64,
    pub quantity: i32,
    pub unit_price: f32,
    pub total_price: f32,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderWithItems {
    #[serde(flatten)]
    pub order: StoreOrderRecord,
    pub items: Vec<OrderItemWithProduct>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderItemWithProduct {
    #[serde(flatten)]
    pub item: OrderItemRecord,
    pub product_name: String,
    pub product_sku: String,
    pub product_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub store_id: String, // hashed ID
    pub items: Vec<CreateOrderItemRequest>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOrderItemRequest {
    pub product_id: String, // hashed ID
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddToCartRequest {
    pub product_id: String, // hashed ID
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: StoreOrderStatus,
    pub notes: Option<String>,
}

// Stub UserContext for authentication
#[derive(Debug, Clone)]
pub struct UserContext {
    pub user_id: u64,
    pub store_id: u64,
    pub username: String,
}

impl UserContext {
    // Stub implementation - in practice this would come from JWT/session
    pub fn from_request() -> Self {
        Self {
            user_id: 1, // Default user ID for demonstration
            store_id: 1, // Default store ID for demonstration
            username: "demo_user".to_string(),
        }
    }
}