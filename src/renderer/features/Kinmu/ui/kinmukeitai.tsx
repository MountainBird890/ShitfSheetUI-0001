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
      title: '職種',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: '勤務形態',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: '職員名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    // 日付列 × 7（children付き）
    ...[...Array(31)].map((_, index) => {
      const day = startDate.add(index, 'day');
      const dateStr = day.format('YYYY-MM-DD');

      return {
        title: day.format('M/D(ddd)'),
        key: dateStr,
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