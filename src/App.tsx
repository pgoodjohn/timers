import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./globals.css";
import TimerTable from "./components/timersTable";
import { z } from "zod"

import ActiveTimer from "./components/activeTimer";
import NewTimerForm from "./components/newTimer";


function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const formattedHours = hours > 0 ? `${hours}:` : '';
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}

function App() {
  const [timersHistory, setTimersHistory] = useState<any[]>([]);
  const [activeTimerChecked, setActiveTimerChecked] = useState<boolean>(false);
  const [timer, setTimer] = useState<any>(null);
  const [configuration, setConfiguration] = useState<any>(null);
  const [dailyStatistics, setDailyStatistics] = useState<any>(null);

  const formSchema = z.object({
    activity: z.string().min(0).max(50),
    area: z.string().min(0).max(50),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)


    if (timer) {
      stopTimer();
      values.activity = "";
      values.area = "";
      return;
    } 


    invoke("start_timer_command", { activity: values.activity, area: values.area }).then((response) => {
      setTimer({
        start_time: new Date().toISOString(),
        activity: values.activity,
        area: values.area,
      })
      console.debug("Timer started!", response);
      values.activity = "";
      values.area = "";
    }).catch((e) => {
      console.error(e);
    });
  }

  function loadConfiguration() {
    invoke("load_configuration_command").then((response) => {
      const config = JSON.parse(response as string);
      console.debug("Loaded configuration", config);
      setConfiguration(config);
    })
  }

  const loadActiveTimer = async () => {
    invoke("get_active_timer_command").then((activeTimer) => {
      const timer = JSON.parse(activeTimer as string);
      console.debug(timer);
      setTimer(timer);
    }).catch((e) => {
      console.error(e);
    });
  }

  const loadActivityStats = () => {
    invoke("load_activity_statistics_for_date_command").then((response) => {
      const stats = JSON.parse(response as string);
      console.debug("Loaded daily statistics", stats);
      setDailyStatistics(stats);
    }).catch((e) => {
      console.error(e);
    });
  }

  const stopTimer = () => {
    setTimer(null);
    invoke("finish_timer_command").then(() => {
      console.debug("Timer stopped!");
      loadTimersHistory();
      loadActivityStats();
    }).catch((e) => {
      console.error(e);
    });
  }

  const loadTimersHistory = () => {
    invoke("load_timer_entries_history_command").then((timers) => {
      const timersArray = JSON.parse(timers as string);
      console.debug("Loaded timers history", timersArray);
      setTimersHistory(timersArray);
    }).catch((e) => {
      console.error(e);
    });
  }

  if (timersHistory.length === 0) {
    loadTimersHistory();
  }

  if (activeTimerChecked === false) {
    loadActiveTimer();
    setActiveTimerChecked(true)
  }

  if (configuration === null) {
    loadConfiguration();
  }

  if (dailyStatistics === null) {
    loadActivityStats();
  }

  return (
    <div className="max-h-screen flex">
      <div
        className="w-1/6 bg-gray-800 text-white min-h-screen max-h-screen flex flex-col"
      >
        <p className="p-4">
          Timers!
        </p>
        {configuration &&
          configuration.developmentMode &&
          <>
            <div className="flex-grow"></div>
            <p className="text-xs text-center text-gray-400">{configuration.version}</p>
            <p className="bg-red-500 text-white p-2 text-xs text-center">Dev Mode</p>
          </>
        }
      </div>
      <div className="p-4 flex flex-col w-full">
        <div className="flex"> {/* Timer and Daily Statistics*/}
          <div className="w-1/3 px-8"> {/* Daily Statistics*/}
            <p className="text-lg">Daily Activity Statistics</p>
            <div>
              {dailyStatistics && dailyStatistics.map((stat: any) => {
                return (
                  <div key={stat.activity} className="flex w-full justify-between">
                    <div className="font-semibold">{stat.activity}</div>
                    <div className="">{formatDuration(stat.total_duration)} ({stat.total_timers})</div>
                  </div>
                )
              }
              )}
            </div>
          </div>
          <div className="w-full"> 
            {/* <ActiveTimer timer={timer} stopTimer={stopTimer} /> */}
            <NewTimerForm timer={timer} onSubmit={onSubmit} />
          </div>
        </div>
        <div>
          <TimerTable timers={timersHistory} />
        </div>
      </div>
    </div>
  );
}

export default App;
