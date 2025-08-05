use rust_decimal::Decimal;
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
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub price: Decimal,
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
    #[serde(deserialize_with = "deserialize_f64_as_decimal")]
    pub price: Decimal,
    pub category_id: String, // hashed ID
    pub image_url: Option<String>,
    pub stock_quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sku: Option<String>,
    #[serde(deserialize_with = "deserialize_option_f64_as_decimal", default)]
    pub price: Option<Decimal>,
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

// Custom serializer to convert Decimal to f64 for JSON
fn serialize_decimal_as_f64<S>(value: &Decimal, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    use serde::Serialize;
    let float_value = value
        .to_string()
        .parse::<f64>()
        .map_err(|_| serde::ser::Error::custom("Failed to convert Decimal to f64"))?;
    float_value.serialize(serializer)
}

// Custom deserializer to convert f64 to Decimal
fn deserialize_f64_as_decimal<'de, D>(deserializer: D) -> Result<Decimal, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::Deserialize;
    use std::str::FromStr;

    let float_value = f64::deserialize(deserializer)?;
    Decimal::from_str(&float_value.to_string())
        .map_err(|_| serde::de::Error::custom("Failed to convert f64 to Decimal"))
}

// Custom deserializer for Option<Decimal>
fn deserialize_option_f64_as_decimal<'de, D>(deserializer: D) -> Result<Option<Decimal>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::Deserialize;
    use std::str::FromStr;

    let opt_float = Option::<f64>::deserialize(deserializer)?;
    match opt_float {
        Some(float_value) => Decimal::from_str(&float_value.to_string())
            .map(Some)
            .map_err(|_| serde::de::Error::custom("Failed to convert f64 to Decimal")),
        None => Ok(None),
    }
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
