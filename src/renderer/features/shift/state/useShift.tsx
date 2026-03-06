import { useState, createContext, useContext, type ReactNode } from "react";
import { initialData } from "../domain/sampleData";

type FormalDataType={
  key: string | number;
  name: string;
  office: string;
  holiday: string;
  pto: string;
  yamada: string;
  suzuki: string;
};

interface ContextDataType{
data: FormalDataType[];
setData: React.Dispatch<React.SetStateAction<FormalDataType[]>>;

};


const DataContext = createContext<ContextDataType | undefined>(undefined);

export const handleContext = () =>{
    const context = useContext(DataContext);
    if(context === undefined){
        throw new Error("useDataContext は DataProvider 内で使用する必要があります");
    };
    return(context)
};

export const DATACONTEXT:React.FC<{children: ReactNode}> = ({children}) =>{
    const [data, setData] = useState<FormalDataType[]>(initialData);
    
    return(
        <DataContext.Provider value = {{data, setData}}>
            {children}
        </DataContext.Provider>
    )
};