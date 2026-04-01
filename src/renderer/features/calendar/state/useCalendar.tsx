import { useState, createContext, useContext, type ReactNode } from "react";
import type { calendarContext } from "../type";

const context = createContext<calendarContext | undefined>(undefined);

export const check=()=>{
    const handleContext = useContext(context);
if(handleContext === null){
    throw new Error("useDataContext は DataProvider 内で使用する必要があります");
}
return(handleCalendar);
}


function handleCalendar(children:any){
    const [ calendar , setCalendar ] = useState<string | undefined>();
    
    return(
        <context.Provider value = {{calendar, setCalendar}} >
            {children}
        </context.Provider>
    )

}