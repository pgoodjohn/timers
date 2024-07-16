import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./globals.css";
import { Button } from "./components/ui/button";
import CountdownTimer from "./components/countdownTimer";
import { Input } from "./components/ui/input";
import TimerTable from "./components/timersTable";

function App() {
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timersHistory, setTimersHistory] = useState<any[]>([]);
  const [newTimerActivity, setNewTimerActivity] = useState<string>("");
  const [newTimerArea, setNewTimerArea] = useState<string>("");
  const [timer, setTimer] = useState<any>(null);
  const [configuration, setConfiguration] = useState<any>(null);

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
      setTimerStart(new Date(timer.start_time));
    }).catch((e) => {
      console.error(e);
    });
  }

  const startTimer = () => {
    console.debug(newTimerActivity);
    invoke("start_timer_command", { activity: newTimerActivity, area: newTimerArea }).then((response) => {
      setTimer({
        start_time: new Date().toISOString(),
        activity: newTimerActivity,
        area: newTimerArea,
      })
      setTimerStart(new Date());
      console.debug("Timer started!", response);
      setNewTimerActivity("");
      setNewTimerArea("");
    }).catch((e) => {
      console.error(e);
    });
  }

  const stopTimer = () => {
    setTimerStart(null);
    invoke("finish_timer_command").then(() => {
      console.debug("Timer stopped!");
      loadTimersHistory();
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

  if (timerStart === null) {
    loadActiveTimer();
  }

  if (timersHistory.length === 0) {
    loadTimersHistory();
  }

  if (configuration === null) {
    loadConfiguration();
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
        {timerStart &&
          <div className="flex flex-col">
            <div className="flex">
              <p>Timer started at {timerStart.toLocaleTimeString()}</p>
            </div>
            <div className="text-center">
              <CountdownTimer startDate={timerStart} />
              <div className="flex flex-col">
                {timer.activity ?? <p className="text-lg">{timer.activity}</p>}
                <br />
                {timer.area ?? <p className="text-sm">{timer.area}</p>}
              </div>
              <div className="max-w-1/4 p-4">
                <Button onClick={stopTimer}>Stop Timer</Button>
              </div>
            </div>
          </div>
        }
        {!timerStart &&
          <div className="flex">
            <Input placeholder="Activity" value={newTimerActivity} onChange={(e) => setNewTimerActivity(e.target.value)} />
            <Input placeholder="Area" value={newTimerArea} onChange={(e) => setNewTimerArea(e.target.value)} />
            <Button onClick={startTimer}>Start Timer</Button>
          </div>
        }
        <div>
          <TimerTable timers={timersHistory} />
        </div>
      </div>
    </div>
  );
}

export default App;
