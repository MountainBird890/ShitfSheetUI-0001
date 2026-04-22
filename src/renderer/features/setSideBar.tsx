import { HomeOutlined, CheckOutlined, CheckSquareOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined   } from '@ant-design/icons';
import { Layout, Menu, type MenuProps} from 'antd';
import { Link, Outlet } from 'react-router-dom';


export default function SideBar(){
    
    const categories:MenuProps['items'] = [
    {
        key: 'main1',
        label: <Link to="/shift">リスト</Link>,
        icon: <HomeOutlined />
    },
    {
        key: 'main2',
        label:  <Link to="/schedule">スケジュール表</Link>,
        icon: <CheckOutlined />
    },
    {
        key: 'main3',
        label: <Link to="/calendar">カレンダー</Link>,
        icon: <CheckSquareOutlined />
    },
        {
        key: 'main4',
        label: <Link to="/kinmu">勤務形態</Link>,
        icon: <UserAddOutlined />
    },
    {
        key: 'main5',
        label: <Link to="/usershift">職員</Link>,
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
