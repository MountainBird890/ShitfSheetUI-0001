import React from 'react';
import { Table } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

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

type Props = {
  allStaff: StaffWork[];  // 全スタッフ
  selectedUser: string;   // 表示したい利用者名
  value: Dayjs;           // クリックした日付（月の基準）
}

export default function UserDaysColumns({ allStaff, selectedUser, value }: Props) {
  const startDate = value.startOf('month');
  const daysInMonth = value.daysInMonth();

  // 月内の全日付を走査し、selectedUserが含まれる行を収集
  const tableData = [...Array(daysInMonth)].flatMap((_, index) => {
    const day = startDate.add(index, 'day');
    const dateString = day.format('YYYY-MM-DD');

    // その日にselectedUserが入っている全スタッフを収集
    return allStaff.flatMap((staff) => {
      const detail = staff.details[dateString];
      if (!detail || detail.user !== selectedUser) return [];
      return [{
        key: `${dateString}-${staff.staffId}`,
        date: day.format('M/D(ddd)'),
        staffName: staff.name,
        start: dayjs(detail.start).format('HH:mm'),
        end: dayjs(detail.end).format('HH:mm'),
        type: detail.type,
      }];
    });
  });

  const columns: ColumnsType<typeof tableData[number]> = [
    { title: '日付',   dataIndex: 'date',      key: 'date',      width: 100 },
    { title: '職員名', dataIndex: 'staffName',  key: 'staffName', width: 100 },
    { title: '開始',   dataIndex: 'start',      key: 'start',     width: 80  },
    { title: '終了',   dataIndex: 'end',        key: 'end',       width: 80  },
    { title: '種別',   dataIndex: 'type',       key: 'type',      width: 100 },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      bordered
      size="middle"
      scroll={{ x: 'max-content' }}
      pagination={false}
    />
  );
}