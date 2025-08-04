use crate::orders::store_order_status::StoreOrderStatus;
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct StoreOrderRecord {
    #[hash]
    pub id: u64,
    pub order_number: u64,
    pub status: StoreOrderStatus,
    pub created_at: chrono::NaiveDateTime,
    pub status_changed_to_pending: Option<chrono::NaiveDateTime>,
    pub status_changed_to_completed: Option<chrono::NaiveDateTime>,
}

impl StoreOrderRecord {
    // Data implementation
    // ...
}