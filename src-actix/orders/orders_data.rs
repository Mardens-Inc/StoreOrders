use crate::orders::store_order_status::StoreOrderStatus;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::{FromRow, Row};
use sqlx::mysql::MySqlRow;

#[derive(HashIds, Debug, Clone)]
pub struct StoreOrderRecord {
    #[hash]
    pub id: u64,
    pub order_number: String,
    #[hash]
    pub user_id: u64,
    #[hash]
    pub store_id: u64,
    pub status: StoreOrderStatus,
    pub total_amount: Decimal,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub status_changed_to_pending: Option<chrono::NaiveDateTime>,
    pub status_changed_to_completed: Option<chrono::NaiveDateTime>,
}

impl<'r> FromRow<'r, MySqlRow> for StoreOrderRecord {
    fn from_row(row: &'r MySqlRow) -> Result<Self, sqlx::Error> {
        let status_raw: String = row.try_get("status")?;
        let status = StoreOrderStatus::from_str_case_insensitive(&status_raw)
            .ok_or_else(|| sqlx::Error::Protocol(format!("Unexpected status value '{}'", status_raw)))?;
        Ok(Self {
            id: row.try_get("id")?,
            order_number: row.try_get("order_number")?,
            user_id: row.try_get("user_id")?,
            store_id: row.try_get("store_id")?,
            status,
            total_amount: row.try_get("total_amount")?,
            notes: row.try_get("notes")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            status_changed_to_pending: row.try_get("status_changed_to_pending")?,
            status_changed_to_completed: row.try_get("status_changed_to_completed")?,
        })
    }
}

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct OrderItemRecord {
    #[hash]
    pub id: u64,
    pub order_id: u64,
    pub product_id: u64,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub total_price: Decimal,
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
    pub category_name: String,
    pub product_bin_location: String,
    pub product_unit_type: i32,
}

// DTOs for API (convert Decimal -> f64)
#[derive(Debug, HashIds)]
pub struct StoreOrderRecordDto {
    pub id: String,
    pub order_number: String,
    #[hash]
    pub user_id: u64,
    #[hash]
    pub store_id: u64,
    pub status: StoreOrderStatus,
    pub total_amount: f64,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub status_changed_to_pending: Option<chrono::NaiveDateTime>,
    pub status_changed_to_completed: Option<chrono::NaiveDateTime>,
}

impl From<&StoreOrderRecord> for StoreOrderRecordDto {
    fn from(r: &StoreOrderRecord) -> Self {
        Self {
            id: serde_hash::hashids::encode_single(r.id),
            order_number: r.order_number.clone(),
            user_id: r.user_id,
            store_id: r.store_id,
            status: r.status.clone(),
            total_amount: r.total_amount.to_f64().unwrap_or(0.0),
            notes: r.notes.clone(),
            created_at: r.created_at,
            updated_at: r.updated_at,
            status_changed_to_pending: r.status_changed_to_pending,
            status_changed_to_completed: r.status_changed_to_completed,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct OrderItemRecordDto {
    pub id: String,
    pub order_id: String,
    pub product_id: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub created_at: chrono::NaiveDateTime,
}

impl From<&OrderItemRecord> for OrderItemRecordDto {
    fn from(r: &OrderItemRecord) -> Self {
        Self {
            id: serde_hash::hashids::encode_single(r.id),
            order_id: serde_hash::hashids::encode_single(r.order_id),
            product_id: serde_hash::hashids::encode_single(r.product_id),
            quantity: r.quantity,
            unit_price: r.unit_price.to_f64().unwrap_or(0.0),
            total_price: r.total_price.to_f64().unwrap_or(0.0),
            created_at: r.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct OrderItemWithProductDto {
    #[serde(flatten)]
    pub item: OrderItemRecordDto,
    pub product_name: String,
    pub product_sku: String,
    pub product_image_url: Option<String>,
    pub category_name: String,
    pub product_bin_location: String,
    pub product_unit_type: i32,
}

impl From<&OrderItemWithProduct> for OrderItemWithProductDto {
    fn from(r: &OrderItemWithProduct) -> Self {
        Self {
            item: OrderItemRecordDto::from(&r.item),
            product_name: r.product_name.clone(),
            product_sku: r.product_sku.clone(),
            product_image_url: r.product_image_url.clone(),
            category_name: r.category_name.clone(),
            product_bin_location: r.product_bin_location.clone(),
            product_unit_type: r.product_unit_type,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct OrderWithItemsDto {
    #[serde(flatten)]
    pub order: StoreOrderRecordDto,
    pub items: Vec<OrderItemWithProductDto>,
}

impl From<&OrderWithItems> for OrderWithItemsDto {
    fn from(o: &OrderWithItems) -> Self {
        Self {
            order: (&o.order).into(),
            items: o.items.iter().map(|i| i.into()).collect(),
        }
    }
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
    pub store_id: Option<u64>,
    pub role: String,
}

impl UserContext {
    // Create from JWT claims
    pub fn from_claims(user_id: u64, store_id: Option<u64>, role: String) -> Self {
        Self {
            user_id,
            store_id,
            role,
        }
    }

    // Stub implementation - in practice this would come from JWT/session
    pub fn from_request() -> Self {
        Self {
            user_id: 1, // Default user ID for demonstration
            store_id: Some(1), // Default store ID for demonstration
            role: "store".to_string(),
        }
    }
}