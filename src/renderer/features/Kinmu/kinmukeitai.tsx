import { Table } from "antd";
import kinmukeitai from "../../../backend/data/users/kinmukeitai.json"
import type { ColumnsType } from "antd/es/table";


export default function KinmuColumn(){
            
        const keitaiColumn:ColumnsType<any>  =[
        { title: '職種', dataIndex: 'kind' },
        { title: '勤務形態', dataIndex: 'worktype' },
        { title: '氏名', dataIndex: 'name' },
        { title: '1日', dataIndex: '1' },
        { title: '2日', dataIndex: '2' },
        { title: '3日', dataIndex: '3' },
        { title: '4日', dataIndex: '4' },
        { title: '5日', dataIndex: '5' },
        { title: '6日', dataIndex: '6' },
        { title: '7日', dataIndex: '7' },
        { title: '8日', dataIndex: '8' },
        { title: '9日', dataIndex: '9' },
        { title: '10日', dataIndex: '10' },
        { title: '11日', dataIndex: '11' },
        { title: '12日', dataIndex: '12' },
        { title: '13日', dataIndex: '13' },
        { title: '14日', dataIndex: '14' },
        { title: '15日', dataIndex: '15' },
        { title: '16日', dataIndex: '16' },
        { title: '17日', dataIndex: '17' },
        { title: '18日', dataIndex: '18' },
        { title: '19日', dataIndex: '19' },
        { title: '20日', dataIndex: '20' },
        { title: '21日', dataIndex: '21' },
        { title: '22日', dataIndex: '22' },
        { title: '23日', dataIndex: '23' },
        { title: '24日', dataIndex: '24' },
        { title: '25日', dataIndex: '25' },
        { title: '26日', dataIndex: '26' },
        { title: '27日', dataIndex: '27' },
        { title: '28日', dataIndex: '28' },
        { title: '29日', dataIndex: '29' },
        { title: '30日', dataIndex: '30' },
        { title: '31日', dataIndex: '31' },
    ]

    return <Table<any>
        columns = {keitaiColumn}
        dataSource={kinmukeitai.kinmukeitai}
        />

}

    

    

