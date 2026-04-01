import type React from "react"

type calendarContext = {
    calendar: string | undefined,
    setCalendar: React.Dispatch<React.SetStateAction<string | undefined>>
};

export type {calendarContext}