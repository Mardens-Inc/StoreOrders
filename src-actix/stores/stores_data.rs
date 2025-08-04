use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct StoreRecord {
    #[hash]
    pub id: u64,
    pub city: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateStoreRequest {
    pub city: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStoreRequest {
    pub city: Option<String>,
    pub address: Option<String>,
}
