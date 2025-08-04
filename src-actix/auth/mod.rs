pub mod auth_data;
pub mod auth_db;
pub mod auth_endpoint;
pub mod auth_middleware;
pub mod jwt;

pub use auth_data::*;
pub use auth_db::*;
pub use auth_middleware::*;
pub use jwt::*;

use actix_web::web;
use actix_web_httpauth::middleware::HttpAuthentication;
use sqlx::MySqlPool;

pub async fn initialize(pool: &MySqlPool) -> anyhow::Result<()> {
    auth_db::create_tables(pool).await?;
    Ok(())
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            // Public endpoints (no authentication required)
            .service(auth_endpoint::login)
            .service(auth_endpoint::register)
            .service(auth_endpoint::refresh)
            // Protected endpoints (authentication required)
            .service(
                web::scope("")
                    .wrap(HttpAuthentication::bearer(jwt_validator))
                    .service(auth_endpoint::me)
                    .service(auth_endpoint::get_users)
                    .service(auth_endpoint::update_user)
                    .service(auth_endpoint::delete_user),
            ),
    );
}
