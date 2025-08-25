use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StoreOrderStatus {
    Pending,
    Shipped,
    Delivered,
}

impl StoreOrderStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            StoreOrderStatus::Pending => "PENDING",
            StoreOrderStatus::Shipped => "SHIPPED",
            StoreOrderStatus::Delivered => "DELIVERED",
        }
    }

    pub fn from_str_case_insensitive(s: &str) -> Option<Self> {
        match s.to_ascii_uppercase().as_str() {
            "PENDING" => Some(StoreOrderStatus::Pending),
            "SHIPPED" => Some(StoreOrderStatus::Shipped),
            "DELIVERED" => Some(StoreOrderStatus::Delivered),
            _ => None,
        }
    }
}

impl fmt::Display for StoreOrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", match self {
            StoreOrderStatus::Pending => "Pending",
            StoreOrderStatus::Shipped => "Shipped",
            StoreOrderStatus::Delivered => "Delivered",
        })
    }
}

impl Default for StoreOrderStatus { fn default() -> Self { StoreOrderStatus::Pending } }
