import { Tabs } from 'antd';
import StaffSheetCalendar from "../ui/staffSheet";
import UserSheetCalendar from "../ui/userSheet";

export function Sheet() {
    return (
        <Tabs items={[
            { key: 'staff', label: '職員', children: <StaffSheetCalendar /> },
            { key: 'user',  label: 'ご利用者', children: <UserSheetCalendar /> },
        ]} />
    );
}