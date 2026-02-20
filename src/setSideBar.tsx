import { HomeOutlined, CheckOutlined, CheckSquareOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined   } from '@ant-design/icons';
import {Menu} from 'antd';

export default function sideBar(){

const categories = [
    {
        key: 'main1',
        label: 'ホーム',
        icon: <HomeOutlined />
    },
    {
        key: 'main2',
        label: '勤怠',
        icon: <CheckOutlined />
    },
    {
        key: 'main3',
        label: '手当',
        icon: <CheckSquareOutlined />
    },
        {
        key: 'main4',
        label: '常勤',
        icon: <UserAddOutlined />
    },
    {
        key: 'main5',
        label: '非常勤',
        icon: <UserDeleteOutlined />
    },
    {
        key: 'main6',
        label: 'ご利用者様',
        icon: <UserOutlined />
    },
];

return<Menu items={categories}/>
};
