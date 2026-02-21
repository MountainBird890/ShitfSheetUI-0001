import { Table } from 'antd';
import type { TableColumnsType } from 'antd';

interface DataType {
  key: string;
  name: string;
  office: string;
  holiday: string;
  pto: string;
  yamada: string;
  suzuki: string;
};

export default function SetTable(){

    const columns: TableColumnsType<DataType> = [
  { title: '氏名', dataIndex: 'name' },
  { title: '内勤', dataIndex: 'office' },
  { title: '公休', dataIndex: 'holiday' },
  { title: '有給', dataIndex: 'pto' },
  { title: '山田', dataIndex: 'yamada' },
  { title: '鈴木', dataIndex: 'suzuki' },
    ];

    const data = [
  {
    key: '1',
    name: '兵庫太郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '2',
    name: '兵庫次郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '3',
    name: '兵庫三郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '4',
    name: '兵庫四郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '5',
    name: '兵庫五郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '6',
    name: '兵庫権六',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '7',
    name: '兵庫七郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '8',
    name: '兵庫権八',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '9',
    name: '兵庫九郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '10',
    name: '兵庫十兵衛',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '11',
    name: '摂津一朗太',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '12',
    name: '摂津次郎右衛門',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '13',
    name: '摂津三太夫',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },
  {
    key: '14',
    name: '摂津幸四郎',
    office: '○',
    holiday: '',
    pto: '○',
    yamada: '○',
    suzuki: '',
  },

    ];

    return <Table columns={columns} dataSource={data}/>
};