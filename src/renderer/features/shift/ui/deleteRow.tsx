import { Button } from "antd";
import type { TableColumnsType } from 'antd';
import SetTable from "../pages/setTable";


function ExeDelete(key: string|number){
        const deleteButton: TableColumnsType = [
            {
              title: '操作',
              dataIndex: 'control',
              render: (_, record) =>(
                <Button danger onClick={()=>setData(record.key)}>削除</Button>
              )
            },
    ];

};



export { ExeDelete }
