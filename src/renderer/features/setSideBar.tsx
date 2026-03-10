import { HomeOutlined, CheckOutlined, CheckSquareOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined   } from '@ant-design/icons';
import { Layout, Menu, type MenuProps} from 'antd';
import { Link, Outlet } from 'react-router-dom';


export default function SideBar(){
    
    const categories:MenuProps['items'] = [
    {
        key: 'main1',
        label: <Link to="/shift">シフト表</Link>,
        icon: <HomeOutlined />
    },
    {
        key: 'main2',
        label:  <Link to="/schedule">スケジュール表</Link>,
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

const { Sider, Content } = Layout;

return(
    <Layout>
        <Sider>
            <Menu items={categories}/>
        </Sider>
        <Content>
            <Outlet />
        </Content>
    </Layout>
)




};
