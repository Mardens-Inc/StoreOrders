use crate::auth::{User, UserRole, PasswordResetToken};
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use sqlx::MySqlPool;
use uuid::Uuid;

pub async fn create_tables(pool: &MySqlPool) -> Result<()> {
    // Create a user's table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('store', 'admin') NOT NULL DEFAULT 'store',
            store_id INT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_store_id (store_id),
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(pool)
    .await?;


    // Create a password reset tokens table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id),
            INDEX idx_expires_at (expires_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn create_user(
    pool: &MySqlPool,
    email: &str,
    password: &str,
    role: UserRole,
    store_id: Option<u64>,
) -> Result<User> {
    // Validate email domain
    if !email.ends_with("@mardens.com") {
        return Err(anyhow::anyhow!("Email must be a @mardens.com address"));
    }

    // Hash password
    let password_hash = hash(password, DEFAULT_COST)?;

    // For store users, store_id is required
    if matches!(role, UserRole::Store) && store_id.is_none() {
        return Err(anyhow::anyhow!("Store users must have a store_id"));
    }

    // For admin users, store_id should be None
    if matches!(role, UserRole::Admin) && store_id.is_some() {
        return Err(anyhow::anyhow!("Admin users cannot have a store_id"));
    }

    let now = Utc::now();
    let result = sqlx::query(
        r#"
        INSERT INTO users (email, password_hash, role, store_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(email)
    .bind(&password_hash)
    .bind(role.as_str())
    .bind(store_id)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;

    let user_id = result.last_insert_id();

    Ok(User {
        id: user_id,
        email: email.to_string(),
        password_hash,
        role: role.as_str().to_string(),
        store_id,
        created_at: now,
        updated_at: now,
    })
}

pub async fn find_user_by_email(pool: &MySqlPool, email: &str) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, store_id, created_at, updated_at
        FROM users
        WHERE email = ?
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn find_user_by_id(pool: &MySqlPool, user_id: u64) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, store_id, created_at, updated_at
        FROM users
        WHERE id = ?
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn verify_user_password(user: &User, password: &str) -> Result<bool> {
    verify(password, &user.password_hash)
        .map_err(|e| anyhow::anyhow!("Failed to verify password: {}", e))
}

pub async fn verify_store_exists(pool: &MySqlPool, store_id: u64) -> Result<bool> {
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM stores WHERE id = ?"
    )
    .bind(store_id)
    .fetch_one(pool)
    .await?;

    Ok(count.0 > 0)
}

pub async fn get_all_users(pool: &MySqlPool) -> Result<Vec<User>> {
    let users = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, store_id, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn update_user(
    pool: &MySqlPool,
    user_id: u64,
    email: &Option<String>,
    role: &Option<String>,
    store_id: Option<u64>,
) -> Result<Option<User>> {
    // Build dynamic update query based on provided fields
    let mut query = "UPDATE users SET ".to_string();
    let mut updates = Vec::new();
    let mut bind_count = 0;

    if email.is_some() {
        updates.push("email = ?");
        bind_count += 1;
    }

    if role.is_some() {
        updates.push("role = ?");
        bind_count += 1;
    }

    if role.is_some() {
        updates.push("store_id = ?");
        bind_count += 1;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    if bind_count == 0 {
        // No fields to update, return existing user
        return find_user_by_id(pool, user_id).await;
    }

    query.push_str(&updates.join(", "));
    query.push_str(" WHERE id = ?");

    let mut query_builder = sqlx::query(&query);

    // Bind all the update values in order
    if let Some(email_val) = email {
        query_builder = query_builder.bind(email_val);
    }
    if let Some(role_val) = role {
        query_builder = query_builder.bind(role_val);
    }
    if role.is_some() {
        query_builder = query_builder.bind(store_id);
    }

    // Bind the user_id for WHERE clause
    query_builder = query_builder.bind(user_id);

    let result = query_builder.execute(pool).await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    find_user_by_id(pool, user_id).await
}

pub async fn delete_user(pool: &MySqlPool, user_id: u64) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM users WHERE id = ?"
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

// Password Reset Functions

pub async fn create_password_reset_token(pool: &MySqlPool, user_id: u64) -> Result<String> {
    // Generate a unique token
    let token = Uuid::new_v4().to_string();
    let expires_at = Utc::now() + Duration::hours(1); // 1 hour expiration

    // Invalidate any existing tokens for this user
    sqlx::query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE"
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    // Create new token
    sqlx::query(
        r#"
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
        "#,
    )
    .bind(user_id)
    .bind(&token)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(token)
}

pub async fn find_password_reset_token(pool: &MySqlPool, token: &str) -> Result<Option<PasswordResetToken>> {
    let token_record = sqlx::query_as::<_, PasswordResetToken>(
        r#"
        SELECT id, user_id, token, expires_at, used, created_at
        FROM password_reset_tokens
        WHERE token = ? AND used = FALSE AND expires_at > NOW()
        "#,
    )
    .bind(token)
    .fetch_optional(pool)
    .await?;

    Ok(token_record)
}

pub async fn use_password_reset_token(pool: &MySqlPool, token: &str) -> Result<bool> {
    let result = sqlx::query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE token = ? AND used = FALSE"
    )
    .bind(token)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn update_user_password(pool: &MySqlPool, user_id: u64, new_password: &str) -> Result<bool> {
    let password_hash = hash(new_password, DEFAULT_COST)?;

    let result = sqlx::query(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(&password_hash)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn create_user_without_password(
    pool: &MySqlPool,
    email: &str,
    role: UserRole,
    store_id: Option<u64>,
) -> Result<User> {
    // Generate a temporary random password that the user will need to reset
    let temp_password = Uuid::new_v4().to_string();
    create_user(pool, email, &temp_password, role, store_id).await
}

pub async fn cleanup_expired_tokens(pool: &MySqlPool) -> Result<()> {
    sqlx::query(
        "DELETE FROM password_reset_tokens WHERE expires_at < NOW()"
    )
    .execute(pool)
    .await?;

    Ok(())
}
