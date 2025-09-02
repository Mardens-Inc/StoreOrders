use crate::auth::disabled_users::DisabledUser;
use crate::auth::{verify_jwt_token, Claims};
use actix_web::{dev::ServiceRequest, web, Error, HttpMessage};
use actix_web_httpauth::extractors::bearer::{BearerAuth, Config};
use actix_web_httpauth::extractors::AuthenticationError;
use serde_json::json;

pub async fn jwt_validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let token = credentials.token();

    match verify_jwt_token(token) {
        Ok(claims) => {
            let user_id = claims.sub;
            let db_data = req.app_data::<web::Data<database_common_lib::database_connection::DatabaseConnectionData>>().unwrap();
            let pool = match db_data.get_pool().await {
                Ok(pool) => pool,
                Err(_) => {
                    let config = req
                        .app_data::<Config>()
                        .cloned()
                        .unwrap_or_default()
                        .scope("");
                    return Err((AuthenticationError::from(config).into(), req));
                }
            };
            match DisabledUser::get(user_id, &pool).await {
                Ok(user) => {
                    if let Some(user) = user {
                        let body = json!({
                            "message": "User is disabled!",
                            "reason": user.reason,
                            "expiration": user.expiration
                        });
                        let error_response = actix_web::HttpResponse::Forbidden().json(body);
                        return Err((
                            actix_web::error::InternalError::from_response("", error_response)
                                .into(),
                            req,
                        ));
                    }
                }
                Err(_) => {
                    let config = req
                        .app_data::<Config>()
                        .cloned()
                        .unwrap_or_default()
                        .scope("");
                    return Err((AuthenticationError::from(config).into(), req));
                }
            }
            pool.close().await;
            req.extensions_mut().insert(claims);
            Ok(req)
        }
        Err(_) => {
            let config = req
                .app_data::<Config>()
                .cloned()
                .unwrap_or_default()
                .scope("");

            Err((AuthenticationError::from(config).into(), req))
        }
    }
}

// Extension trait to easily get claims from request
pub trait ClaimsExtractor {
    fn get_claims(&self) -> Option<Claims>;
}

impl ClaimsExtractor for actix_web::HttpRequest {
    fn get_claims(&self) -> Option<Claims> {
        self.extensions().get::<Claims>().cloned()
    }
}
