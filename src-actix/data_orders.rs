use crate::traits::FromNumber;
use serde::{Deserialize, Serialize};
use std::fmt::Display;

#[derive(Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub store: u8,
    pub status: OrderStatus,
    pub week: u8,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OrderStatus {
    COMPLETED,
    CURRENT,
    PENDING,
    CANCELLED,
}

impl Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderStatus::COMPLETED => write!(f, "Completed"),
            OrderStatus::CURRENT => write!(f, "Current"),
            OrderStatus::PENDING => write!(f, "Pending"),
            OrderStatus::CANCELLED => write!(f, "Cancelled"),
        }
    }
}

impl FromNumber for OrderStatus {
    fn from_number(n: i64) -> Option<Self> {
        match n {
            0 => Some(OrderStatus::COMPLETED),
            1 => Some(OrderStatus::CURRENT),
            2 => Some(OrderStatus::PENDING),
            3 => Some(OrderStatus::CANCELLED),
            _ => None,
        }
    }
}

pub struct OrderListResponse {
    pub results: Vec<Order>,
    pub total: u32,
    pub limit: u32,
    pub offset: u32,
}
