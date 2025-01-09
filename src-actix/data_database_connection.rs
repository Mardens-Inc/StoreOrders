use serde::Deserialize;

#[derive(Deserialize, Clone, Debug)]
pub struct DatabaseConnectionData {
    pub host: String,
    pub user: String,
    pub password: String,
    pub hash: String,
}

impl DatabaseConnectionData {
    pub(crate) async fn get() -> Result<Self, Box<dyn std::error::Error>> {
        let url = "https://lib.mardens.com/config.json";
        let response = reqwest::get(url).await?.json::<Self>().await?;
        Ok(response)
    }
}
