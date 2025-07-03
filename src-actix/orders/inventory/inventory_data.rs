use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct SingleStoreOrderInventoryRecord {
    #[hash]
    pub id: u64,
    pub order_number: u64,
    pub inventory_id: u64,
    pub quantity: u16,
}
