use notify_rust::Notification;

pub fn send_timer_start_notification() -> Result<(), ()> {
    println!("Sending notification");
    Notification::new()
        .summary("H.Q.! Timer Started")
        .body("Your timer has been started.")
        .show()
        .unwrap();

    Ok(())
}

pub fn send_timer_finished_notification() -> Result<(), ()> {
    println!("Sending notification");
    Notification::new()
        .summary("H.Q.! Timer Finished")
        .body("Your timer has finished.")
        .show()
        .unwrap();

    Ok(())
}

pub fn send_timer_cancelled_notification() -> Result<(), ()> {
    println!("Sending notification");
    Notification::new()
        .summary("H.Q.! Timer Cancelled")
        .body("Your timer has been cancelled.")
        .show()
        .unwrap();

    Ok(())
}
