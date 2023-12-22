use axum::routing::get;


#[tokio::main]
async fn main() {
    let ip = local_ip_address::local_ip().expect("Could not get local IP address!");
    let addr = std::net::SocketAddr::new(ip, 5555);

    let app = axum::Router::new().route("/", get(|| async { "Hello, World!" }));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap_or_else(|_| { panic!("Could not bind to address: {addr}") });
    println!("Listening on http://{addr}");
    axum::serve(listener, app).await.expect("Could not start server!");
}
