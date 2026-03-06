import SideBar from "../pages/setSideBar";
import { Button } from "antd";
import { setAdd } from "../ui/addRow";
import SetTable from "./setTable";

export default function Shift(){

  return(
     <div className="layout">
        <SideBar />
    <div className="list">
        <Button onClick={setAdd}>行を追加</Button>
        <SetTable />
    </div>
    </div>
  )
}