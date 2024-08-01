import React from 'react';
import CountdownTimer from "./countdownTimer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CountdownTimerProps {
    timer?: any;
    stopTimer: any;
}

const ActiveTimer: React.FC<CountdownTimerProps> = ({ timer, stopTimer }) => {

    return (
        <>
            {timer &&
                <div className="flex p-6 w-full">
                    <div className='px-2'>
                        <Input placeholder="Activity" />
                    </div>
                    <div className='px-2'>
                        <Input placeholder="Area" />
                    </div>
                    <div className="px-4 py-1 text-center align-middle">
                        <CountdownTimer startDate={new Date(timer.start_time)} />
                    </div>
                    <div className="flex-grow">
                        <Button className="w-full" onClick={stopTimer}>Stop Timer</Button>
                    </div>
                </div>
            }
        </>
    )
}

export default ActiveTimer;