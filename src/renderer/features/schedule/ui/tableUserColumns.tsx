import { Table } from "antd";
import data from "../../../../backend/data/users/shift.json"
import type { ColumnsType } from "antd/es/table";
import type { DataType } from "../type";

export default function UserColumn(year:number, month:number){
    
        const baseDate = new Date(year, month, 0)

        const dateLength = baseDate.getDate();

        const userColumn:ColumnsType<DataType>=  Array.from({ length: dateLength }, (_, i) => {
            const createDate = new Date(year, month - 1, i + 1)
            const week = ['日', '月', '火', '水', '木', '金', '土'];
            
        return{
        title: `${createDate.getDay()}(${week[createDate.getDay()]})`,
        children:[
        { title: '利用者', dataIndex:'user'},
        { title: '介助者', dataIndex:'supporter'},
        { title: '開始', dataIndex:'start'},
        { title: '終了', dataIndex:'end'},
        { title: '種別', dataIndex:'kind'},
    ]}

    const dataColumns = data.shiftdata.map(item =>{
        Array.from({ length: dateLength },() => item.key)
    })
})
return <Table<DataType>
        columns = {userColumn}
        dataSource={data.shiftdata}/>
    };

    

