import dayjs from "dayjs"
import data from '../../../../backend/data/users/base.json'
import { useState } from "react";
import { OpenCard, HandleCard } from "../state/useShift";
import { Dayjs } from "dayjs";
import { Badge, Calendar, Drawer, Select, Button, type BadgeProps, type CalendarProps } from "antd";
import jaJP from 'antd/es/calendar/locale/ja_JP';
import DaysColumns from "./StaffShift";
import { downloadCsv } from "../utils/downloadCsv";
import { DownloadButton } from "./download";

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

const StaffCalendar: React.FC<{ staffId: string }> = ({ staffId }) => {
    const useData = data.basedata as unknown as StaffWork[];
    const { openCard } = OpenCard();
    const staff = useData.find((s) => s.staffId === staffId);

    const handleDownload = () => {
        if (!staff) return;
        const rows = [
            ['日付', '利用者', '開始', '終了', '種別'],
            ...Object.entries(staff.details).map(([date, d]) => [
                date,
                d.user,
                dayjs(d.start).format('HH:mm'),
                dayjs(d.end).format('HH:mm'),
                d.type,
            ])
        ];
        downloadCsv(`${staff.name}_シフト.csv`, rows);
    };

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
      <>
      <Button onClick={handleDownload}>CSVダウンロード</Button>
      <Calendar cellRender={cellRender} locale={jaJP} />
      </>
    );
};

// ↓ これを追加
const ShiftCard: React.FC = () => {
    const { open, staff, dateKey, closeCard } = OpenCard();

    return (
        <Drawer
            title={staff ? `${staff.name} のシフト詳細` : ''}
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
    const useData = data.basedata as unknown as StaffWork[];
    const [selectedStaffId, setSelectedStaffId] = useState<string>("1");

    const selectOptions = useData.map((s) => ({
        value: s.staffId,
        label: s.name,
    }));

      const visibleData = useData.flatMap((staff) =>
    Object.entries(staff.details ?? {}).map(([date, detail]) => ({
      staffId: staff.staffId,
      name: staff.name,
      date,
      type: detail.type,
    }))
  )

    return (
        <HandleCard>
            <Select
                options={selectOptions}
                value={selectedStaffId}
                onChange={(value) => setSelectedStaffId(value)}
                style={{textAlign:"center", width: 200, marginBottom: 16 }}
                placeholder="職員を選択"
            />
            <DownloadButton data={visibleData} /> 
            <StaffCalendar staffId={selectedStaffId} />
            <ShiftCard />
        </HandleCard>
    );
};

export default StaffSheetCalendar;