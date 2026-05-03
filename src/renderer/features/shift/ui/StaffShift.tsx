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
  staff: StaffWork;
  value: Dayjs; // クリックした日付
}

export default function DaysColumns({ staff, value }: Props) {
  // クリックした日付が属する月の1日〜末日を生成
  const startDate = value.startOf('month');
  const daysInMonth = value.daysInMonth();

  // detailsがある日付だけ行データに変換
  const tableData = [...Array(daysInMonth)].flatMap((_, index) => {
    const day = startDate.add(index, 'day');
    const dateString = day.format('YYYY-MM-DD');
    const detail = staff.details[dateString];
    if (!detail) return []; // detailsにない日は除外
    return [{
      key: dateString,
      date: day.format('M/D(ddd)'),
      user: detail.user,
      start: dayjs(detail.start).format('HH:mm'),
      end: dayjs(detail.end).format('HH:mm'),
      type: detail.type,
    }];
  });

  const columns: ColumnsType<typeof tableData[number]> = [
    { title: '日付',   dataIndex: 'date', key: 'date', width: 100 },
    { title: '介助者', dataIndex: 'user', key: 'user', width: 100 },
    { title: '開始',   dataIndex: 'start', key: 'start', width: 80 },
    { title: '終了',   dataIndex: 'end',   key: 'end',   width: 80 },
    { title: '種別',   dataIndex: 'type',  key: 'type',  width: 100 },
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