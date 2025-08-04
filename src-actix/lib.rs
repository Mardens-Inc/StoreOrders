use crate::asset_endpoint::AssetsAppConfig;
use actix_web::web::Data;
use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use anyhow::Result;
use database_common_lib::database_connection::{set_database_name, DatabaseConnectionData};
use log::*;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use vite_actix::start_vite_server;

mod asset_endpoint;
mod auth;
mod categories;
mod orders;
mod products;
mod stores;
mod upload;

pub static DEBUG: bool = cfg!(debug_assertions);
const PORT: u16 = 1422;

pub async fn run() -> Result<()> {
    pretty_env_logger::env_logger::builder()
        .filter_level(if DEBUG {
            LevelFilter::Debug
        } else {
            LevelFilter::Info
        })
        .format_timestamp(None)
        .init();
    set_database_name("stores")?;
    let connection_data = DatabaseConnectionData::get().await?;
    let pool = connection_data.get_pool().await?;

    if DEBUG {
        let dev_env = PathBuf::from("target/dev-env");
        fs::create_dir_all(&dev_env)?;
        std::env::set_current_dir(dev_env)?;
    }

    // Initialize the database tables in proper order
    auth::initialize(&pool).await?;
    categories::initialize(&pool).await?;
    products::initialize(&pool).await?;
    orders::initialize(&pool).await?;
    stores::initialize(&pool).await?;

    pool.close().await;

    let server = HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .app_data(
                web::JsonConfig::default()
                    .limit(4096)
                    .error_handler(|err, _req| {
                        let error = json!({ "error": format!("{}", err) });
                        actix_web::error::InternalError::from_response(
                            err,
                            HttpResponse::BadRequest().json(error),
                        )
                        .into()
                    }),
            )
            .service(
                web::scope("/api")
                    .app_data(Data::new(connection_data.clone()))
                    .configure(auth::configure)
                    .configure(categories::configure)
                    .configure(products::configure)
                    .configure(orders::configure)
                    .configure(stores::configure)
                    .configure(upload::configure)
                    .default_service(web::to(|| async {
                        HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
                    })),
            )
            // Serve static product images
            .service(actix_files::Files::new("/products", "products").show_files_listing())
            .configure_frontend_routes()
    })
    .workers(4)
    .bind(format!("0.0.0.0:{port}", port = PORT))?
    .run();

    info!(
        "Starting {} server at http://127.0.0.1:{}...",
        if DEBUG { "development" } else { "production" },
        PORT
    );

    if DEBUG {
        start_vite_server().expect("Failed to start vite server");
    }

    let stop_result = server.await;
    debug!("Server stopped");

    Ok(stop_result?)
}
