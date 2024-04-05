#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub(crate) struct Channel {
    pub(crate) name: String,
    #[serde(
        serialize_with = "serialize_messages",
        deserialize_with = "deserialize_messages"
    )]
    pub(crate) messages: std::sync::RwLock<Vec<crate::message::Message>>,

    #[serde(skip)]
    #[serde(default = "new_channel")]
    tx: tokio::sync::broadcast::Sender<String>,
}

impl Channel {
    pub(crate) fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            messages: std::sync::RwLock::new(Vec::new()),
            tx: new_channel()
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
    pub(crate) fn add_message(&self, message: impl Into<String>) {
        let messages = &mut *self.messages.write().unwrap();
        messages.push(crate::message::Message::new(message.into()));
    }
}

fn new_channel() -> tokio::sync::broadcast::Sender<String> {
    let (tx, _) = tokio::sync::broadcast::channel::<String>(100);
    tx
}

fn serialize_messages<S: serde::Serializer>(
    messages: &std::sync::RwLock<Vec<crate::message::Message>>,
    serializer: S,
) -> Result<S::Ok, S::Error> {
    let messages = &*messages.read().unwrap();
    serde::ser::Serialize::serialize(messages, serializer)
}

fn deserialize_messages<'de, D: serde::Deserializer<'de>>(
    deserializer: D,
) -> Result<std::sync::RwLock<Vec<crate::message::Message>>, D::Error> {
    let messages = serde::Deserialize::deserialize(deserializer)?;
    Ok(std::sync::RwLock::new(messages))
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
            messages: std::sync::RwLock::new(self.messages.read().unwrap().clone()),
            tx: self.tx.clone(),
        }
    }
}
