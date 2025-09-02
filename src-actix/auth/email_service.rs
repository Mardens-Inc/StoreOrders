use anyhow::Result;
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use log::*;

pub struct EmailService {
    transport: SmtpTransport,
    from_email: String,
}

impl EmailService {
    pub fn new() -> Result<Self> {
        debug!("Initializing EmailService");
        let smtp_host = "smtp.office365.com";
        //        let smtp_port = 587;
        let username = "emailuser@mardens.com";
        let password = "M@rdensM55";

        debug!("Creating SMTP credentials for user: {}", username);
        let creds = Credentials::new(username.to_string(), password.to_string());

        debug!("Setting up SMTP transport with host: {}", smtp_host);
        let transport = SmtpTransport::starttls_relay(smtp_host)?.credentials(creds).build();

        info!(
            "EmailService initialized successfully with SMTP host: {}",
            smtp_host
        );
        Ok(Self {
            transport,
            from_email: username.to_string(),
        })
    }

    pub async fn send_password_reset_email(
        &self,
        to_email: &str,
        reset_token: &str,
        is_new_user: bool,
    ) -> Result<()> {
        info!(
            "Starting password reset email process for: {} (new_user: {})",
            to_email, is_new_user
        );

        let base_url = if cfg!(debug_assertions) {
            "http://127.0.0.1:1422"
        } else {
            "https://store-orders.mardens.com" // Update this to your production URL
        };
        debug!("Using base URL: {}", base_url);

        let reset_url = format!("{}/reset-password?token={}", base_url, reset_token);
        debug!(
            "Generated reset URL with token length: {}",
            reset_token.len()
        );

        let (subject, body) = if is_new_user {
            debug!("Preparing welcome email for new user");
            (
                "Welcome to Mardens Store Portal - Set Your Password",
                format!(
                    r#"
Welcome to the Mardens Store Portal!
Your account has been created and you need to set your password to access the system.
Please click the link below to set your password:
{}
This link will expire in 1 hour for security reasons.
If you did not expect this email or have any questions, please contact your system administrator.
Best regards,
Mardens IT Team
                    "#,
                    reset_url
                ),
            )
        } else {
            debug!("Preparing password reset email for existing user");
            (
                "Mardens Store Portal - Password Reset Request",
                format!(
                    r#"
You have requested to reset your password for the Mardens Store Portal.
Please click the link below to reset your password:
{}
This link will expire in 1 hour for security reasons.
If you did not request this password reset, please ignore this email or contact your system administrator.
Best regards,
Mardens IT Team
                    "#,
                    reset_url
                ),
            )
        };

        debug!("Building email message with subject: {}", subject);
        let email = Message::builder()
            .from(self.from_email.parse()?)
            .to(to_email.parse()?)
            .subject(subject)
            .header(ContentType::TEXT_PLAIN)
            .body(body)?;

        debug!("Email message built successfully, attempting to send");
        match self.transport.send(&email) {
            Ok(_) => {
                info!("Password reset email sent successfully to: {}", to_email);
                Ok(())
            }
            Err(e) => {
                error!("Failed to send email to {}: {}", to_email, e);
                Err(anyhow::anyhow!("Failed to send email: {}", e))
            }
        }
    }
}
mod tests {
	use crate::auth::EmailService;
	use log::LevelFilter;

	#[actix_web::test]
    async fn test_send_new_password_reset_email() {
        pretty_env_logger::env_logger::builder()
            .filter_level(LevelFilter::Trace)
            .format_timestamp(None)
            .is_test(true)
            .init();
        let service = EmailService::new().unwrap();
        service
            .send_password_reset_email("drew.chase@mardens.com", "1234567890", true)
            .await
            .unwrap();
    }
    #[actix_web::test]
    async fn test_send_password_reset_email() {
        pretty_env_logger::env_logger::builder()
            .filter_level(LevelFilter::Trace)
            .format_timestamp(None)
            .is_test(true)
            .init();
        let service = EmailService::new().unwrap();
        service
            .send_password_reset_email("drew.chase@mardens.com", "1234567890", false)
            .await
            .unwrap();
    }
}
