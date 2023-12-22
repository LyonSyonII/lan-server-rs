use actix_web::{get, Responder};

#[get("/")]
async fn hello() -> impl Responder {
    "Hello World!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let ip = local_ip_address::local_ip().unwrap();
    actix_web::HttpServer::new(|| {
        actix_web::App::new()
            .wrap(actix_web::middleware::Logger::default())
            .service(hello)
    })
    .bind((ip, 5555))?
    .run()
    .await
}