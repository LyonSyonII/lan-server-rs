#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub(crate) struct Message {
    pub(crate) date: chrono::DateTime<chrono::FixedOffset>,
    pub(crate) text: String,
}

impl Message {
    pub(crate) fn new(text: String) -> Self {
        let time = chrono::prelude::Utc::now();
        Self {
            date: time.into(),
            text,
        }
    }
}
