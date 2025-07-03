use sqlx::{FromRow, Row};
use sqlx::mysql::MySqlRow;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(u8)]
pub enum StoreOrderStatus {
    Current,
    Pending,
    Completed,
}

impl FromRow<'_, MySqlRow> for StoreOrderStatus {
    fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
        let value: u8 = row.try_get("status")?;
        match value {
            0 => Ok(StoreOrderStatus::Current),
            1 => Ok(StoreOrderStatus::Pending),
            2 => Ok(StoreOrderStatus::Completed),
            _ => Err(sqlx::Error::Decode("Invalid StoreOrderStatus value".into())),
        }
    }
}