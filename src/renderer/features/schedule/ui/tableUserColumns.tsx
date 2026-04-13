import { Table } from "antd";
import data from "../../../../backend/data/users/base.json";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export default function UserColumn(value: Dayjs) {
  const startDate = dayjs().startOf('week');

  const weekColumns: ColumnsType<any> = [
    // 職員列（固定）
    {
      title: '職員',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
    },
    // 日付列 × 7（children付き）
    ...[...Array(31)].map((_, index) => {
      const day = startDate.add(index, 'day');
      const dateStr = day.format('YYYY-MM-DD');

      return {
        title: day.format('M/D(ddd)'),
        key: dateStr,
        children: [
          {
            title: '利用者',
            dataIndex: [dateStr, 'user'],
            key: `${dateStr}_user`,
            width: 100,
            render: (text: string) => text || '-',
          },
          {
            title: '開始',
            dataIndex: [dateStr, 'start'],
            key: `${dateStr}_start`,
            width: 80,
            render: (text: string) => text ? dayjs(text).format('HH:mm') : '-',
          },
          {
            title: '終了',
            dataIndex: [dateStr, 'end'],
            key: `${dateStr}_end`,
            width: 80,
            render: (text: string) => text ? dayjs(text).format('HH:mm') : '-',
          },
          {
            title: '種別',
            dataIndex: [dateStr, 'type'],
            key: `${dateStr}_type`,
            width: 100,
            render: (text: string) => text || '-',
          },
        ],
      };
    }),
  ];

  return (
    <Table<any>
      columns={weekColumns}
      dataSource={data.basedata}
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content'}}
    />
  );
}