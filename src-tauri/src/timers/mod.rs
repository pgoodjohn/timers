use chrono::prelude::*;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use tauri::State;

mod entries;
mod notifications;
mod statistics;

#[tauri::command]
pub fn start_pomodoro_timer_command(
    activity: Option<String>,
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Start pomodoro timer command handler started");

    // TODO: Handle errors.
    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    statistics::mark_timer_started(&connection, now).expect("Could not mark timer as started");
    let _timer_entry = entries::TimerEntry::create(activity, None, &connection, now, true)
        .expect("Could not start timer entry");
    notifications::send_timer_start_notification().expect("Could not send notification");

    Ok(String::from("Ok"))
}

#[tauri::command]
pub fn start_timer_command(
    activity: Option<String>,
    area: Option<String>,
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Start timer command handler started");

    // TODO: Handle errors.
    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    let _timer_entry = entries::TimerEntry::create(activity, area, &connection, now, false)
        .expect("Could not start timer entry");

    Ok(String::from("Ok"))
}

#[tauri::command]
pub fn cancel_timer_command(db: State<Pool<SqliteConnectionManager>>) -> Result<String, String> {
    log::debug!("Cancel timer command handler started");

    // TODO: Handle errors.
    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    let timer_entry = entries::TimerEntry::get_active_entry(&connection)
        .expect("could not load timer entry from storage");

    match timer_entry {
        Some(mut timer_entry) => {
            timer_entry
                .end(&connection)
                .expect("Could not update end time on time entry");
            statistics::mark_timer_cancelled(&connection, now)
                .expect("Could not mark timer as cancelled");
            notifications::send_timer_cancelled_notification()
                .expect("Could not send notification");
        }
        None => {}
    }

    Ok(String::from("Ok"))
}

#[tauri::command]
pub fn finish_timer_command(db: State<Pool<SqliteConnectionManager>>) -> Result<String, String> {
    log::debug!("Finish timer command handler started");

    // TODO: Handle errors.
    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    let timer_entry = entries::TimerEntry::get_active_entry(&connection)
        .expect("could not load timer entry from storage");

    match timer_entry {
        Some(mut timer_entry) => {
            timer_entry
                .end(&connection)
                .expect("Could not update end time on time entry");

            if timer_entry.is_pomodoro {
                statistics::mark_timer_finished(&connection, now)
                    .expect("Could not mark timer as finished");
                notifications::send_timer_finished_notification()
                    .expect("Could not send notification");
            }
        }
        None => {}
    }

    Ok(String::from("Ok"))
}

#[tauri::command]
pub fn get_active_timer_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Get active timer command handler started");

    let connection = db.get().expect("Failed to get db connection");

    match entries::TimerEntry::get_active_entry(&connection).expect("Could not fetch entry from db")
    {
        Some(t) => Ok(serde_json::to_string(&t).expect("Could not convert time entry to json")),
        None => Err(String::from("No timer")),
    }
}

#[tauri::command]
pub fn update_time_entry_activity_command(
    db: State<Pool<SqliteConnectionManager>>,
    activity: String,
    time_entry_id: i32,
) -> Result<String, String> {
    log::debug!("Update timer entry activity command handler started");

    let connection = db.get().expect("Failed to get db connection");

    let time_entry =
        entries::TimerEntry::find(time_entry_id, &connection).expect("Failed to load data from db");

    match time_entry {
        Some(mut t) => {
            t.set_activity(activity, &connection);
            Ok(String::from("Updated"))
        }
        None => Err(String::from("Time entry not found")),
    }
}

#[tauri::command]
pub fn load_timer_entries_history_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Load timer entries history command handler started");

    let connection = db.get().expect("Failed to get db connection");

    let history =
        entries::TimerEntry::get_history(&connection).expect("Failed to get data from db");

    Ok(serde_json::to_string(&history).expect("Failed to encode to json"))
}

#[tauri::command]
pub fn load_daily_history_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Load daily history command handler started");

    let connection = db.get().expect("Failed to get db connection");

    let daily_history = entries::TimerEntry::get_history_by_date(&connection).unwrap();

    Ok(serde_json::to_string(&daily_history).unwrap())
}

#[tauri::command]
pub fn load_daily_statistics_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Loading daily statistics command handler started");

    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    let statistics =
        statistics::load_statistic_for_date(&connection, now).expect("Could not load statistics");

    Ok(serde_json::to_string(&statistics).expect("Could not serialize statistics"))
}

#[tauri::command]
pub fn load_statistics_history_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Loading statistics history command handler started");

    let connection = db.get().expect("Failed to get db connection");

    let statistics = statistics::TimerStatistic::load_statistics_history(&connection, 10)
        .expect("Could not load statistics");

    Ok(serde_json::to_string(&statistics).expect("Could not serialize statistics"))
}

#[tauri::command]
pub fn load_activity_statistics_for_date_command(
    db: State<Pool<SqliteConnectionManager>>,
) -> Result<String, String> {
    log::debug!("Loading activity statistics for date command handler started");

    let connection = db.get().expect("Failed to get db connection");
    let now = Utc::now();

    let statistics =
        statistics::ActivityStatistic::load_activity_statistics_for_date(&connection, now)
            .expect("Could not load statistics");

    Ok(serde_json::to_string(&statistics).expect("Could not serialize statistics"))
}
