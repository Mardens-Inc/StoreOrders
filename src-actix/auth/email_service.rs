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

        let smtp_host =
            std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.office365.com".to_string());
        let username =
            std::env::var("SMTP_USERNAME").unwrap_or_else(|_| "emailuser@mardens.com".to_string());
        let password = std::env::var("SMTP_PASSWORD").unwrap_or_else(|_| "M@rdensM55".to_string());

        debug!("Creating SMTP credentials for user: {}", username);
        let creds = Credentials::new(username.clone(), password);

        debug!("Setting up SMTP transport with host: {}", smtp_host);
        let transport = SmtpTransport::starttls_relay(&smtp_host)?
            .credentials(creds)
            .build();

        let from_email = std::env::var("SMTP_FROM").unwrap_or(username);

        info!(
            "EmailService initialized successfully with SMTP host: {}",
            smtp_host
        );
        Ok(Self {
            transport,
            from_email,
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
            let port = std::env::var("APP_PORT")
                .map(|port_str| port_str.parse::<u16>().unwrap_or(1423))
                .unwrap_or_else(|_| 1423);
            format!("http://127.0.0.1:{}", port)
        } else {
            std::env::var("PUBLIC_BASE_URL")
                .unwrap_or_else(|_| "https://store-orders.mardens.com".to_string())
        };
        debug!("Using base URL: {}", base_url);
        let reset_url = format!("{}/reset-password?token={}", base_url, reset_token);

        let (subject, body) = if is_new_user {
            debug!("Preparing welcome email for new user");
            (
                "Welcome to Mardens Store Portal - Set Your Password",
                format!(
                    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Mardens Store Portal</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .email-container {{
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .title {{
            color: #1f2937;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }}
        .subtitle {{
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }}
        .content {{
            margin-bottom: 30px;
        }}
        .welcome-text {{
            font-size: 16px;
            margin-bottom: 20px;
            color: #374151;
        }}
        .cta-button {{
            display: inline-block;
            background: #f13848;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }}
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }}
        .expiry-notice {{
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }}
        .security-note {{
            font-size: 13px;
            color: #9ca3af;
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 6px;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="title">Welcome to Mardens Store Portal!</h1>
            <p class="subtitle">Your account has been created successfully</p>
        </div>

        <div class="content">
            <p class="welcome-text">
                Hello and welcome to the Mardens Store Portal! Your account has been created and you need to set your password to access the system.
            </p>

            <div style="text-align: center;">
                <a href="{}" class="cta-button">Set Your Password</a>
            </div>

            <div class="expiry-notice">
                <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>

            <div class="security-note">
                If you did not expect this email or have any questions, please contact your system administrator immediately.
            </div>
        </div>

        <div class="footer">
            <p>Best regards,<br><strong>Mardens IT Team</strong></p>
            <p style="margin-top: 15px; font-size: 12px;">
                This is an automated message from the Mardens Store Portal system.
            </p>
        </div>
    </div>
</body>
</html>"#,
                    reset_url
                ),
            )
        } else {
            debug!("Preparing password reset email for existing user");
            (
                "Mardens Store Portal - Password Reset Request",
                format!(
                    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .email-container {{
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        .title {{
            color: #1f2937;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }}
        .subtitle {{
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }}
        .content {{
            margin-bottom: 30px;
        }}
        .reset-text {{
            font-size: 16px;
            margin-bottom: 20px;
            color: #374151;
        }}
        .cta-button {{
            display: inline-block;
            background: #f13848;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }}
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }}
        .expiry-notice {{
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }}
        .security-note {{
            font-size: 13px;
            color: #9ca3af;
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 6px;
        }}
        .ignore-notice {{
            background-color: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #991b1b;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🔑</div>
            <h1 class="title">Password Reset Request</h1>
            <p class="subtitle">Someone requested to reset your password</p>
        </div>

        <div class="content">
            <p class="reset-text">
                You have requested to reset your password for the Mardens Store Portal. Click the button below to create a new password for your account.
            </p>

            <div style="text-align: center;">
                <a href="{}" class="cta-button">Reset Your Password</a>
            </div>

            <div class="expiry-notice">
                <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>

            <div class="ignore-notice">
                <strong>🛡️ Security Notice:</strong> If you did not request this password reset, please ignore this email or contact your system administrator.
            </div>

            <div class="security-note">
                This reset link can only be used once and will become invalid after you set a new password.
            </div>
        </div>

        <div class="footer">
            <p>Best regards,<br><strong>Mardens IT Team</strong></p>
            <p style="margin-top: 15px; font-size: 12px;">
                This is an automated message from the Mardens Store Portal system.
            </p>
        </div>
    </div>
</body>
</html>"#,
                    reset_url
                ),
            )
        };

        debug!("Building email message with subject: {}", subject);
        let email = Message::builder()
            .from(self.from_email.parse()?)
            .to(to_email.parse()?)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
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
