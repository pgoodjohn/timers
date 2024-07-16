use rusqlite::config;
use serde::Serialize;
use std::fs::File;
use std::path::PathBuf;
use std::str::FromStr;

#[derive(Debug, Serialize)]
pub struct Configuration {
    pub version: String,
    #[serde(rename = "developmentMode")]
    pub development_mode: bool,
    #[serde(rename = "configurationPath")]
    pub config_path: PathBuf,
    #[serde(rename = "dbPath")]
    pub db_path: PathBuf,
}

impl Configuration {
    pub fn init_development_config() -> Self {
        Configuration {
            version: String::from(format!("{}-dev", env!("CARGO_PKG_VERSION"))),
            development_mode: true,
            config_path: PathBuf::from_str("./config.toml")
                .expect("Could not create development config file pathbuf"),
            db_path: PathBuf::from_str("./file.db")
                .expect("Could not create development db file pathbuf"),
        }
    }

    fn config_path() -> PathBuf {
        let mut config_path = PathBuf::new();
        config_path.push(dirs::home_dir().expect("Could not load home dir"));
        config_path.push(".config/.timers/config.toml");

        println!("Loading config_path {:?}", config_path);

        if let Some(parent) = config_path.parent() {
            if !parent.exists() {
                log::info!("Creating configuration directory for {:?}", &config_path);
                std::fs::create_dir_all(parent).expect("Could not create configuration directory");
                println!("Directory created: {:?}", parent);
            }
        }

        if !config_path.exists() {
            log::info!("Creating configuration file {:?}", &config_path);
            File::create(&config_path).expect("Could not create config file");
        }

        config_path
    }

    fn db_path() -> PathBuf {
        let mut db_path = PathBuf::new();
        db_path.push(dirs::home_dir().expect("Could not load home dir"));
        db_path.push(".config/.timers/db.sqlite");

        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent).expect("Could not create configuration directory");
                println!("Directory created: {:?}", parent);
            }
        }

        if !db_path.exists() {
            File::create(&db_path).expect("Could not create config file");
        }

        db_path
    }

    pub fn load() -> Self {
        if cfg!(debug_assertions) {
            return Configuration::init_development_config();
        }

        Configuration {
            version: String::from(env!("CARGO_PKG_VERSION")),
            development_mode: false,
            config_path: Configuration::config_path(),
            db_path: Configuration::db_path(),
        }
    }
}

#[tauri::command]
pub fn load_configuration_command() -> String {
    let configuration = Configuration::load();

    serde_json::to_string(&configuration).unwrap()
}
