import { useState, createContext, useContext, type ReactNode } from "react";
import type { calendarContext, inputContextType, loadingContextType } from "../type";

const context = createContext<calendarContext | undefined>(undefined);

export const check=()=>{
    const handleContext = useContext(context);
if(handleContext === undefined){
    throw new Error("useDataContext は DataProvider 内で使用する必要があります");
}
return(handleContext);
}


export function handleCalendar({children}:{children:ReactNode}){
    const [ calendar , setCalendar ] = useState<string | undefined>();
    
    return(
        <context.Provider value = {{calendar, setCalendar}} >
            {children}
        </context.Provider>
    )

}


// input.tsxで使用

const contextOpen = createContext<inputContextType | undefined>(undefined);

export const handleInput = () =>{
    console.log("handleInput(useCalendar.tsx) is correct")
    const openContext = useContext(contextOpen)

    if(openContext === undefined){
        throw new Error("childをcontextOpen.Providorで囲んでください");
    }

    return(openContext)
}

export function HandleEditor({children}:{children:ReactNode}){
    const [ open , setOpen ] = useState<boolean>(false);

    return(
        <contextOpen.Provider value={{open, setOpen}}>
            {children}
        </contextOpen.Provider>
    )
}


// input.tsxで使用

const contextLoading = createContext<loadingContextType | undefined>(undefined);

export const handleLoading = () => {
    const loadingContext = useContext(contextLoading);

    if(loadingContext === undefined){
        throw new Error("childをcontextLoading.Providorで囲んでください");
    }

    return(loadingContext)
}

 export function LoadingState({children}:{children:ReactNode}){
    const [ loading , setLoading ] = useState<boolean>(false);

    return(
    <contextLoading.Provider value={{loading, setLoading}}>
        {children}
    </contextLoading.Provider>
    )
}

