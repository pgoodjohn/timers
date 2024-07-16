import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Timer = {
    id: number
    activity: string
    area?: string
    start_time: string
    end_time?: string
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
        header: "Start Time",
    },
]
