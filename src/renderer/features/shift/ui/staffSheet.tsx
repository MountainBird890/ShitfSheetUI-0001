import dayjs, { Dayjs } from "dayjs"
import { useState, useEffect } from "react";
import { OpenCard, HandleCard } from "../state/useShift";
import { Badge, Calendar, Drawer, Select, Button, type BadgeProps, type CalendarProps } from "antd";
import jaJP from 'antd/es/calendar/locale/ja_JP';
import DaysColumns from "./StaffShift";
import { DownloadButton } from "./download";
import { apiUrl } from "../../../../lib/api";

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
  schedule: { date: string; type: string }[];
  details: Record<string, DetailEntry>;
}

const StaffCalendar: React.FC<{
  staffId: string;
  staffData: StaffWork[];
  onMonthChange: (month: Dayjs) => void;
}> = ({ staffId, staffData, onMonthChange }) => {
  const { openCard } = OpenCard();
  const staff = staffData.find((s) => s.staffId === staffId); 



    const getListData = (value: Dayjs) => {
        const targetDate = value.format('YYYY-MM-DD');
        if (!staff) return [];

        const detail = staff.details[targetDate];
        if (!detail) return [];

        return [{
            staffName: staff.name,
            staffId: staff.staffId,
            dateKey: targetDate,
            detail,
            staffRecord: staff,
        }];
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map((item) => (
                    <li
                        key={`${item.staffId}-${item.dateKey}`}
                        onClick={() => openCard(item.staffRecord, item.dateKey)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Badge
                            status="processing"
                            text={`${item.detail.user} / ${item.detail.type}`}
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

    return(
      <Calendar cellRender={cellRender} locale={jaJP} onPanelChange={(val) => onMonthChange(val)} />
    );
};

const ShiftCard: React.FC = () => {
    const { open, staff, dateKey, closeCard } = OpenCard();

    return (
        <Drawer
            title={staff ? `${staff.name} さんのシフト詳細` : ''}
            open={open}
            onClose={closeCard}
            size={800}
        >
            {staff && dateKey && (
                <DaysColumns
                    staff={staff as StaffWork}
                    value={dayjs(dateKey)}
                />
            )}
        </Drawer>
    );
};

const StaffSheetCalendar: React.FC = () => {
  const [useData, setUseData] = useState<StaffWork[]>([]);

  const fetchData = () => {
    fetch(apiUrl('/api/staff'))
      .then(res => res.json())
      .then(setUseData)
      .catch(err => console.error('fetch失敗:', err));
  };

  useEffect(() => { fetchData(); }, []);

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  // selectedStaffIdの初期値をデータ取得後に設定
  useEffect(() => {
    if (useData.length > 0 && !selectedStaffId) {
      setSelectedStaffId(useData[0].staffId);
    }
  }, [useData]);

  // 以下はuseDataをstateから参照するだけで変更なし
  const selectOptions = useData.map((s) => ({ value: s.staffId, label: s.name }));
  const selectedStaff = useData.find((s) => s.staffId === selectedStaffId);
  const monthPrefix = currentMonth.format("YYYY-MM");
  const visibleData = Object.entries(selectedStaff?.details ?? {})
    .filter(([date]) => date.startsWith(monthPrefix))
    .map(([date, detail]) => ({
      staffId: selectedStaff?.staffId ?? "",
      name: selectedStaff?.name ?? "",
      user: detail.user,
      date,
      start: dayjs(detail.start).format("HH:mm"),
      end: dayjs(detail.end).format("HH:mm"),
      type: detail.type,
    }));

  return (
    <HandleCard>
      <Select
        options={selectOptions}
        value={selectedStaffId}
        onChange={(value) => setSelectedStaffId(value)}
        style={{ textAlign: "center", width: 200, marginBottom: 16 }}
        placeholder="職員を選択"
      />
      <DownloadButton data={visibleData} />
      <StaffCalendar
        staffId={selectedStaffId}
        staffData={useData}  // ← propsで渡す
        onMonthChange={(month) => setCurrentMonth(month)}
      />
      <ShiftCard />
    </HandleCard>
  );
};

export default StaffSheetCalendar;