import { useState } from "react";
import sampleData from "../domain/sampleData";
import SideBar from "../pages/setSideBar";
import { Button } from "antd";
import SetTable from "../pages/setTable";


export default function Shift(){
  const [ data, setData ] = useState(sampleData);

  return(
     <div className="layout">
        <SideBar />
    <div className="list">
        <Button onClick={AddRow}>行を追加</Button>
        <SetTable data={data} />
    </div>
    </div>
  )
}