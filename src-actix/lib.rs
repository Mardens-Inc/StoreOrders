use crate::asset_endpoint::AssetsAppConfig;
use actix_web::web::Data;
use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use anyhow::Result;
use database_common_lib::database_connection::{set_database_name, DatabaseConnectionData};
use log::*;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use vite_actix::proxy_vite_options::ProxyViteOptions;
use vite_actix::start_vite_server;

mod asset_endpoint;
mod auth;
mod categories;
mod orders;
mod products;
mod stores;
mod upload;

pub static DEBUG: bool = cfg!(debug_assertions);
pub async fn run() -> Result<()> {
    // Load environment variables from .env file
    if let Err(e) = dotenv::dotenv() {
        if DEBUG {
            warn!(
                "Could not load .env file: {}. Using system environment variables only.",
                e
            );
        }
    }

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

    // Start the Vite server in development mode
    if DEBUG {
        ProxyViteOptions::new().disable_logging().build()?;
        std::thread::spawn(|| loop {
            info!("Starting Vite server in development mode...");
            let status = start_vite_server()
                .expect("Failed to start vite server")
                .wait()
                .expect("Vite server crashed!");
            if !status.success() {
                error!("The vite server has crashed!");
            } else {
                break;
            }
        });
    }

    let port = std::env::var("APP_PORT")
        .map(|port_str| port_str.parse::<u16>().unwrap_or(1423))
        .unwrap_or_else(|_| 1423);

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
                    .service(asset_endpoint::get_version)
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
            // Serve static product images without directory listing
            .service(actix_files::Files::new("/products", "products"))
            .configure_frontend_routes()
    })
    .workers(4)
    .bind(format!("0.0.0.0:{port}", port = port))?
    .run();

    info!(
        "Starting {} server at http://127.0.0.1:{}...",
        if DEBUG { "development" } else { "production" },
        port
    );
    let stop_result = server.await;
    debug!("Server stopped");

    Ok(stop_result?)
}
