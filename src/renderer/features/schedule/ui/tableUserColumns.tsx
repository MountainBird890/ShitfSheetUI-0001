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
        title: `${i+1}日(${week[createDate.getDay()]})`,
        children:[
        { title: '利用者', dataIndex: `day${i+1}_user` },
        { title: '介助者', dataIndex: `day${i+1}_supporter` },
        { title: '開始', dataIndex: `day${i+1}_start` },
        { title: '終了', dataIndex: `day${i+1}_end` },
        { title: '種別', dataIndex: `day${i+1}_kind` },
    ]}

})
return <Table<DataType>
        columns = {userColumn}
        dataSource={data.shiftdata}
        />
    };

    

