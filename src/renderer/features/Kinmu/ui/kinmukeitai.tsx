import { Table } from "antd";
import data from "../../../../backend/data/users/base.json";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

// ・労働日数,労働時間,深夜時間,早朝夜間時間,研修手当,移動手当,労働時間における介護時間の計算ロジック及びUIを作る

export default function UserColumn(value: Dayjs) {
  const startDate = dayjs().startOf('week');
  
  const concurrented = data.basedata.filter(type => type["employment-type"] === "B" || type["employment-type"] === "D");
  
  const weekColumns: ColumnsType<any> = [
    // 職員列（固定）
    {
      title: '職種',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: '勤務形態',
      dataIndex: 'employment-type',
      key: 'employment-type',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: '資格',
      dataIndex: 'qualifications',
      key: 'qualifications',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: '兼務先',
      key: 'qualifications',
      width: 100,
      fixed: 'left',
      align: 'center',
        render: (_: any, record: any) => {
    // そのスタッフ自身が "B" タイプなら work-place を表示、そうでなければ空
    if ((record["employment-type"] === "B") || (record["employment-type"] === "D")) {
      return record["work-place"];
    }
    return "-";
  }
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
      rowKey={"name"}
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content'}}
    />
  );
}