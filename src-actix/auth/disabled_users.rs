use crate::auth::User;
use anyhow::Result;
use database_common_lib::database_connection::DatabaseConnectionData;
use serde::{Deserialize, Serialize};
use sqlx::{Executor, FromRow, MySqlPool};

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct DisabledUser {
    #[serde(serialize_with = "hash_id", deserialize_with = "unhash_id")]
    pub user_id: u64,
    #[serde(default = "default_time")]
    pub disabled_at: chrono::DateTime<chrono::Utc>,
    #[serde(
        serialize_with = "hash_id",
        deserialize_with = "unhash_id",
        default = "default_id"
    )]
    pub disabled_by: u64,
    pub reason: String,
    pub expiration: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn initialize(pool: &MySqlPool) -> Result<()> {
    pool.execute(
        r#"CREATE TABLE IF NOT EXISTS `disabled_users`
(
    id          INT UNSIGNED NOT NULL PRIMARY KEY,
    disabled_at DATETIME     NOT NULL,
    disabled_by INT UNSIGNED NOT NULL,
    reason      TEXT,
    expiration  DATETIME     NULL DEFAULT NULL
);"#,
    )
    .await?;

    // Clean disabled users every 24 hours
    tokio::spawn(async move {
        loop {
            if let Ok(conn_data) = DatabaseConnectionData::get().await {
                let pool = match conn_data.get_pool().await {
                    Ok(pool) => pool,
                    Err(e) => {
                        log::error!("Database connection failed: {}", e);
                        tokio::time::sleep(std::time::Duration::from_secs(60 * 5)).await; // 5 minutes if connection failed
                        continue;
                    }
                };

                if let Err(e) = DisabledUser::clean(&pool).await {
                    log::error!("Failed to clean disabled users: {}", e);
                    tokio::time::sleep(std::time::Duration::from_secs(60 * 5)).await; // 5 minutes if connection failed
                    continue;
                }
                // Execute every 24 hours
                tokio::time::sleep(std::time::Duration::from_secs(60 * 60 * 24)).await;
            }
            tokio::time::sleep(std::time::Duration::from_secs(60 * 5)).await; // 5 minutes if connection failed
        }
    });

    Ok(())
}

impl User {
    pub async fn disable(
        self,
        reason: &str,
        expiration: Option<chrono::DateTime<chrono::Utc>>,
        requesting_user_id: u64,
        pool: &MySqlPool,
    ) -> Result<DisabledUser> {
        let disabled_user = DisabledUser {
            user_id: self.id,
            disabled_at: chrono::Utc::now(),
            disabled_by: requesting_user_id,
            reason: reason.to_string(),
            expiration,
        };

        disabled_user.save(pool).await?;

        Ok(disabled_user)
    }

    pub async fn enable(self, pool: &MySqlPool) -> Result<()> {
        if let Some(user) = DisabledUser::get(self.id, pool).await? {
            user.delete(pool).await?;
        }
        Ok(())
    }

    pub async fn is_disabled(&self, pool: &MySqlPool) -> Result<bool> {
        let disabled_user = DisabledUser::get(self.id, pool).await?;
        Ok(disabled_user.is_some())
    }
}

impl DisabledUser {
    pub async fn list(pool: &MySqlPool) -> Result<Vec<DisabledUser>> {
        let disabled_users =
            sqlx::query_as(r#"SELECT * FROM disabled_users WHERE expiration > NOW() or expiration is null;"#)
                .fetch_all(pool)
                .await?;

        Ok(disabled_users)
    }
    pub async fn get(user_id: u64, pool: &MySqlPool) -> Result<Option<DisabledUser>> {
        let disabled_users = sqlx::query_as(
            r#"SELECT * FROM disabled_users WHERE (expiration > NOW() or expiration is null) and user_id = ? limit 1;"#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        Ok(disabled_users)
    }

    pub async fn save(&self, pool: &MySqlPool) -> Result<()> {
        sqlx::query(r#"INSERT INTO disabled_users (user_id, disabled_at, disabled_by, reason, expiration) VALUES (?, ?, ?, ?, ?);"#)
			.bind(self.user_id)
			.bind(self.disabled_at)
			.bind(self.disabled_by)
			.bind(&self.reason)
			.bind(self.expiration)
			.execute(pool)
			.await?;

        Ok(())
    }

    pub async fn delete(&self, pool: &MySqlPool) -> Result<()> {
        sqlx::query(r#"DELETE FROM disabled_users WHERE user_id = ?;"#)
            .bind(self.user_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn clean(pool: &MySqlPool) -> Result<()> {
        sqlx::query(r#"delete from disabled_users where expiration < now() and expiration is not null;"#)
            .execute(pool)
            .await?;
        Ok(())
    }
}

fn hash_id<S>(id: &u64, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&serde_hash::hashids::encode_single(*id))
}

fn unhash_id<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    serde_hash::hashids::decode_single(&s).map_err(serde::de::Error::custom)
}

fn default_id() -> u64 {
    0u64
}
fn default_time() -> chrono::DateTime<chrono::Utc> {
    chrono::DateTime::default()
}
