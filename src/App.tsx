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
  const [timer, setTimer] = useState<any>(null)

  async function loadConfigurationCommand() {
    let config: string = await invoke("load_configuration_command");

    console.debug(JSON.parse(config))
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
    setTimerStart(new Date());
    console.debug(newTimerActivity);
    invoke("start_timer_command", { activity: newTimerActivity, area: newTimerArea }).then(() => {
      console.debug("Timer started!");
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

  return (
    <div className="max-h-screen flex">
      <div
        className="w-1/6 bg-gray-800 text-white p-4 min-h-screen max-h-screen"
      >
        Timers!
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
        <div className="flex-grow"></div>
        <div>
          <Button onClick={loadConfigurationCommand}>Load Configuration</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
