// staffSheet.tsxで使用

import React, { createContext, useContext, useState } from "react";
import type { CardContextValue, StaffRecord, ScheduleEntry } from "../type/openCardType";

const CardContext = createContext<CardContextValue | null>(null);

export function OpenCard(){
    const ctx = useContext(CardContext);
    if(!ctx) throw new Error('OpenCardはchildrenの中で使用してください');
    return ctx;
}

export function HandleCard({ children } : { children : React.ReactNode }){
    const [open, setOpen] = useState(false);
    const [staff, setStaff] = useState<StaffRecord | null>(null);
    const [dateKey, setDateKey] = useState<string | null>(null);

      const openCard = (staff: StaffRecord, dateKey: string) => {
        setStaff(staff);
        setDateKey(dateKey);
        setOpen(true);
      };
    
      const closeCard = () => setOpen(false);
    
      const handleSave = async(
        staffId: string,
        dateKey: string,
        updated: ScheduleEntry,
        updatedName: string
      ) => { 
        const res = await fetch(`/api/staff/${staffId}/schedule/${dateKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: updatedName, entry: updated }),
    });
        if(!res.ok){
            throw new Error('保存に失敗しました');
        };
        console.log('保存完了');
        closeCard();
      };
    
      return (
        <CardContext.Provider value={{ open, staff, dateKey, openCard, closeCard, handleSave }}>
          {children}
        </CardContext.Provider>
      );
}