use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use serde_hash::hashids::{decode_single, encode_single};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "u8", into = "u8")] // serialize/deserialize as number in API
pub enum UnitType {
    Each = 0,
    Case = 1,
    Roll = 2,
}

impl TryFrom<u8> for UnitType {
    type Error = &'static str;
    fn try_from(v: u8) -> Result<Self, Self::Error> {
        match v {
            0 => Ok(UnitType::Each),
            1 => Ok(UnitType::Case),
            2 => Ok(UnitType::Roll),
            _ => Err("invalid unit type"),
        }
    }
}
impl From<UnitType> for u8 {
    fn from(v: UnitType) -> Self { v as u8 }
}

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
    // New fields
    pub bin_location: String,
    /// Stored as tinyint in DB; exposed as number in API
    pub unit_type: i32,
    // Added fields used by orders/cart
    #[serde(serialize_with = "serialize_decimal_to_f32")]
    pub price: rust_decimal::Decimal,
    pub in_stock: bool,
    pub stock_quantity: f32,
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
    pub price: rust_decimal::Decimal,
    pub bin_location: String,
    pub unit_type: UnitType,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sku: Option<String>,
    pub category_id: Option<String>, // hashed ID
    pub image_url: Option<String>,
    pub is_active: Option<bool>,
    pub price: Option<rust_decimal::Decimal>,
    pub bin_location: Option<String>,
    pub unit_type: Option<UnitType>,
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

fn serialize_decimal_to_f32<S>(value: &rust_decimal::Decimal, serializer: S) -> Result<S::Ok, S::Error>
                               where
    S: serde::Serializer,
{
    value.to_f32().serialize(serializer)
}