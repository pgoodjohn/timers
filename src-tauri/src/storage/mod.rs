use log;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

pub fn setup_database(
    configuration: &super::configuration::Configuration,
) -> Result<Pool<SqliteConnectionManager>, String> {
    log::debug!("Initializing db {:?}", &configuration.db_path);
    let manager = SqliteConnectionManager::file(std::path::PathBuf::from(&configuration.db_path));
    log::debug!("DB Was initialized");

    match r2d2::Pool::new(manager) {
        Ok(pool) => {
            setup_structure(&pool, configuration).unwrap();
            log::debug!("Pool Was initialized");
            Ok(pool)
        }
        Err(e) => {
            log::error!("Could not initialize db: {:?}", e);
            Err(String::from("Could not initialize database"))
        }
    }
}

// TODO: Manage db versions
pub fn setup_structure(
    pool: &Pool<SqliteConnectionManager>,
    configuration: &super::configuration::Configuration,
) -> rusqlite::Result<()> {
    // if configuration.development_mode {
    //     log::debug!("H.Q.! is running in development mode, not executing migrations");
    //     return Ok(());
    // }

    pool.get()
        .unwrap()
        .execute(
            "CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY,
                migrated_at DATETIME NOT NULL
            );",
            [],
        )
        .unwrap();

    pool.get()
        .unwrap()
        .execute(
            "
            CREATE TABLE IF NOT EXISTS timer_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_string TEXT NOT NULL,
                timers_started INTEGER NOT NULL,
                timers_finished INTEGER NOT NULL,
                timers_cancelled INTEGER NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );",
            [],
        )
        .unwrap();

    pool.get()
        .unwrap()
        .execute(
            "
            CREATE TABLE IF NOT EXISTS timers (
                id INTEGER PRIMARY KEY,
                activity TEXT DEFAULT NULL,
                area TEXT DEFAULT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME DEFAULT NULL,
                duration INTEGER NOT NULL DEFAULT 0,
                is_pomodoro BOOLEAN,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
           ",
            [],
        )
        .unwrap();

    Ok(())
}
