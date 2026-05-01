import { createContext, useContext, useState, type ReactNode } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import type { ScheduleContextType } from '../type/contextType';

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const useSchedule = () => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('HandleScheduleで囲んでください');
  return ctx;
}

export function HandleSchedule({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  return (
    <ScheduleContext.Provider value={{ currentMonth, setCurrentMonth }}>
      {children}
    </ScheduleContext.Provider>
  );
}

