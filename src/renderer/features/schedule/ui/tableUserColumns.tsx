import { Table } from "antd";
import data from "../../../../backend/data/users/shift.json"
import type { ColumnsType } from "antd/es/table";
import type { DataType } from "../type";

export default function UserColumn(){
    const userColumn:ColumnsType<DataType>= [
        { title: '利用者', dataIndex:'user'},
        { title: '介助者', dataIndex:'supporter'},
        { title: '開始', dataIndex:'start'},
        { title: '終了', dataIndex:'end'},
        { title: '種別', dataIndex:'kind'},
]

return <Table<DataType>
 columns = {userColumn}
 dataSource={data.shiftdata}/>
    };


    

