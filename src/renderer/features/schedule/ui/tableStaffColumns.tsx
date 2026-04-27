import { Table } from "antd";
import data from "../../../../backend/data/users/shift.json"
import type { ColumnsType } from "antd/es/table";
import type { StaffDataType } from "../type";

export default function StaffColumn(){
    const staffColumn:ColumnsType<StaffDataType>= [
        { title: '職員', dataIndex:'supporter'},
        { title: '利用者', dataIndex:'user'},
        { title: '開始', dataIndex:'start'},
        { title: '終了', dataIndex:'end'},
        { title: '種別', dataIndex:'kind'},
]

return <Table<StaffDataType>
 columns = {staffColumn}
 dataSource={data.shiftdata as any}/>
};