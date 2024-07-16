use chrono::{DateTime, Duration, Utc};
use rusqlite::{Connection, OptionalExtension, Result, Row};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TimerStatistic {
    pub id: i32,
    pub date_string: String,
    pub timers_started: i32,
    pub timers_finished: i32,
    pub timers_cancelled: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TimerStatistic {
    pub fn new(date_string: String) -> Self {
        TimerStatistic {
            id: 0,
            date_string: date_string,
            timers_started: 0,
            timers_finished: 0,
            timers_cancelled: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // Find or create a record in the database with the given date_string
    pub fn find_or_create(conn: &Connection, date_string: &str) -> Result<Self> {
        let row: Option<Self> = conn
            .query_row(
                "SELECT * FROM timer_statistics WHERE date_string = ?1",
                rusqlite::params![date_string],
                Self::from_row,
            )
            .optional()?;

        match row {
            Some(record) => Ok(record),
            None => Self::create(conn, date_string),
        }
    }

    pub fn load_statistics_history(conn: &Connection, days: i64) -> Result<Vec<TimerStatistic>> {
        let yesterday = Utc::now().naive_utc() - Duration::days(1);
        let x_days_ago = yesterday - Duration::days(days);

        // Fetch rows where the date_string is greater than or equal to x_days_ago
        let mut stmt = conn.prepare(
            "SELECT * FROM timer_statistics WHERE date(date_string) >= date(?1) AND date(date_string) <= date(?2) ORDER BY date_string DESC",
        )?;

        let rows = stmt.query_map(
            rusqlite::params![x_days_ago.to_string(), yesterday.to_string()],
            TimerStatistic::from_row,
        )?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }

        Ok(result)
    }

    // Create a new record in the database with the given date_string
    pub fn create(conn: &Connection, date_string: &str) -> Result<Self> {
        let mut new_row = Self::new(date_string.to_string());
        conn.execute(
            "INSERT INTO timer_statistics (date_string, timers_started, timers_finished, timers_cancelled, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![new_row.date_string, new_row.timers_started, new_row.timers_finished, new_row.timers_cancelled, new_row.created_at.to_rfc3339(), new_row.updated_at.to_rfc3339()],
        )?;
        new_row.id = conn.last_insert_rowid() as i32;
        Ok(new_row)
    }

    pub fn increment_timers_started(&mut self, conn: &Connection) -> Result<()> {
        self.timers_started += 1;
        self.save(conn)
    }

    pub fn increment_timers_finished(&mut self, conn: &Connection) -> Result<()> {
        self.timers_finished += 1;
        self.save(conn)
    }

    pub fn increment_timers_cancelled(&mut self, conn: &Connection) -> Result<()> {
        self.timers_cancelled += 1;
        self.save(conn)
    }

    // Save the current record to the database
    pub fn save(&self, conn: &Connection) -> Result<()> {
        log::debug!("Saving timer statistic {:?}", self);
        conn.execute(
                "UPDATE timer_statistics SET timers_started = ?1, timers_finished = ?2, timers_cancelled = ?3, updated_at = ?4 WHERE id = ?5",
                rusqlite::params![self.timers_started, self.timers_finished, self.timers_cancelled, Utc::now().to_rfc3339(), self.id],
            )?;
        Ok(())
    }

    fn from_row(row: &Row) -> Result<Self> {
        let created_at_column: String = row.get(5)?;
        let updated_at_column: String = row.get(6)?;

        Ok(Self {
            id: row.get(0)?,
            date_string: row.get(1)?,
            timers_started: row.get(2)?,
            timers_finished: row.get(3)?,
            timers_cancelled: row.get(4)?,
            created_at: DateTime::<Utc>::from(
                DateTime::parse_from_rfc3339(&created_at_column).unwrap(),
            ),
            updated_at: DateTime::<Utc>::from(
                DateTime::parse_from_rfc3339(&updated_at_column).unwrap(),
            ),
        })
    }
}

pub fn load_statistic_for_date(conn: &Connection, date: DateTime<Utc>) -> Result<TimerStatistic> {
    log::debug!("Loading statistics for {:?}", date);

    let date_string = date.format("%Y-%m-%d").to_string();

    let timer_statistic = TimerStatistic::find_or_create(conn, &date_string)
        .expect("Could not retrieve daily statistics");

    Ok(timer_statistic)
}

pub fn mark_timer_started(conn: &Connection, date: DateTime<Utc>) -> Result<()> {
    log::debug!("Marking timer started at {:?}", date);

    let date_string = date.format("%Y-%m-%d").to_string();

    let mut timer_statistic = TimerStatistic::find_or_create(conn, &date_string)
        .expect("Could not retrieve daily statistics");
    timer_statistic.increment_timers_started(conn);

    Ok(())
}

pub fn mark_timer_finished(conn: &Connection, date: DateTime<Utc>) -> Result<()> {
    log::debug!("Marking timer finished at {:?}", date);

    let date_string = date.format("%Y-%m-%d").to_string();

    let mut timer_statistic = TimerStatistic::find_or_create(conn, &date_string)
        .expect("Could not retrieve daily statistics");
    timer_statistic.increment_timers_finished(conn);

    Ok(())
}

pub fn mark_timer_cancelled(conn: &Connection, date: DateTime<Utc>) -> Result<()> {
    log::debug!("Marking timer cancelled at {:?}", date);

    let date_string = date.format("%Y-%m-%d").to_string();

    let mut timer_statistic = TimerStatistic::find_or_create(conn, &date_string)
        .expect("Could not retrieve daily statistics");
    timer_statistic.increment_timers_cancelled(conn);

    Ok(())
}
