use crate::auth::{User, UserRole};
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use sqlx::MySqlPool;

pub async fn create_tables(pool: &MySqlPool) -> Result<()> {
    // Create users table
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
