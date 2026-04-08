import type React from "react"

type calendarContext = {
    calendar: string | undefined,
    setCalendar: React.Dispatch<React.SetStateAction<string | undefined>>
};

export type {calendarContext}


type inputContextType ={
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type {inputContextType}


type loadingContextType ={
    loading: boolean,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export type {loadingContextType}