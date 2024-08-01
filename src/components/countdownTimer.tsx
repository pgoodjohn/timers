import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
    startDate?: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ startDate }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = new Date().getTime();
            const difference = startDate ? currentTime - startDate.getTime() : 0;

            if (difference <= 0) {
                clearInterval(interval);
                setTimeRemaining(0);
            } else {
                setTimeRemaining(difference);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [startDate]);

    const formatTime = (time: number): string => {
        if (time <= 0) {
            return '00:00';
        }

        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <p className='text-xl font-mono'>
                {formatTime(timeRemaining)}
            </p>
        </div>
    );
};

export default CountdownTimer;