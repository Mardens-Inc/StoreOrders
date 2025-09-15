use database_common_lib::database_connection::{set_database_name, DatabaseConnectionData};
use filemaker_lib::Filemaker;
use log::info;
use serde::{Deserialize, Deserializer};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct OrderItem {
    item_number: String,
    desc_full: String,
    desc_short: String,
    dept: String,
    category: String,
    sub_category: String,
    retail_price: f64,
    mp: f64,
    unit: String,
    case_qty: u32,
    cases_on_hand: f64,
    qoh: u32,
    order_filter: u32,
    filter_name: String,
    bin_loc1: String,
    bin_loc2: String,
    req_id: String,
    created_timestamp: String,
}

impl<'de> Deserialize<'de> for OrderItem {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let map: HashMap<String, Value> = HashMap::deserialize(deserializer)?;

        // Helper function to get string value and trim it
        let get_trimmed_string = |key: &str| -> String {
            map.get(key)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string()
        };

        // Helper function to get numeric value from string or number
        let get_f64_value = |key: &str| -> f64 {
            match map.get(key) {
                Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
                Some(Value::String(s)) => s.trim().parse().unwrap_or(0.0),
                _ => 0.0,
            }
        };

        let get_u32_value = |key: &str| -> u32 {
            match map.get(key) {
                Some(Value::Number(n)) => n.as_u64().unwrap_or(0) as u32,
                Some(Value::String(s)) => s.trim().parse().unwrap_or(0),
                _ => 0,
            }
        };

        Ok(OrderItem {
            item_number: get_trimmed_string("ItemNumber"),
            desc_full: get_trimmed_string("Desc_Full"),
            desc_short: get_trimmed_string("c_DescShort"),
            dept: get_trimmed_string("Dept"),
            category: get_trimmed_string("Category"),
            sub_category: get_trimmed_string("SubCategory"),
            retail_price: get_f64_value("RetailPrice"),
            mp: get_f64_value("MP"),
            unit: get_trimmed_string("Unit"),
            case_qty: get_u32_value("CaseQty"),
            cases_on_hand: get_f64_value("CasesOnHand"),
            qoh: get_u32_value("c_QOH"),
            order_filter: get_u32_value("OrderFilter"),
            filter_name: get_trimmed_string("FilterName"),
            bin_loc1: get_trimmed_string("BinLoc1"),
            bin_loc2: get_trimmed_string("BinLoc2"),
            req_id: get_trimmed_string("REQ_ID"),
            created_timestamp: get_trimmed_string("createdTimestamp"),
        })
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    pretty_env_logger::env_logger::builder()
        .format_timestamp(None)
        .filter_level(log::LevelFilter::Debug)
        .init();
    info!("Starting Filemaker Import Tool...");

    Filemaker::set_fm_url("https://fm.mardens.com/fmi/data/vLatest")?;
    let filemaker = Filemaker::new(
        "admin",
        "19MRCC77!",
        "StoreOrders",
        "CPItems~baseLocal  - Raw",
    )
    .await?;
    let items = filemaker.get_all_records::<OrderItem>().await?;

    set_database_name("stores")?;
    let connection_data = DatabaseConnectionData::get().await?;
    let pool = connection_data.get_pool().await?;

    println!("Item: {:?}", items[0]);

    //    for item in items {
    //        ProductRecord::create(&pool, item.desc_full.trim(), "")
    //    }

    pool.close().await;

    Ok(())
}
