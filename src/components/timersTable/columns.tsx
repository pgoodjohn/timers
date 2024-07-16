import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Timer = {
    id: number
    activity: string
    area?: string
    start_time: string
    end_time?: string
    duration: number
}

export const columns: ColumnDef<Timer>[] = [
    {
        accessorKey: "activity",
        header: "Activity",
    },
    {
        accessorKey: "area",
        header: "Area",
    },
    {
        accessorKey: "start_time",
        header: () => <div className="text-right">Start Time</div>,
        cell: ({ row }) => <div className="text-right">{(new Date(row.getValue("start_time"))).toLocaleTimeString()}</div>,
    },
    {
        accessorKey: "end_time",
        header: () => <div className="text-right">End Time</div>,
        cell: ({ row }) => <div className="text-right">{(new Date(row.getValue("end_time"))).toLocaleTimeString()}</div>,
    },
    {
        accessorKey: "duration",
        header: () => <div className="text-right">Duration</div>,
        cell: ({ row }) => <div className="text-right">{formatTime(row.getValue("duration"))}</div>
    }
]

function formatTime(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    const formattedHours = hours > 0 ? `${hours}:` : '';
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}