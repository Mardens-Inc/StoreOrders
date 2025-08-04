use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct CategoryRecord {
    #[hash]
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<u64>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<String>, // hashed ID
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<String>, // hashed ID
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}
