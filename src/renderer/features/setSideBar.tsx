import { HomeOutlined, CheckOutlined, CheckSquareOutlined, UserAddOutlined, UserDeleteOutlined, CarryOutOutlined, CalendarOutlined, DatabaseOutlined , InfoCircleOutlined } from '@ant-design/icons';
import { Layout, Menu, type MenuProps} from 'antd';
import { Link, Outlet } from 'react-router-dom';


export default function SideBar(){
    
    const categories:MenuProps['items'] = [
    {
        key: 'main1',
        label: <Link to="/shift">基本情報</Link>,
        icon: <InfoCircleOutlined />
    },
        {
        key: 'main3',
        label: <Link to="/calendar">予約スケジュール</Link>,
        icon: <CarryOutOutlined />
    },
        {
        key: 'main5',
        label: <Link to="/sheet">個別スケジュール</Link>,
        icon: <CalendarOutlined />
    },
    {
        key: 'main2',
        label:  <Link to="/schedule">スケジュール一覧</Link>,
        icon: <DatabaseOutlined />
    },

        {
        key: 'main4',
        label: <Link to="/kinmu">勤務形態</Link>,
        icon: <UserAddOutlined />
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
