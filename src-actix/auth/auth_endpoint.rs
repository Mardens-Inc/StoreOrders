use crate::auth::disabled_users::DisabledUser;
use crate::auth::email_service::EmailService;
use crate::auth::{
    auth_db, create_jwt_token, create_refresh_token, verify_refresh_token, verify_user_password,
    AdminResetPasswordRequest, AuthResponse, ClaimsExtractor, CreateUserRequest,
    ForgotPasswordRequest, LoginRequest, RefreshRequest, RegisterRequest, ResetPasswordRequest,
    UpdateUserRequest, User, UserResponse,
};
use actix_web::{delete, get, post, put, web, HttpRequest, HttpResponse, Responder};
use database_common_lib::database_connection::DatabaseConnectionData;
use database_common_lib::http_error::Result;
use jsonwebtoken::decode;
use serde_hash::hashids::decode_single;
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
            let user_responses: Vec<UserResponse> =
                users.into_iter().map(UserResponse::from).collect();
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "data": user_responses
            })))
        }
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": format!("Failed to fetch users: {}", e)
        }))),
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

    let user_id = match decode_single(&path.as_str()) {
        Ok(id) => id,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid user ID"
            })));
        }
    };

    // Decode store_id if provided
    let store_id = if let Some(store_id_str) = &update_req.store_id {
        match decode_single(store_id_str) {
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

    match auth_db::update_user(
        &pool,
        user_id,
        &update_req.email,
        &update_req.role,
        store_id,
    )
    .await
    {
        Ok(Some(user)) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": UserResponse::from(user)
        }))),
        Ok(None) => Ok(HttpResponse::NotFound().json(json!({
            "error": "User not found"
        }))),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": format!("Failed to update user: {}", e)
        }))),
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
        Ok(true) => Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "User deleted successfully"
        }))),
        Ok(false) => Ok(HttpResponse::NotFound().json(json!({
            "error": "User not found"
        }))),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": format!("Failed to delete user: {}", e)
        }))),
    }
}

// Password Reset Endpoints

#[post("/forgot-password")]
pub async fn forgot_password(
    forgot_req: web::Json<ForgotPasswordRequest>,
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
    let user = match auth_db::find_user_by_email(&pool, &forgot_req.email).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            // Return success even if user doesn't exist for security
            return Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "message": "If the email exists in our system, you will receive a password reset link."
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database error: {}", e)
            })));
        }
    };

    // Create password reset token
    let reset_token = match auth_db::create_password_reset_token(&pool, user.id).await {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create reset token: {}", e)
            })));
        }
    };

    // Send password reset email
    let email_service = match EmailService::new() {
        Ok(service) => service,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Email service initialization failed: {}", e)
            })));
        }
    };

    if let Err(e) = email_service
        .send_password_reset_email(&user.email, &reset_token, false)
        .await
    {
        log::error!("Failed to send password reset email: {}", e);
        return Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to send password reset email"
        })));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "If the email exists in our system, you will receive a password reset link."
    })))
}

#[post("/reset-password")]
pub async fn reset_password(
    reset_req: web::Json<ResetPasswordRequest>,
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

    // Validate reset token
    let token_record = match auth_db::find_password_reset_token(&pool, &reset_req.token).await {
        Ok(Some(token)) => token,
        Ok(None) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid or expired reset token"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database error: {}", e)
            })));
        }
    };

    // Validate password strength (basic validation)
    if reset_req.new_password.len() < 8 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Password must be at least 8 characters long"
        })));
    }

    // Update user password
    match auth_db::update_user_password(&pool, token_record.user_id, &reset_req.new_password).await
    {
        Ok(true) => {}
        Ok(false) => {
            return Ok(HttpResponse::NotFound().json(json!({
                "error": "User not found"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to update password: {}", e)
            })));
        }
    }

    // Mark token as used
    if let Err(e) = auth_db::use_password_reset_token(&pool, &reset_req.token).await {
        log::error!("Failed to mark reset token as used: {}", e);
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Password updated successfully"
    })))
}

