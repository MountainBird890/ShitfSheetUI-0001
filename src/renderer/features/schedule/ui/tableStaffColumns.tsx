import { Table } from "antd";
import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useSchedule } from "../state/useSchedule";
import { apiUrl } from "../../../../lib/api";

type DetailEntry = { user: string; start: string; end: string; type: string; }
type StaffWork = { staffId: string; name: string; details: Record<string, DetailEntry>; }

export default function StaffColumn() {
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
  const monthPrefix = currentMonth.format('YYYY-MM');

  const userSet = new Set<string>();
  allStaff.forEach((staff) => {
    Object.entries(staff.details ?? {}).forEach(([date, detail]) => {
      if (date.startsWith(monthPrefix)) userSet.add(detail.user);
    });
  });

  const tableData = Array.from(userSet).map((user) => {
    const row: Record<string, unknown> = { user };
    [...Array(daysInMonth)].forEach((_, index) => {
      const dateStr = startDate.add(index, 'day').format('YYYY-MM-DD');
      const matched = allStaff.find((staff) => staff.details?.[dateStr]?.user === user);
      if (matched) {
        const detail = matched.details[dateStr];
        row[`${dateStr}_name`]  = matched.name;
        row[`${dateStr}_start`] = detail.start;
        row[`${dateStr}_end`]   = detail.end;
        row[`${dateStr}_type`]  = detail.type;
      }
    });
    return row;
  });

  const columns: ColumnsType<any> = [
    { title: 'ご利用者', dataIndex: 'user', key: 'user', width: 100, fixed: 'left' },
    ...[...Array(daysInMonth)].map((_, index) => {
      const day = startDate.add(index, 'day');
      const dateStr = day.format('YYYY-MM-DD');
      return {
        title: day.format('M/D(ddd)'),
        key: dateStr,
        children: [
          { title: '職員', dataIndex: `${dateStr}_name`, key: `${dateStr}_name`, width: 100, render: (text: string) => text || '-' },
          { title: '開始', dataIndex: `${dateStr}_start`, key: `${dateStr}_start`, width: 80, render: (text: string) => text ? dayjs(text).format('HH:mm') : '-' },
          { title: '終了', dataIndex: `${dateStr}_end`, key: `${dateStr}_end`, width: 80, render: (text: string) => text ? dayjs(text).format('HH:mm') : '-' },
          { title: '種別', dataIndex: `${dateStr}_type`, key: `${dateStr}_type`, width: 100, render: (text: string) => text || '-' },
        ],
      };
    }),
  ];

  return (
    <Table<any>
      columns={columns}
      dataSource={tableData}
      rowKey="user"
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content' }}
    />
  );
}