use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_hash::HashIds;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Store,
    Admin,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Store => "store",
            UserRole::Admin => "admin",
        }
    }

    pub fn from_str(s: &str) -> anyhow::Result<Self> {
        match s.to_lowercase().as_str() {
            "store" => Ok(UserRole::Store),
            "admin" => Ok(UserRole::Admin),
            _ => Err(anyhow::anyhow!("Invalid user role: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: u64,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub store_id: Option<u64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub fn get_role(&self) -> anyhow::Result<UserRole> {
        UserRole::from_str(&self.role)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String, // Hashed ID
    pub email: String,
    #[serde(
        serialize_with = "serialize_user_role_lowercase",
        deserialize_with = "deserialize_user_role_lowercase"
    )]
    pub role: UserRole,
    pub store_id: Option<String>, // Hashed store ID
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: serde_hash::hashids::encode_single(user.id),
            email: user.email,
            role: UserRole::from_str(&user.role).unwrap_or(UserRole::Store),
            store_id: user.store_id.map(serde_hash::hashids::encode_single),
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, HashIds)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub role: UserRole,
    #[hash]
    pub store_id: Option<u64>, // Hashed store ID
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: u64, // User ID
    pub email: String,
    #[serde(
        serialize_with = "serialize_lowercase",
        deserialize_with = "deserialize_lowercase"
    )]
    pub role: String,
    pub store_id: Option<u64>,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub role: Option<String>,
    pub store_id: Option<String>, // Hashed store ID
}

fn serialize_lowercase<S>(value: &str, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&value.to_lowercase())
}

fn deserialize_lowercase<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    Ok(s.to_lowercase())
}

fn serialize_user_role_lowercase<S>(value: &UserRole, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(value.as_str())
}

fn deserialize_user_role_lowercase<'de, D>(deserializer: D) -> Result<UserRole, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    UserRole::from_str(&s).map_err(serde::de::Error::custom)
}
