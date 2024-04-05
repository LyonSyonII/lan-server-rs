use axum::routing::{get, post};

mod channel;
mod message;

struct AppState {
    channels: tokio::sync::RwLock<std::collections::HashMap<String, std::sync::Arc<crate::channel::Channel>>>,
}

impl AppState {
    async fn load() -> Self {
        tokio::task::spawn_blocking(|| {
            let mut channels = std::collections::HashMap::new();
            std::fs::create_dir_all("/tmp/hitori/channels")?;
            for channel in std::fs::read_dir("/tmp/hitori/channels")?.flatten() {
                let reader = std::fs::OpenOptions::new()
                    .read(true)
                    .open(channel.path())?;
                let channel: channel::Channel = serde_yaml::from_reader(reader).unwrap();
                channels.insert(channel.name.clone(), std::sync::Arc::new(channel));
            }
            Ok::<AppState, std::io::Error>(Self { 
                channels: tokio::sync::RwLock::new(channels)
            })
        })
        .await
        .unwrap()
        .unwrap()
    }
    
    /// Returns "true" if the channel already exists
    async fn create_channel(&self, name: impl Into<String>) -> bool {
        let channels = &mut *self.channels.write().await;
        let name = name.into();
        let channel = std::sync::Arc::new(crate::channel::Channel::new(name.clone()));

        if let std::collections::hash_map::Entry::Vacant(e) = channels.entry(name) {
            e.insert(channel);
            false
        } else {
            true
        }
    }
}

#[tokio::main]
async fn main() {
    let app_state = std::sync::Arc::new(AppState::load().await);

    let ip = local_ip_address::local_ip().expect("Could not get local IP address!");
    let addr = std::net::SocketAddr::new(ip, 5555);

    let app = axum::Router::new()
        .route("/", get(index))
        .route("/ws", get(websocket_handler))
        .route("/channels", get(get_channels))
        .route("/channels", post(post_channels))
        .with_state(app_state);
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|_| panic!("Could not bind to address: {addr}"));
    println!("Listening on http://{addr}");
    axum::serve(listener, app)
        .await
        .expect("Could not start server!");
}

async fn index() -> impl axum::response::IntoResponse {
    axum::response::Html("<h1>Hello world!<h1/>")
}

async fn get_channels(
    state: axum::extract::State<std::sync::Arc<AppState>>,
) -> axum::response::Json<Vec<String>> {
    axum::response::Json(state.channels.read().await.keys().cloned().collect())
}

#[axum::debug_handler]
async fn post_channels(
    state: axum::extract::State<std::sync::Arc<AppState>>,
    name: axum::extract::Json<String>,
) -> impl axum::response::IntoResponse {
    println!("Creating channel {:?}", name.0);
    if state.create_channel(name.0).await {
        axum::http::StatusCode::CONFLICT
    } else {
        axum::http::StatusCode::CREATED
    }
}

#[derive(serde::Deserialize)]
struct WebSocketParams {
    channel: String
}

async fn websocket_handler(
    params: axum::extract::Query<WebSocketParams>,
    ws: axum::extract::WebSocketUpgrade,
    state: axum::extract::State<std::sync::Arc<AppState>>,
) -> impl axum::response::IntoResponse {
    let WebSocketParams { channel } = params.0;
    ws.on_upgrade( move |socket| websocket(channel, socket, state.0))
}

async fn websocket(channel: String, stream: axum::extract::ws::WebSocket, state: std::sync::Arc<AppState>) {
    use futures::SinkExt as _;
    use futures::StreamExt as _; // .split()

    let (mut sender, mut receiver) = stream.split();
    
    let channels = state.channels.read().await;
    let Some(channel) = channels.get(&channel).cloned() else { return };
    drop(channels);

    let (tx, mut rx) = channel.subscribe();

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender
                .send(axum::extract::ws::Message::Text(msg))
                .await
                .is_err()
            {
                break;
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(axum::extract::ws::Message::Text(text))) = receiver.next().await {
            let _ = tx.send(text);
        }
    });

    // If one task completes, abort the other
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort()
    }

    channel.send("Left!");
}
