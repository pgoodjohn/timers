// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate r2d2;
extern crate r2d2_sqlite;
extern crate rusqlite;

mod configuration;
mod storage;
mod timers;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


fn main() {
    let configuration = configuration::Configuration::load();
    plogger::init(configuration.development_mode);
    log::info!("Running Timers!");
    log::debug!("{:?}", &configuration);

    let db_pool = storage::setup_database(&configuration).expect("Could not set up database.");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(db_pool)
        .manage(configuration)
        .invoke_handler(tauri::generate_handler![
            greet,
            configuration::load_configuration_command,
            timers::start_timer_command,
            timers::start_pomodoro_timer_command,
            timers::finish_timer_command,
            timers::cancel_timer_command,
            timers::load_daily_statistics_command,
            timers::load_daily_history_command,
            timers::load_statistics_history_command,
            timers::get_active_timer_command,
            timers::load_timer_entries_history_command,
            timers::update_time_entry_activity_command,
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
