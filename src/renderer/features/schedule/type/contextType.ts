import { Dayjs } from "dayjs";

export type ScheduleContextType = {
  currentMonth: Dayjs;
  setCurrentMonth: (month: Dayjs) => void;
}