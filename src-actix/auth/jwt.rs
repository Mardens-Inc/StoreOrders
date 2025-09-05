use crate::auth::Claims;
use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

const JWT_EXPIRATION_HOURS: i64 = 24;
const REFRESH_TOKEN_EXPIRATION_DAYS: i64 = 30;

fn access_secret() -> Result<Vec<u8>> {
    if crate::DEBUG {
        // Development secret
        log::warn!("Using development JWT secret");
        return Ok(b"mardens-store-orders-dev".to_vec());
    }
    // Production secret (hardcoded from .env file)
    Ok(b"c797163fdcd546109c76218bcf32759d".to_vec())
}

fn refresh_secret() -> Result<Vec<u8>> {
    if crate::DEBUG {
        log::warn!("Using development JWT refresh secret");
        return Ok(b"mardens-store-orders-refresh-dev".to_vec());
    }
    // Production refresh secret (hardcoded from .env file)
    Ok(b"3378f21e507e487799bd22f268a3a806".to_vec())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenClaims {
    pub sub: u64,
    pub exp: usize,
    pub iat: usize,
    pub token_type: String,
}

pub fn create_jwt_token(
    user_id: u64,
    email: String,
    role: String,
    store_id: Option<u64>,
) -> Result<String> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_and_verify_access_token_round_trip() {
        // In debug builds, access_secret() falls back to a dev secret, so no env required.
        let token = create_jwt_token(
            42,
            "user@example.com".to_string(),
            "admin".to_string(),
            Some(7),
        )
        .expect("should create jwt");
        let claims = verify_jwt_token(&token).expect("should verify jwt");
        assert_eq!(claims.sub, 42);
        assert_eq!(claims.email, "user@example.com");
        assert_eq!(claims.role, "admin");
        assert_eq!(claims.store_id, Some(7));
        assert!(claims.exp > claims.iat);
    }

    #[test]
    fn create_and_verify_refresh_token_round_trip() {
        let token = create_refresh_token(99).expect("should create refresh token");
        let claims = verify_refresh_token(&token).expect("should verify refresh token");
        assert_eq!(claims.sub, 99);
        assert_eq!(claims.token_type, "refresh");
        assert!(claims.exp > claims.iat);
    }
}
