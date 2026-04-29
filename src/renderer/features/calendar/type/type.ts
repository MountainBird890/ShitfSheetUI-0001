import type React from "react"
import { Dayjs } from "dayjs";

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


type searchContextType = {
    search: string | undefined,
    setSearch: React.Dispatch<React.SetStateAction<string | undefined>>
}

export type {searchContextType}

type downloadCSVContextType =  {
    dl: boolean,
    setDl: React.Dispatch<React.SetStateAction<boolean>>
}

export type {downloadCSVContextType}


// ---- addNewPlanで使う -------------------------------------------------------

export interface ScheduleEntry {
  user: string;
  start: string; // ISO datetime string e.g. "2026-04-25T10:00"
  end: string;
  type: string;
}

export interface StaffRecord {
  staffId: string;
  name: string;
  position?: string;
  details?: Record<string, ScheduleEntry>;  // ← detailsにまとめる
}

export interface EditFormValues {
  name: string;
  user: string;
  dateRange: [Dayjs, Dayjs];
  type: string;
}