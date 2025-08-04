use crate::asset_endpoint::AssetsAppConfig;
use actix_web::web::Data;
use actix_web::{App, HttpResponse, HttpServer, middleware, web};
use anyhow::Result;
use database_common_lib::database_connection::{DatabaseConnectionData, set_database_name};
use log::*;
use serde_json::json;
use vite_actix::start_vite_server;

mod asset_endpoint;
mod categories;
mod orders;
mod products;

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
    set_database_name("store-orders")?;
    let connection_data = DatabaseConnectionData::get().await?;
    let pool = connection_data.get_pool().await?;

    // Initialize the database tables in proper order
    categories::initialize(&pool).await?;
    products::initialize(&pool).await?;
    orders::initialize(&pool).await?;

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
                    .configure(categories::configure)
                    .configure(products::configure)
                    .configure(orders::configure)
                    .default_service(web::to(|| async {
                        HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
                    })),
            )
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
