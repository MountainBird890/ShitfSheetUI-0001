import { Table } from "antd";
import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useSchedule } from "../state/useSchedule";
import { apiUrl } from "../../../../lib/api";

type DetailEntry = { user: string; start: string; end: string; type: string; }
type StaffWork = { staffId: string; name: string; details: Record<string, DetailEntry>; }

export default function UserColumn() {
  const { currentMonth } = useSchedule();
  const [allStaff, setAllStaff] = useState<StaffWork[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/staff'))
      .then(res => res.json())
      .then(setAllStaff)
      .catch(err => console.error('fetch失敗:', err));
  }, []);

  const startDate = currentMonth.startOf('month');
  const daysInMonth = currentMonth.daysInMonth();

  const weekColumns: ColumnsType<any> = [
    { title: '職員', dataIndex: 'name', key: 'name', width: 100, fixed: 'left' },
    ...[...Array(daysInMonth)].map((_, index) => {
      const day = startDate.add(index, 'day');
      const dateStr = day.format('YYYY-MM-DD');
      return {
        title: day.format('M/D(ddd)'),
        key: dateStr,
        children: [
          { title: '利用者', dataIndex: ['details', dateStr, 'user'], key: `${dateStr}_user`, width: 100, render: (text: string) => text || '-' },
          { title: '開始', dataIndex: ['details', dateStr, 'start'], key: `${dateStr}_start`, width: 80, render: (text: string) => text ? dayjs(text).format('HH:mm') : '-' },
          { title: '終了', dataIndex: ['details', dateStr, 'end'], key: `${dateStr}_end`, width: 80, render: (text: string) => text ? dayjs(text).format('HH:mm') : '-' },
          { title: '種別', dataIndex: ['details', dateStr, 'type'], key: `${dateStr}_type`, width: 100, render: (text: string) => text || '-' },
        ],
      };
    }),
  ];

  return (
    <Table<any>
      columns={weekColumns}
      dataSource={allStaff}
      rowKey="staffId"
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content' }}
    />
  );
}