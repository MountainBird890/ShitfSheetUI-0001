import dayjs, { Dayjs } from "dayjs";
import data from '../../../../backend/data/users/base.json';
import { useState } from "react";
import { Badge, Calendar, Select, Drawer, type CalendarProps } from "antd";
import jaJP from 'antd/es/calendar/locale/ja_JP';
import { DownloadButton } from "./download";
import { OpenCard, HandleCard } from "../state/useShift"; // ← 追加
import UserDaysColumns from "./UserShift";

dayjs.locale('ja');

type DetailEntry = {
  user: string;
  start: string;
  end: string;
  type: string;
}

type StaffWork = {
  staffId: string;
  name: string;
  details: Record<string, DetailEntry>;
}

// ---- ShiftCard ----
const ShiftCard: React.FC<{
  open: boolean;
  selectedUser: string;
  currentMonth: Dayjs;
  onClose: () => void;
}> = ({ open, selectedUser, currentMonth, onClose }) => {
  const useData = data.basedata as unknown as StaffWork[];

  return (
    <Drawer
      title={`${selectedUser} 様のサービス提供予定詳細`}
      open={open}
      onClose={onClose}
      size={800}
    >
      <UserDaysColumns
        allStaff={useData}
        selectedUser={selectedUser}
        value={currentMonth}
      />
    </Drawer>
  );
};

// ---- メイン ----
const UserSheetCalendarInner: React.FC = () => {
  const useData = data.basedata as unknown as StaffWork[];
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const { openCard } = OpenCard();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userOptions = Array.from(
    new Set(
      useData.flatMap((staff) =>
        Object.values(staff.details).map((d) => d.user)
      )
    )
  ).map((user) => ({ value: user, label: user }));

  const [selectedUser, setSelectedUser] = useState<string>(userOptions[0]?.value ?? '');

  const monthPrefix = currentMonth.format("YYYY-MM");
  const visibleData = useData.flatMap((staff) =>
    Object.entries(staff.details)
      .filter(([date, detail]) =>
        date.startsWith(monthPrefix) && detail.user === selectedUser
      )
      .map(([date, detail]) => ({
        staffId: staff.staffId,
        name: staff.name,
        date,
        type: detail.type,
      }))
  );

  const getListData = (value: Dayjs) => {
    const targetDate = value.format('YYYY-MM-DD');
    return useData.flatMap((staff) => {
      const detail = staff.details[targetDate];
      if (!detail || detail.user !== selectedUser) return [];
      return [{
        staffName: staff.name,
        staffId: staff.staffId,
        dateKey: targetDate,
        detail,
        staffRecord: staff,
      }];
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={`${item.staffId}-${item.dateKey}`}
            onClick={() => setDrawerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <Badge
              status="processing"
              text={`${item.staffName} / ${dayjs(item.detail.start).format('HH:mm')}〜${dayjs(item.detail.end).format('HH:mm')} / ${item.detail.type}`}
            />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  return (
    <>
      <Select
        options={userOptions}
        value={selectedUser}
        onChange={(value) => setSelectedUser(value)}
        style={{ textAlign: "center", width: 200, marginBottom: 16 }}
        placeholder="利用者を選択"
      />
      <DownloadButton data={visibleData} />
      <Calendar
        cellRender={cellRender}
        locale={jaJP}
        onPanelChange={(val) => setCurrentMonth(val)}
      />
      <ShiftCard
  open={drawerOpen}
  selectedUser={selectedUser}
  currentMonth={currentMonth}
  onClose={() => setDrawerOpen(false)}
/>
    </>
  );
};

// HandleCardで囲んでContextを提供
const UserSheetCalendar: React.FC = () => (
  <HandleCard>
    <UserSheetCalendarInner />
  </HandleCard>
);

export default UserSheetCalendar;