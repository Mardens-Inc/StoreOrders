use actix_web::{delete, get, post, put, web, HttpResponse, Responder};
use serde_json::json;
use database_common_lib::{database_connection::DatabaseConnectionData, http_error::Result};
use crate::categories::categories_data::{CategoryRecord, CreateCategoryRequest, UpdateCategoryRequest};

#[get("")]
pub async fn get_categories(
    connection_data: web::Data<DatabaseConnectionData>,
    query: web::Query<serde_json::Value>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    // Check if parent_id filter is provided
    let parent_id = query.get("parent_id")
        .and_then(|v| v.as_str())
        .and_then(|s| serde_hash::hashids::decode_single(s).ok());

    let categories = if query.get("parent_id").is_some() {
        CategoryRecord::get_by_parent(&pool, parent_id).await?
    } else {
        CategoryRecord::get_all(&pool).await?
    };

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": categories
    })))
}

#[get("/{id}")]
pub async fn get_category(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let category_id = serde_hash::hashids::decode_single(path.as_str())?;

    match CategoryRecord::get_by_id(&pool, category_id).await? {
        Some(category) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": category
        }))),
        None => Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Category not found"
        })))
    }
}

#[post("")]
pub async fn create_category(
    connection_data: web::Data<DatabaseConnectionData>,
    request: web::Json<CreateCategoryRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;

    let parent_id = if let Some(pid_str) = &request.parent_id {
        Some(serde_hash::hashids::decode_single(pid_str)?)
    } else {
        None
    };

    let category_id = CategoryRecord::create(
        &pool,
        &request.name,
        request.description.as_deref(),
        request.icon.as_deref(),
        parent_id,
        request.sort_order.unwrap_or(0),
    ).await?;

    let category = CategoryRecord::get_by_id(&pool, category_id).await?
        .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created category"))?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": category,
        "message": "Category created successfully"
    })))
}

#[put("/{id}")]
pub async fn update_category(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
    request: web::Json<UpdateCategoryRequest>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let category_id = serde_hash::hashids::decode_single(path.as_str())?;

    let parent_id = if let Some(pid_str) = &request.parent_id {
        Some(serde_hash::hashids::decode_single(pid_str)?)
    } else {
        None
    };

    let updated = CategoryRecord::update(
        &pool,
        category_id,
        request.name.as_deref(),
        request.description.as_deref(),
        request.icon.as_deref(),
        parent_id,
        request.sort_order,
        request.is_active,
    ).await?;

    if updated {
        let category = CategoryRecord::get_by_id(&pool, category_id).await?
            .ok_or_else(|| anyhow::anyhow!("Category not found after update"))?;

        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": category,
            "message": "Category updated successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Category not found or no changes made"
        })))
    }
}

#[delete("/{id}")]
pub async fn delete_category(
    connection_data: web::Data<DatabaseConnectionData>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let pool = connection_data.get_pool().await?;
    let category_id = serde_hash::hashids::decode_single(path.as_str())?;

    let deleted = CategoryRecord::delete(&pool, category_id).await?;

    if deleted {
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Category deleted successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(json!({
            "success": false,
            "error": "Category not found"
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/categories")
            .service(get_categories)
            .service(get_category)
            .service(create_category)
            .service(update_category)
            .service(delete_category)
            .default_service(web::to(|| async {
                HttpResponse::NotFound().json(json!({ "error": "API endpoint not found" }))
            }))
    );
}
