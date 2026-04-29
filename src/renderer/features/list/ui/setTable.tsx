import { Table } from "antd";
import data from "../../../../backend/data/users/base.json";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";

function getAllUsers(basedata: typeof data.basedata): string[] {
  const userSet = new Set<string>();
  for (const staff of basedata) {
    for (const entry of Object.values(staff.details)) {
      userSet.add(entry.user);
    }
  }
  return [...userSet].sort();
}

// ★ 修正点: 日付一致 → 同月内に1件でも担当があればtrue
function isAssignedInMonth(
  staff: typeof data.basedata[number],
  userName: string,
  value: Dayjs
): boolean {
  const targetYear  = value.year();
  const targetMonth = value.month(); // 0始まり

  return Object.entries(staff.details).some(([dateKey, entry]) => {
    if (entry.user !== userName) return false;
    // dateKey は "YYYY-MM-DD" 形式
    const [y, m] = dateKey.split("-").map(Number);
    return y === targetYear && (m - 1) === targetMonth; // monthは0始まりに合わせる
  });
}

export default function UserColumn({ value }: { value: Dayjs }) {

  const allUsers = getAllUsers(data.basedata);

  const weekColumns: ColumnsType<any> = [
    {
      title: '職員',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
    },
    ...allUsers.map((userName) => ({
      title: userName,
      key: userName,
      width: 80,
      align: 'center' as const,
      render(_: any, record: typeof data.basedata[number]) {
        return isAssignedInMonth(record, userName, value) ? '○' : '';
      },
    })),
  ];

    return (
    <Table<any>
      columns={weekColumns}
      dataSource={data.basedata}
      rowKey="staffId"
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content' }}
    />
  );
}