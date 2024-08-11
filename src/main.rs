use tokio::io::AsyncWriteExt;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let (handle, addr) = listen().await?;
    
    println!("Listening on http://{}", addr);

    handle.await.unwrap();

    Ok(())
}

async fn listen() -> std::io::Result<(tokio::task::JoinHandle<()>, std::net::SocketAddr)> {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:5555").await?;
    let addr = listener.local_addr()?;
    let handle = tokio::spawn(async move {
        loop {
            if let Ok((stream, addr)) = listener.accept().await {
                tokio::spawn(handle_client(stream, addr));
            }
        }
    });
    Ok((handle, addr))
}

async fn handle_client(mut stream: tokio::net::TcpStream, addr: std::net::SocketAddr) {
    println!("Accepted client {addr}");
    
    let response = include_html!("./html/index.html");
    stream.write_all(response).await.unwrap();
}

#[macro_export]
macro_rules! html {
    ( $($html:tt)* ) => {{
        const HTML: &str = stringify!($($html)*);
        const_format::formatcp!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{HTML}", str::len(HTML)).as_bytes()
    }}
}

#[macro_export]
macro_rules! include_html {
    ( $html:literal ) => {{
        const HTML: &str = include_str!($html);
        const_format::formatcp!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{HTML}", str::len(HTML)).as_bytes()
    }};
}