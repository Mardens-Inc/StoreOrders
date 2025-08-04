use crate::auth::{
    auth_db, create_jwt_token, create_refresh_token, verify_refresh_token, verify_user_password, AuthResponse,
    ClaimsExtractor, LoginRequest, RefreshRequest, RegisterRequest, UserResponse, UpdateUserRequest,
};
use actix_web::{get, post, put, delete, web, HttpRequest, HttpResponse, Result};
use database_common_lib::database_connection::DatabaseConnectionData;
use serde_json::json;

#[post("/login")]
pub async fn login(
    login_req: web::Json<LoginRequest>,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    // Find user by email
    let user = match auth_db::find_user_by_email(&pool, &login_req.email).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Ok(HttpResponse::Unauthorized().json(json!({
                "error": "Invalid credentials"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database error: {}", e)
            })));
        }
    };

    // Verify password
    match verify_user_password(&user, &login_req.password).await {
        Ok(true) => {}
        Ok(false) => {
            return Ok(HttpResponse::Unauthorized().json(json!({
                "error": "Invalid credentials"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Password verification failed: {}", e)
            })));
        }
    }

    // Create JWT token
    let token = match create_jwt_token(
        user.id,
        user.email.clone(),
        user.role.clone(),
        user.store_id,
    ) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Token creation failed: {}", e)
            })));
        }
    };

    // Create refresh token
    let refresh_token = match create_refresh_token(user.id) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Refresh token creation failed: {}", e)
            })));
        }
    };

    let response = AuthResponse {
        user: UserResponse::from(user),
        token,
        refresh_token,
    };

    Ok(HttpResponse::Ok().json(response))
}

#[post("/register")]
pub async fn register(
    register_req: web::Json<RegisterRequest>,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    // Decode store_id if provided
    let store_id = register_req.store_id;

    // Verify store exists if store_id is provided
    if let Some(store_id) = store_id {
        match auth_db::verify_store_exists(&pool, store_id).await {
            Ok(true) => {}
            Ok(false) => {
                return Ok(HttpResponse::BadRequest().json(json!({
                    "error": "Store does not exist"
                })));
            }
            Err(e) => {
                return Ok(HttpResponse::InternalServerError().json(json!({
                    "error": format!("Store verification failed: {}", e)
                })));
            }
        }
    }

    // Create user
    let user = match auth_db::create_user(
        &pool,
        &register_req.email,
        &register_req.password,
        register_req.role.clone(),
        store_id,
    )
    .await
    {
        Ok(user) => user,
        Err(e) => {
            if e.to_string().contains("Duplicate entry") {
                return Ok(HttpResponse::Conflict().json(json!({
                    "error": "Email already exists"
                })));
            }
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": format!("User creation failed: {}", e)
            })));
        }
    };

    // Create JWT token
    let token = match create_jwt_token(
        user.id,
        user.email.clone(),
        user.role.clone(),
        user.store_id,
    ) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Token creation failed: {}", e)
            })));
        }
    };

    // Create refresh token
    let refresh_token = match create_refresh_token(user.id) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Refresh token creation failed: {}", e)
            })));
        }
    };

    let response = AuthResponse {
        user: UserResponse::from(user),
        token,
        refresh_token,
    };

    Ok(HttpResponse::Created().json(response))
}

#[get("/me")]
pub async fn me(req: HttpRequest) -> Result<HttpResponse> {
    if let Some(claims) = req.get_claims() {
        Ok(HttpResponse::Ok().json(json!({
            "id": serde_hash::hashids::encode_single(claims.sub),
            "email": claims.email,
            "role": claims.role,
            "store_id": claims.store_id.map(serde_hash::hashids::encode_single)
        })))
    } else {
        Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Not authenticated"
        })))
    }
}

