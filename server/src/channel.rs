use crate::CHANNELS;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub(crate) struct Channel {
    pub(crate) name: String,
    #[serde(
        serialize_with = "serialize_messages",
        deserialize_with = "deserialize_messages"
    )]
    pub(crate) messages: tokio::sync::RwLock<Vec<crate::message::Message>>,

    #[serde(skip)]
    #[serde(default = "new_channel")]
    tx: tokio::sync::broadcast::Sender<String>,
}

impl Channel {
    pub(crate) fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            messages: tokio::sync::RwLock::new(Vec::new()),
            tx: new_channel(),
        }
    }

    pub(crate) fn subscribe(
        &self,
    ) -> (
        tokio::sync::broadcast::Sender<String>,
        tokio::sync::broadcast::Receiver<String>,
    ) {
        (self.tx.clone(), self.tx.subscribe())
    }
    pub(crate) fn send(&self, message: impl Into<String>) {
        let _ = self.tx.send(message.into());
    }
    pub(crate) async fn add_message(self: &std::sync::Arc<Self>, message: impl Into<String>) {
        let mut messages = self.messages.write().await;
        messages.push(crate::message::Message::new(message.into()));
        drop(messages);
        self.save_to_file().await.unwrap();
    }
    pub(crate) async fn save_to_file(self: &std::sync::Arc<Self>) -> std::io::Result<()> {
        use tokio::io::AsyncWriteExt;

        let path = std::path::PathBuf::from(CHANNELS)
            .join(&self.name)
            .with_extension("yaml");

        let mut file = tokio::fs::OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(path)
            .await?;
        let clone = self.clone();
        let serialized =
            tokio::task::spawn_blocking(move || serde_yaml::to_string(&*clone).unwrap())
                .await
                .unwrap();
        file.write_all(serialized.as_bytes()).await?;

        Ok(())
    }
}

fn new_channel() -> tokio::sync::broadcast::Sender<String> {
    let (tx, _) = tokio::sync::broadcast::channel::<String>(100);
    tx
}

fn serialize_messages<S: serde::Serializer>(
    messages: &tokio::sync::RwLock<Vec<crate::message::Message>>,
    serializer: S,
) -> Result<S::Ok, S::Error> {
    let messages = &*messages.blocking_read();
    serde::ser::Serialize::serialize(messages, serializer)
}

fn deserialize_messages<'de, D: serde::Deserializer<'de>>(
    deserializer: D,
) -> Result<tokio::sync::RwLock<Vec<crate::message::Message>>, D::Error> {
    let messages = serde::Deserialize::deserialize(deserializer)?;
    Ok(tokio::sync::RwLock::new(messages))
}

impl std::fmt::Display for Channel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = serde_yaml::to_string(self).map_err(|_| std::fmt::Error)?;
        f.write_str(&s)
    }
}

impl Clone for Channel {
    fn clone(&self) -> Self {
        Self {
            name: self.name.clone(),
            messages: tokio::sync::RwLock::new(self.messages.blocking_read().clone()),
            tx: self.tx.clone(),
        }
    }
}
