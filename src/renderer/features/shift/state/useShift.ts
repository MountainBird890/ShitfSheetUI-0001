import { useState, createContext, useContext, type ReactNode } from "react";
import type { shiftType } from "./stateType";

const ShiftContext = createContext(undefined);

export const handleShift = () =>{
    const context = useContext(ShiftContext);
    if(context === undefined){
        throw new Error("ShiftContextはProviderの外で使用されています");
    };
    return(context);
};

const shiftState = ({children}) => {
    const [ shift, setShift ] = useState()
    return(
        <ShiftContext.Provider value = {{shift, setShift}}>
        {children}
        </ShiftContext.Provider>
    )
}