#[post("/refresh")]
pub async fn refresh(
    refresh_req: web::Json<RefreshRequest>,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    // Verify refresh token
    let refresh_claims = match verify_refresh_token(&refresh_req.refresh_token) {
        Ok(claims) => claims,
        Err(_) => {
            return Ok(HttpResponse::Unauthorized().json(json!({
                "error": "Invalid refresh token"
            })));
        }
    };

    // Get user details
    let user = match auth_db::find_user_by_id(&pool, refresh_claims.sub).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Ok(HttpResponse::Unauthorized().json(json!({
                "error": "User not found"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database error: {}", e)
            })));
        }
    };

    // Create new JWT token
    let token = match create_jwt_token(
        user.id,
        user.email.clone(),
        user.role.clone(),
        user.store_id,
    ) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Token creation failed: {}", e)
            })));
        }
    };

    // Create new refresh token
    let new_refresh_token = match create_refresh_token(user.id) {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Refresh token creation failed: {}", e)
            })));
        }
    };

    let response = AuthResponse {
        user: UserResponse::from(user),
        token,
        refresh_token: new_refresh_token,
    };

    Ok(HttpResponse::Ok().json(response))
}

#[get("/users")]
pub async fn get_users(
    req: HttpRequest,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    // Check if user is admin
    if let Some(claims) = req.get_claims() {
        if claims.role != "admin" {
            return Ok(HttpResponse::Forbidden().json(json!({
                "error": "Admin access required"
            })));
        }
    } else {
        return Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Authentication required"
        })));
    }

    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    match auth_db::get_all_users(&pool).await {
        Ok(users) => {
            let user_responses: Vec<UserResponse> = users.into_iter().map(UserResponse::from).collect();
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "data": user_responses
            })))
        }
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to fetch users: {}", e)
            })))
        }
    }
}

#[put("/users/{id}")]
pub async fn update_user(
    req: HttpRequest,
    path: web::Path<String>,
    update_req: web::Json<UpdateUserRequest>,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    // Check if user is admin
    if let Some(claims) = req.get_claims() {
        if claims.role != "admin" {
            return Ok(HttpResponse::Forbidden().json(json!({
                "error": "Admin access required"
            })));
        }
    } else {
        return Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Authentication required"
        })));
    }

    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    let user_id = match serde_hash::hashids::decode_single(&path.as_str()) {
        Ok(id) => id,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid user ID"
            })));
        }
    };

    // Decode store_id if provided
    let store_id = if let Some(store_id_str) = &update_req.store_id {
        match serde_hash::hashids::decode_single(store_id_str) {
            Ok(id) => Some(id),
            Err(_) => {
                return Ok(HttpResponse::BadRequest().json(json!({
                    "error": "Invalid store ID"
                })));
            }
        }
    } else {
        None
    };

    match auth_db::update_user(&pool, user_id, &update_req.email, &update_req.role, store_id).await {
        Ok(Some(user)) => {
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "data": UserResponse::from(user)
            })))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(json!({
                "error": "User not found"
            })))
        }
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to update user: {}", e)
            })))
        }
    }
}

#[delete("/users/{id}")]
pub async fn delete_user(
    req: HttpRequest,
    path: web::Path<String>,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<HttpResponse> {
    // Check if user is admin
    if let Some(claims) = req.get_claims() {
        if claims.role != "admin" {
            return Ok(HttpResponse::Forbidden().json(json!({
                "error": "Admin access required"
            })));
        }
    } else {
        return Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Authentication required"
        })));
    }

    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };

    let user_id = match serde_hash::hashids::decode_single(&path.as_str()) {
        Ok(id) => id,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid user ID"
            })));
        }
    };

    // Prevent admin from deleting themselves
    if let Some(claims) = req.get_claims() {
        if claims.sub == user_id {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Cannot delete your own account"
            })));
        }
    }

    match auth_db::delete_user(&pool, user_id).await {
        Ok(true) => {
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "message": "User deleted successfully"
            })))
        }
        Ok(false) => {
            Ok(HttpResponse::NotFound().json(json!({
                "error": "User not found"
            })))
        }
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to delete user: {}", e)
            })))
        }
    }
}
