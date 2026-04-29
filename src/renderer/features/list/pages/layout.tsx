import { Button } from "antd";
import { setAdd } from "../ui/addRow";
import UserColumn from "../ui/setTable";
import dayjs from "dayjs";

export default function Shift(){

  return(
     <div className="layout">
    <div className="list">
        <Button onClick={setAdd}>行を追加</Button>
        <UserColumn value={dayjs()} />
    </div>
    </div>
  )
}