#[post("/admin/reset-password")]
pub async fn admin_reset_password(
    req: HttpRequest,
    reset_req: web::Json<AdminResetPasswordRequest>,
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

    let user_id = match serde_hash::hashids::decode_single(&reset_req.user_id) {
        Ok(id) => id,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "error": "Invalid user ID"
            })));
        }
    };

    // Get user details
    let user = match auth_db::find_user_by_id(&pool, user_id).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Ok(HttpResponse::NotFound().json(json!({
                "error": "User not found"
            })));
        }
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database error: {}", e)
            })));
        }
    };

    // Create password reset token
    let reset_token = match auth_db::create_password_reset_token(&pool, user.id).await {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create reset token: {}", e)
            })));
        }
    };

    // Send password reset email
    let email_service = match EmailService::new() {
        Ok(service) => service,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Email service initialization failed: {}", e)
            })));
        }
    };

    if let Err(e) = email_service
        .send_password_reset_email(&user.email, &reset_token, false)
        .await
    {
        log::error!("Failed to send password reset email: {}", e);
        return Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to send password reset email"
        })));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": format!("Password reset email sent to {}", user.email)
    })))
}

#[post("/admin/create-user")]
pub async fn admin_create_user(
    req: HttpRequest,
    create_req: web::Json<CreateUserRequest>,
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

    // Decode store_id if provided
    let store_id = create_req.store_id;

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

    // Create user without password
    let user = match auth_db::create_user_without_password(
        &pool,
        &create_req.email,
        create_req.role.clone(),
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

    // Create password setup token
    let reset_token = match auth_db::create_password_reset_token(&pool, user.id).await {
        Ok(token) => token,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create setup token: {}", e)
            })));
        }
    };

    // Send password setup email
    let email_service = match EmailService::new() {
        Ok(service) => service,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Email service initialization failed: {}", e)
            })));
        }
    };

    if let Err(e) = email_service
        .send_password_reset_email(&user.email, &reset_token, true)
        .await
    {
        log::error!("Failed to send password setup email: {}", e);
        return Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to send password setup email"
        })));
    }

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": UserResponse::from(user.clone()),
        "message": format!("User created and password setup email sent to {}", user.email)
    })))
}

#[get("/admin/disabled-users")]
pub async fn get_disabled_users(
    req: HttpRequest,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
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

    let users = DisabledUser::list(&pool).await?;
    Ok(HttpResponse::Ok().json(users))
}
#[get("/admin/disabled-users/{user_id}")]
pub async fn get_disabled_user(
    user_id: web::Path<String>,
    req: HttpRequest,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
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

    let user_id = decode_single(user_id.to_string())?;
    let users = DisabledUser::get(user_id, &pool).await?;
    if users.is_none() {
        return Ok(HttpResponse::NotFound().json(json!({
            "error": "User not found"
        })));
    }
    Ok(HttpResponse::Ok().json(users))
}

#[post("/admin/disable-user")]
pub async fn disable_user(
    body: web::Json<DisabledUser>,
    req: HttpRequest,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
    // Check if user is admin
    let claim = if let Some(claims) = req.get_claims() {
        if claims.role != "admin" {
            return Ok(HttpResponse::Forbidden().json(json!({
                "error": "Admin access required"
            })));
        }
        claims
    } else {
        return Ok(HttpResponse::Unauthorized().json(json!({
            "error": "Authentication required"
        })));
    };

    let pool = match db_data.get_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "error": format!("Database connection failed: {}", e)
            })));
        }
    };
    let mut body = body.into_inner();
    body.disabled_at = chrono::Utc::now();
    body.disabled_by = claim.sub;

    body.save(&pool).await?;
    Ok(HttpResponse::Ok().finish())
}

#[post("/admin/enable-user/{user_id}")]
pub async fn enable_user(
    user_id: web::Path<String>,
    req: HttpRequest,
    db_data: web::Data<DatabaseConnectionData>,
) -> Result<impl Responder> {
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
    let user_id = decode_single(user_id.to_string())?;
    let disabled_user = DisabledUser::get(user_id, &pool).await?;
    if let Some(disabled_user) = disabled_user {
        disabled_user.delete(&pool).await?;
    }

    Ok(HttpResponse::Ok().finish())
}
