use serde::{Deserialize, Serialize};
use sqlx::Type;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "UPPERCASE")]
pub enum StoreOrderStatus {
    #[sqlx(rename = "PENDING")]
    Pending,
    #[sqlx(rename = "PROCESSING")]
    Processing,
    #[sqlx(rename = "SHIPPED")]
    Shipped,
    #[sqlx(rename = "DELIVERED")]
    Delivered,
    #[sqlx(rename = "CANCELLED")]
    Cancelled,
    #[sqlx(rename = "REFUNDED")]
    Refunded,
}

impl fmt::Display for StoreOrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreOrderStatus::Pending => write!(f, "Pending"),
            StoreOrderStatus::Processing => write!(f, "Processing"),
            StoreOrderStatus::Shipped => write!(f, "Shipped"),
            StoreOrderStatus::Delivered => write!(f, "Delivered"),
            StoreOrderStatus::Cancelled => write!(f, "Cancelled"),
            StoreOrderStatus::Refunded => write!(f, "Refunded"),
        }
    }
}

#[allow(clippy::derivable_impls)]
impl Default for StoreOrderStatus {
    fn default() -> Self {
        StoreOrderStatus::Pending
    }
}
