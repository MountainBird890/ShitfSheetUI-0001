import { useState, createContext, useContext, type ReactNode } from "react";
import type { calendarContext, inputContextType, loadingContextType, searchContextType } from "../type/type";
import type{ StaffRecord, ScheduleEntry } from "../ui/editer";
import type { downloadCSVContextType } from "../type/type";

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


// <Input.Search placeholder='ここで検索' variant='filled' onSearch={(q)=> fetchUserName(q, (data) => setOpen(data))}/>で使用

const contextSearch = createContext<searchContextType | undefined>(undefined);

export const handleSearch = () => {
    const searchContext = useContext(contextSearch);

    if(searchContext === undefined){
        throw new Error("childをcontextSearch.Providorで囲んでください");
    }
    return(searchContext)
};

export function SearchState({children} : {children: ReactNode}){
    const [ search, setSearch ] = useState<string | undefined>(undefined);

    return(
        <contextSearch.Provider value={{search, setSearch}}>
            {children}
        </contextSearch.Provider>
    )
}


// editer.tsxで使用。


// Contextの型定義
interface EditorContextValue {
  open: boolean;
  staff: StaffRecord | null;
  dateKey: string | null;
  openEditor: (staff: StaffRecord, dateKey: string) => void;
  closeEditor: () => void;
  handleSave: (staffId: string, dateKey: string, updated: ScheduleEntry, updatedName: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// カスタムフック
export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within HandleScheduleEditor");
  return ctx;
}

// HandleEditor を Context Provider に変更
export function HandleScheduleEditor({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);

  const openEditor = (staff: StaffRecord, dateKey: string) => {
    setStaff(staff);
    setDateKey(dateKey);
    setOpen(true);
  };

  const closeEditor = () => setOpen(false);

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
    closeEditor();
  };

  return (
    <EditorContext.Provider value={{ open, staff, dateKey, openEditor, closeEditor, handleSave }}>
      {children}
    </EditorContext.Provider>
  );
}


// downloadCSV.tsxで使用
const contextDl = createContext<downloadCSVContextType | false>(false);

// 続きにexport const handleSearch = () => {...の処理を書く（他のContextを参考にする）
export const handleDownloadCSV = () => {
    const dlContext = useContext(contextDl);

        if(dlContext === false){
        throw new Error("childをcontextSearch.Providorで囲んでください");
    }
    return(dlContext)
};

export function DlState({children} : {children: ReactNode}){
    const [ dl, setDl ] = useState<boolean>(false);

    return(
        <contextDl.Provider value={{dl, setDl}}>
            {children}
        </contextDl.Provider>
    )

}





// addNewPlan.tsxで使用。
interface AddContextValue {
  open: boolean;
  staff: StaffRecord | null;
  dateKey: string | null;
  openEditor: (staff: StaffRecord, dateKey: string) => void;
  closeEditor: () => void;
  handleSave: (staffId: string, dateKey: string, updated: ScheduleEntry, updatedName: string) => void;
}

const AddPlanContext = createContext<AddContextValue | null>(null);

// カスタムフック
export function useAdd() {
  const ctx = useContext(AddPlanContext);
  if (!ctx) throw new Error("useAdd must be used within HandleAddNewPlan");
  return ctx;
}

// HandleEditor を Context Provider に変更
export function HandleAddNewPlan({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);

  const openEditor = (staff: StaffRecord, dateKey: string) => {
    setStaff(staff);
    setDateKey(dateKey);
    setOpen(true);
  };

  const closeEditor = () => setOpen(false);

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
    closeEditor();
  };

  return (
    <AddPlanContext.Provider value={{ open, staff, dateKey, openEditor, closeEditor, handleSave }}>
      {children}
    </AddPlanContext.Provider>
  );
}