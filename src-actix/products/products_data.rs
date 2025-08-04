use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(HashIds, Debug, Clone, FromRow)]
pub struct ProductRecord {
    #[hash]
    pub id: u64,
    pub name: String,
    pub description: String,
    pub sku: String,
    pub price: f32,
    pub category_id: u64,
    pub image_url: Option<String>,
    pub in_stock: bool,
    pub stock_quantity: i32,
    pub is_active: bool,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductWithCategory {
    #[serde(flatten)]
    pub product: ProductRecord,
    pub category_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub description: String,
    pub sku: String,
    pub price: f32,
    pub category_id: String, // hashed ID
    pub image_url: Option<String>,
    pub stock_quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sku: Option<String>,
    pub price: Option<f32>,
    pub category_id: Option<String>, // hashed ID
    pub image_url: Option<String>,
    pub in_stock: Option<bool>,
    pub stock_quantity: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductFilter {
    pub category_id: Option<String>,
    pub search: Option<String>,
    pub in_stock_only: Option<bool>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}
