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

const formSchema = z.object({
  activity: z.string().min(0).max(50),
  area: z.string().min(0).max(50),
})

function App() {
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timersHistory, setTimersHistory] = useState<any[]>([]);
  const [timer, setTimer] = useState<any>(null);
  const [configuration, setConfiguration] = useState<any>(null);

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
            <div className="flex m-auto">
              <div className="p-4">
                <CountdownTimer startDate={timerStart} />
              </div>
              <div className="flex flex-col p-2 text-center">
                {timer.activity ? <div className="text-lg">{timer.activity}</div> : <></>}
                {timer.area ? <div className="text-xs">{timer.area}</div> : <></>}
              </div>
              <div className="max-w-1/4 p-4">
                <Button onClick={stopTimer}>Stop Timer</Button>
              </div>
            </div>
          </div>
        }
        {!timerStart &&
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex px-8">
              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Activity" {...field} className="mr-4" />
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
                      <Input placeholder="Area" {...field} className="mx-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="mx-8">Start Timer</Button>
            </form>
          </Form>
        }
        <div>
          <TimerTable timers={timersHistory} />
        </div>
      </div>
    </div>
  );
}

export default App;
