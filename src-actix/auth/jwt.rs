use crate::auth::Claims;
use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

const JWT_EXPIRATION_HOURS: i64 = 24;
const REFRESH_TOKEN_EXPIRATION_DAYS: i64 = 30;

fn access_secret() -> Result<Vec<u8>> {
    if let Ok(secret) = std::env::var("JWT_ACCESS_SECRET") {
        if !secret.is_empty() {
            return Ok(secret.into_bytes());
        }
    }
    if let Ok(secret) = std::env::var("JWT_SECRET") {
        if !secret.is_empty() {
            return Ok(secret.into_bytes());
        }
    }
    if crate::DEBUG {
        // Development fallback to keep DX reasonable
        return Ok(b"mardens-store-orders-dev".to_vec());
    }
    Err(anyhow::anyhow!(
        "JWT_ACCESS_SECRET (or JWT_SECRET) is not set; refusing to operate in production"
    ))
}

fn refresh_secret() -> Result<Vec<u8>> {
    if let Ok(secret) = std::env::var("JWT_REFRESH_SECRET") {
        if !secret.is_empty() {
            return Ok(secret.into_bytes());
        }
    }
    if let Ok(secret) = std::env::var("JWT_SECRET") {
        if !secret.is_empty() {
            return Ok(secret.into_bytes());
        }
    }
    if crate::DEBUG {
        return Ok(b"mardens-store-orders-refresh-dev".to_vec());
    }
    Err(anyhow::anyhow!(
        "JWT_REFRESH_SECRET (or JWT_SECRET) is not set; refusing to operate in production"
    ))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenClaims {
    pub sub: u64,
    pub exp: usize,
    pub iat: usize,
    pub token_type: String,
}

pub fn create_jwt_token(user_id: u64, email: String, role: String, store_id: Option<u64>) -> Result<String> {
    let now = Utc::now();
    let expiration = now + Duration::hours(JWT_EXPIRATION_HOURS);

    let claims = Claims {
        sub: user_id,
        email,
        role,
        store_id,
        exp: expiration.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    let header = Header::new(Algorithm::HS256);
    let key_bytes = access_secret()?;
    let encoding_key = EncodingKey::from_secret(&key_bytes);

    encode(&header, &claims, &encoding_key)
        .map_err(|e| anyhow::anyhow!("Failed to create JWT token: {}", e))
}

pub fn create_refresh_token(user_id: u64) -> Result<String> {
    let now = Utc::now();
    let expiration = now + Duration::days(REFRESH_TOKEN_EXPIRATION_DAYS);

    let claims = RefreshTokenClaims {
        sub: user_id,
        exp: expiration.timestamp() as usize,
        iat: now.timestamp() as usize,
        token_type: "refresh".to_string(),
    };

    let header = Header::new(Algorithm::HS256);
    let key_bytes = refresh_secret()?;
    let encoding_key = EncodingKey::from_secret(&key_bytes);

    encode(&header, &claims, &encoding_key)
        .map_err(|e| anyhow::anyhow!("Failed to create refresh token: {}", e))
}

pub fn verify_jwt_token(token: &str) -> Result<Claims> {
    let key_bytes = access_secret()?;
    let decoding_key = DecodingKey::from_secret(&key_bytes);
    let validation = Validation::new(Algorithm::HS256);

    decode::<Claims>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|e| anyhow::anyhow!("Failed to verify JWT token: {}", e))
}

pub fn verify_refresh_token(token: &str) -> Result<RefreshTokenClaims> {
    let key_bytes = refresh_secret()?;
    let decoding_key = DecodingKey::from_secret(&key_bytes);
    let validation = Validation::new(Algorithm::HS256);

    decode::<RefreshTokenClaims>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|e| anyhow::anyhow!("Failed to verify refresh token: {}", e))
}
