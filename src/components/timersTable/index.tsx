import React from "react"
import { Timer, columns } from "./columns"
import { DataTable } from "./data-table"

interface TimerTableProps {
    timers: Timer[]
}
const TimerTable: React.FC<TimerTableProps> = ({ timers }) => {

    console.debug(timers);

    return (
        <div className="container mx-auto py-10 max-h-full overflow-y-scroll" >
            <DataTable columns={columns} data={timers} />
        </div >
    )
}

export default TimerTable;