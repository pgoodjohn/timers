pub struct TodaysStatistics {
    total_timers_duration: i32,
    activities: Vec<ActivityStatistic>
}

pub struct ActivityStatistic {
    activity: String,
    total_timers_duration: i32,
    timers: Vec<crate::Timer>
}

