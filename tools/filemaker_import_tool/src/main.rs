use anyhow::Result;
use database_common_lib::database_connection::{set_database_name, DatabaseConnectionData};
use filemaker_lib::Filemaker;
use log::info;
use serde::{Deserialize, Deserializer};
use serde_json::Value;
use sqlx::{MySql, Transaction};
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
async fn main() -> Result<()> {
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
    let mut transaction = pool.begin().await?;


    let categories = import_categories(&items, &mut transaction).await?;
    import_items(&items, categories, &mut transaction).await?;

    transaction.commit().await?;
    pool.close().await;
    Ok(())
}

async fn import_categories(
    items: &[OrderItem],
    transaction: &mut Transaction<'_, MySql>,
) -> Result<HashMap<String, u64>> {
    let mut category_names = items
        .iter()
        .map(|i| i.filter_name.clone())
        .collect::<Vec<String>>();
    category_names.sort();
    category_names.dedup();

    let mut categories: HashMap<String, u64> = HashMap::new();

    // Clear the "categories" table and the referenced products
    sqlx::query(r#"delete from categories"#)
        .execute(&mut **transaction)
        .await?;

    for name in category_names {
        let result = sqlx::query(r#"insert into categories (name, description, icon, parent_id) VALUES (?, NULL, NULL, NULL);"#)
            .bind(&name)
            .execute(&mut **transaction).await?;
        let id = result.last_insert_id();
        categories.insert(name, id);
    }

    Ok(categories)
}

async fn import_items(
    items: &[OrderItem],
    categories: HashMap<String, u64>,
    transaction: &mut Transaction<'_, MySql>,
) -> Result<()> {
    // Clear the "products" table
    sqlx::query(r#"delete from products"#)
        .execute(&mut **transaction)
        .await?;

    for item in items {
        let category_id = categories.get(&item.filter_name).unwrap_or(&0);

        sqlx::query(r#"insert into products (name, description, sku, category_id, image_url, price, in_stock, stock_quantity, bin_location, unit_type) values (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?);"#)
            .bind(&item.desc_short.trim_end_matches("..."))
            .bind(&item.desc_full)
            .bind(&item.item_number)
            .bind(category_id)
            .bind(item.mp)
            .bind(if item.cases_on_hand > 0f64 { 1u8 } else { 0u8 })
            .bind(item.cases_on_hand)
            .bind(format!("{}, {}", item.bin_loc1, item.bin_loc2))
            .bind(match item.unit.to_lowercase().as_str() {"each"=>0u8,"case"=>1u8,"roll"=> 2u8,_=>0u8})
            .execute(&mut **transaction).await?;
    }

    Ok(())
}
