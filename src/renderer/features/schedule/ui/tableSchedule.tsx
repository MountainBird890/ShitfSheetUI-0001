import { Table } from "antd";
import type { TableColumnType } from "antd";
import type { ItemType } from "../type";

export default function ScheduleTable(){
    const userColumn:TableColumnType<ItemType>[] = [
        { title: '利用者', dataIndex:'name'},
        { title: '介助者', dataIndex:'supporter'},
        { title: '開始', dataIndex:'start'},
        { title: '終了', dataIndex:'end'},
        { title: '種別', dataIndex:'kind'},
]

return <Table columns = {userColumn}/>
};