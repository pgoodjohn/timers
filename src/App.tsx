import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./globals.css";
import { Button } from "./components/ui/button";
import CountdownTimer from "./components/countdownTimer";
import { Input } from "./components/ui/input";
import TimerTable from "./components/timersTable";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import ActiveTimer from "./components/activeTimer";

const formSchema = z.object({
  activity: z.string().min(0).max(50),
  area: z.string().min(0).max(50),
})

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
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timersHistory, setTimersHistory] = useState<any[]>([]);
  const [timer, setTimer] = useState<any>(null);
  const [configuration, setConfiguration] = useState<any>(null);
  const [dailyStatistics, setDailyStatistics] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activity: "",
      area: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    invoke("start_timer_command", { activity: values.activity, area: values.area }).then((response) => {
      setTimer({
        start_time: new Date().toISOString(),
        activity: values.activity,
        area: values.area,
      })
      setTimerStart(new Date());
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
      setTimerStart(new Date(timer.start_time));
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
    setTimerStart(null);
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

  if (timerStart === null) {
    loadActiveTimer();
  }

  if (timersHistory.length === 0) {
    loadTimersHistory();
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
          <div className="m-auto"> {/* Timer start and current status*/}
            {timerStart &&
              <ActiveTimer timer={timer} stopTimer={stopTimer} />
            }
            {/* Form to start a new timer */}
            {!timerStart &&
              <div className="flex">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex">
                    <div className="flex flex-col">
                      <FormField
                        control={form.control}
                        name="activity"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Activity" {...field} className="" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Area" {...field} className="" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="m-auto">
                      <Button type="submit" className="mx-8">Start Timer</Button>
                    </div>
                  </form>
                </Form>
              </div>
            }
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
