import { Table, Button, Popconfirm  } from "antd";
import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { apiUrl } from "../../../../lib/api";

type StaffRecord = {
  staffId: string;
  name: string;
  active?: boolean;
  details: Record<string, { user: string }>;
};

function getAllUsers(basedata: StaffRecord[]): string[] {
  const userSet = new Set<string>();
  for (const staff of basedata) {
    for (const entry of Object.values(staff.details ?? {})) {
      if (entry.user) userSet.add(entry.user);
    }
  }
  return [...userSet].sort();
}

function isAssignedInMonth(
  staff: StaffRecord,
  userName: string,
  value: Dayjs
): boolean {
  const targetYear  = value.year();
  const targetMonth = value.month();
  return Object.entries(staff.details ?? {}).some(([dateKey, entry]) => {
    if (entry.user !== userName) return false;
    const [y, m] = dateKey.split("-").map(Number);
    return y === targetYear && (m - 1) === targetMonth;
  });
}

export default function UserColumn({ value }: { value: Dayjs }) {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);

  const fetchStaff = () => {
    fetch(apiUrl("/api/staff"))
      .then(res => res.json())
      .then((list: StaffRecord[]) =>
        // ★ active: false を除外（undefinedは既存データなので表示する）
        setStaffList(list.filter(s => s.active !== false))
      )
      .catch(err => console.error("職員一覧fetch失敗:", err));
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleDelete = async (staffId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/staff/${staffId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchStaff();  // 削除後に再fetch
    } catch (err) {
      console.error("削除失敗:", err);
    }
  };

  const allUsers = getAllUsers(staffList);

  const weekColumns: ColumnsType<StaffRecord> = [
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
      render(_: any, record: StaffRecord) {
        return isAssignedInMonth(record, userName, value) ? '○' : '';
      },
    })),
    // ★ 削除ボタン列を追加
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render(_: any, record: StaffRecord) {
        return (
          <Popconfirm
            title="職員を削除しますか？"
            description="データは非表示になります（記録は保持されます）"
            onConfirm={() => handleDelete(record.staffId)}
            okText="削除"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small">削除</Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table<StaffRecord>
      columns={weekColumns}
      dataSource={staffList}
      rowKey="staffId"
      bordered
      size="middle"
      scroll={{ x: 'max-content', y: 'max-content' }}
    />
  );
}