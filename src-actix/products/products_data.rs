use serde::{Deserialize, Serialize};
use serde_hash::hashids::{decode_single, encode_single};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Debug, Clone, FromRow)]
pub struct ProductRecord {
    #[serde(
        serialize_with = "serialize_hash_id",
        deserialize_with = "deserialize_hash_id"
    )]
    pub id: u64,
    pub name: String,
    pub description: String,
    pub sku: String,
    #[serde(
        serialize_with = "serialize_hash_id",
        deserialize_with = "deserialize_hash_id"
    )]
    pub category_id: u64,
    pub image_url: Option<String>,
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
    pub category_id: String, // hashed ID
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sku: Option<String>,
    pub category_id: Option<String>, // hashed ID
    pub image_url: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductFilter {
    pub category_id: Option<String>,
    pub search: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

fn serialize_hash_id<S>(value: &u64, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    let hash = encode_single(*value);
    hash.serialize(serializer)
}

fn deserialize_hash_id<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::Deserialize;
    let hash = String::deserialize(deserializer)?;
    decode_single(&hash).map_err(|_| serde::de::Error::custom("Failed to decode hash ID"))
}
