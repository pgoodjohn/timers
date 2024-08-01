import React from 'react';
import CountdownTimer from "./countdownTimer";
import { Button } from "./ui/button";

interface CountdownTimerProps {
    timer?: any;
    stopTimer: any;
}

const ActiveTimer: React.FC<CountdownTimerProps> = ({ timer, stopTimer }) => {

    return (
        <>
            {timer &&
                <div className="flex justify-between align-middle p-6">
                    <div>
                        <CountdownTimer startDate={new Date(timer.start_time)} />
                    </div>
                    <div className="flex flex-col text-center">
                        {timer.activity ? <div className="text-lg">{timer.activity}</div> : <></>}
                        {timer.area ? <div className="text-xs">{timer.area}</div> : <></>}
                    </div>
                    <div className="max-w-1/4">
                        <Button onClick={stopTimer}>Stop Timer</Button>
                    </div>
                </div>
            }
        </>
    )
}

export default ActiveTimer;