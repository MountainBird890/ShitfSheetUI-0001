import SideBar from "../pages/setSideBar";
import { Button } from "antd";
import { setAdd } from "../ui/addRow";

export default function Shift(){

  return(
     <div className="layout">
        <SideBar />
    <div className="list">
        <Button onClick={setAdd}>行を追加</Button>

    </div>
    </div>
  )
}