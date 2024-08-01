import React, { useEffect, useState } from 'react';
import CountdownTimer from "./countdownTimer";
import { Button } from "./ui/button";

interface CountdownTimerProps {
    timer?: any;
    stopTimer: any;
}

const ActiveTimer: React.FC<CountdownTimerProps> = ({ timer, stopTimer }) => {

    return (
        <div>
            {timer &&
              <div className="flex flex-col">
                <div className="flex m-auto">
                  <div className="p-4">
                    <CountdownTimer startDate={new Date(timer.start_time)} />
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
        </div>
    )
}

export default ActiveTimer;