import { Button } from "antd";
import UserColumn from "./tableUserColumns";
import StaffColumn from "./tableStaffColumns";
import { useState } from "react";

// jsonデータを切り替えるロジックを自前で実装する
export default function ToggleSchedule(){
    const [ shift ,setShift ] = useState();

    const toggle = () =>{
        setShift((prev)=>{
            prev === UserColumn? UserColumn : StaffColumn;
        }
        )
    };

    return(
        <Button onClick={toggle}>
            {shift ? "利用者" : "職員"}
        </Button>
    )
};