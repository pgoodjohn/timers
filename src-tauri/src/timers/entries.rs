use std::collections::HashMap;

use chrono::{Date, DateTime, Duration, NaiveDate, Utc};
use rusqlite::{Connection, OptionalExtension, Result, Row, Statement};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TimerEntry {
    pub id: i32,
    pub activity: Option<String>,
    pub area: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration: i32,
    pub is_pomodoro: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TimerEntry {
    pub fn new(start_time: DateTime<Utc>, is_pomodoro: bool) -> Self {
        TimerEntry {
            id: 0,
            activity: None,
            area: None,
            start_time: start_time,
            end_time: None,
            duration: 0,
            is_pomodoro: is_pomodoro,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    pub fn set_activity(&mut self, activity: String, conn: &Connection) -> Result<()> {
        self.activity = Some(activity);
        self.save(conn);

        Ok(())
    }

    pub fn end(&mut self, conn: &Connection) -> Result<()> {
        self.end_time = Some(Utc::now());
        self.save(conn);

        Ok(())
    }

    pub fn find(id: i32, conn: &Connection) -> Result<Option<Self>> {
        let row: Option<Self> = conn
            .query_row(
                "SELECT * FROM timers WHERE id = ?1",
                rusqlite::params![id],
                Self::from_row,
            )
            .optional()?;

        match row {
            Some(mut record) => Ok(Some(record)),
            None => Ok(None),
        }
    }

    pub fn get_active_entry(conn: &Connection) -> Result<Option<Self>> {
        let row: Option<Self> = conn
            .query_row(
                "SELECT * FROM timers WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1",
                rusqlite::params![],
                Self::from_row,
            )
            .optional()?;

        match row {
            Some(record) => Ok(Some(record)),
            None => Ok(None),
        }
    }

    pub fn get_history(conn: &Connection) -> Result<Vec<Self>> {
        let mut stmt = conn.prepare(
            "SELECT * FROM timers WHERE end_time IS NOT NULL ORDER BY start_time DESC LIMIT 5",
        )?;
        let rows = stmt.query_map([], Self::from_row)?;

        let mut vec: Vec<TimerEntry> = Vec::new();

        for row in rows {
            vec.push(row.unwrap());
        }

        Ok(vec)
    }

    pub fn get_history_by_date(conn: &Connection) -> Result<HashMap<NaiveDate, Vec<Self>>> {
        let mut map: HashMap<NaiveDate, Vec<Self>> = HashMap::new();

        let timers = TimerEntry::get_history(conn)?;

        for t in timers {
            let date_key = t.start_time.date().naive_local();
            map.entry(date_key).or_insert_with(Vec::new).push(t);
        }

        Ok(map)
    }

    // Create a new record in the database with the given start_time
    pub fn create(
        activity: Option<String>,
        area: Option<String>,
        conn: &Connection,
        start_time: DateTime<Utc>,
        is_pomodoro: bool,
    ) -> Result<Self> {
        let mut new_row = Self::new(start_time, is_pomodoro);
        conn.execute(
            "INSERT INTO timers (start_time, activity, area, is_pomodoro, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![new_row.start_time.to_rfc3339(), activity, area, new_row.is_pomodoro, new_row.created_at.to_rfc3339(), new_row.updated_at.to_rfc3339()],
        )?;
        new_row.id = conn.last_insert_rowid() as i32;
        Ok(new_row)
    }

    // Save the current record to the database
    pub fn save(&self, conn: &Connection) -> Result<()> {
        log::debug!("Updating timer {:?}", self);

        let mut duration = self.duration;

        match self.end_time {
            Some(e) => {
                let difference = e - self.start_time;
                duration = difference.num_seconds() as i32;
            }
            None => {}
        }

        conn.execute(
            "UPDATE timers SET activity = ?1, start_time = ?2, end_time = ?3, duration = ?4, is_pomodoro = ?5, updated_at = ?6 WHERE id = ?7",
            rusqlite::params![
                self.activity,
                self.start_time.to_rfc3339(),
                // Truly GPT-ed the fuck away out of this one
                self.end_time.as_ref().map_or(None, |s| Some(s.to_rfc3339())),
                duration,
                self.is_pomodoro,
                Utc::now().to_rfc3339(),
                self.id,
            ],
        )?;
        Ok(())
    }

    fn from_row(row: &Row) -> Result<Self> {
        let start_time_col: String = row.get(3)?;
        let start_time =
            DateTime::<Utc>::from(DateTime::parse_from_rfc3339(&start_time_col).unwrap());
        let end_time_col: Option<String> = row.get(4)?;
        let created_at_col: String = row.get(7)?;
        let updated_at_col: String = row.get(8)?;

        let mut duration = 0;

        match &end_time_col {
            Some(e) => {
                duration = row.get(5)?;
            }
            None => {
                let now = Utc::now();
                let difference = now - start_time;
                duration = difference.num_seconds();
            }
        }

        Ok(Self {
            id: row.get(0)?,
            activity: row.get(1)?,
            area: row.get(2)?,
            start_time: DateTime::<Utc>::from(
                DateTime::parse_from_rfc3339(&start_time_col).unwrap(),
            ),
            end_time: match end_time_col {
                Some(e) => Some(DateTime::<Utc>::from(
                    DateTime::parse_from_rfc3339(&e).unwrap(),
                )),
                None => None,
            },
            duration: duration as i32,
            is_pomodoro: row.get(6)?,
            created_at: DateTime::<Utc>::from(
                DateTime::parse_from_rfc3339(&created_at_col).unwrap(),
            ),
            updated_at: DateTime::<Utc>::from(
                DateTime::parse_from_rfc3339(&updated_at_col).unwrap(),
            ),
        })
    }
}
