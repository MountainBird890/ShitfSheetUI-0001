// userSheet.tsx
import dayjs from "dayjs";
import data from '../../../../backend/data/users/base.json';
import { useState } from "react";
import { Dayjs } from "dayjs";
import { Badge, Calendar, Select, Button, type BadgeProps, type CalendarProps } from "antd";
import jaJP from 'antd/es/calendar/locale/ja_JP';
import { downloadCsv } from "../utils/downloadCsv";

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

const UserSheetCalendar: React.FC = () => {
    const useData = data.basedata as unknown as StaffWork[];

    // 全スタッフのdetailsからuserを重複なく収集
    const userOptions = Array.from(
        new Set(
            useData.flatMap((staff) =>
                Object.values(staff.details).map((d) => d.user)
            )
        )
    ).map((user) => ({ value: user, label: user }));

    const [selectedUser, setSelectedUser] = useState<string>(userOptions[0]?.value ?? '');

    const getListData = (value: Dayjs) => {
        const targetDate = value.format('YYYY-MM-DD');

        // 選択した利用者が含まれる日付のdetailsを全スタッフから収集
        return useData.flatMap((staff) => {
            const detail = staff.details[targetDate];
            if (!detail || detail.user !== selectedUser) return [];
            return [{
                staffName: staff.name,
                staffId: staff.staffId,
                dateKey: targetDate,
                detail,
            }];
        });
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map((item) => (
                    <li key={`${item.staffId}-${item.dateKey}`}>
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

        const handleDownload = () => {
        const rows = [
            ['日付', '職員名', '開始', '終了', '種別'],
            ...useData.flatMap((staff) =>
                Object.entries(staff.details)
                    .filter(([_, d]) => d.user === selectedUser)
                    .map(([date, d]) => [
                        date,
                        staff.name,
                        dayjs(d.start).format('HH:mm'),
                        dayjs(d.end).format('HH:mm'),
                        d.type,
                    ])
            ).sort((a, b) => a[0].localeCompare(b[0]))
        ];
        downloadCsv(`${selectedUser}_利用履歴.csv`, rows);
    };

    return (
        <>
            <Select
                options={userOptions}
                value={selectedUser}
                onChange={(value) => setSelectedUser(value)}
                style={{ textAlign:"center", width: 200, marginBottom: 16 }}
                placeholder="利用者を選択"
            />
            <Button onClick={handleDownload}>CSVダウンロード</Button>
            <Calendar cellRender={cellRender} locale={jaJP} />
        </>
    );
};

export default UserSheetCalendar;