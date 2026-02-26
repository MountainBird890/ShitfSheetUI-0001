import React, { useState } from 'react';
import { Table, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import useData from './sampleData';

interface DataType {
  key: React.Key;
  name: string;
  office: string;
  holiday: string;
  pto: string;
  yamada: string;
  suzuki: string;
};

type Prop = {
  data: DataType;
}

export default function SetTable(){

  const [data, setData] = useState(useData());

  const deleteRow = (key: React.Key) =>{
      setData(data.filter(item => item.key !== key));
    }
  

    const columns: TableColumnsType<DataType> = [
    {
      title: '操作',
      dataIndex: 'control',
      render: (_, record) =>(
        <Button danger onClick={()=>deleteRow(record.key)}>削除</Button>
      )
    },
    { title: '氏名', dataIndex: 'name' },
    { title: '内勤', dataIndex: 'office' },
    { title: '公休', dataIndex: 'holiday' },
    { title: '有給', dataIndex: 'pto' },
    { title: '山田', dataIndex: 'yamada' },
    { title: '鈴木', dataIndex: 'suzuki' },
  ];

    return (
    <Table columns={columns} dataSource={data}/>
  );
};