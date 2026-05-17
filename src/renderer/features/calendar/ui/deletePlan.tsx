import { useState, useEffect } from "react";
import { Button, Modal, Select, Popconfirm, message, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { apiUrl } from "../../../../lib/api";

type DetailEntry = {
  user: string;
  start: string;
  end: string;
  type: string;
};

type StaffRecord = {
  staffId: string;
  name: string;
  details?: Record<string, DetailEntry>;
  active?: boolean;
};

type Props = {
  currentMonth: Dayjs;
  onSuccess?: () => void;
};

export default function DeletePlan({ currentMonth, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [selectedDateKey, setSelectedDateKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchStaff = () => {
    fetch(apiUrl("/api/staff"))
      .then(res => res.json())
      .then((list: StaffRecord[]) =>
        setStaffList(list.filter(s => s.active !== false))
      )
      .catch(err => console.error("fetch失敗:", err));
  };

  useEffect(() => {
    if (open) fetchStaff();
  }, [open]);

  // 選択した職員の当月予定を選択肢に変換
  const scheduleOptions = (() => {
    if (!selectedStaffId) return [];
    const staff = staffList.find(s => s.staffId === selectedStaffId);
    const monthPrefix = currentMonth.format("YYYY-MM");
    return Object.entries(staff?.details ?? {})
      .filter(([date]) => date.startsWith(monthPrefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, detail]) => ({
        value: date,
        label: `${date}　${dayjs(detail.start).format("HH:mm")}〜${dayjs(detail.end).format("HH:mm")}　${detail.user}　${detail.type}`,
      }));
  })();

  const handleStaffChange = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedDateKey(undefined);  // 職員変更時に予定選択をリセット
  };

  const handleDelete = async () => {
    if (!selectedStaffId || !selectedDateKey) return;
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/staff/${selectedStaffId}/schedule/${selectedDateKey}`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("予定を削除しました");
      setOpen(false);
      setSelectedStaffId(undefined);
      setSelectedDateKey(undefined);
      onSuccess?.();
    } catch (err) {
      message.error(`削除失敗: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStaffId(undefined);
    setSelectedDateKey(undefined);
  };

  return (
    <>
      <Button danger onClick={() => setOpen(true)}>
        予定を削除
      </Button>

      <Modal
        title="予定を削除"
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnHidden
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          {/* 職員選択 */}
          <Select
            placeholder="職員を選択"
            style={{ width: "100%" }}
            value={selectedStaffId}
            onChange={handleStaffChange}
            options={staffList.map(s => ({ value: s.staffId, label: s.name }))}
          />

          {/* 予定選択（職員選択後に表示） */}
          <Select
            placeholder={selectedStaffId ? "削除する予定を選択" : "先に職員を選択してください"}
            style={{ width: "100%" }}
            value={selectedDateKey}
            onChange={setSelectedDateKey}
            options={scheduleOptions}
            disabled={!selectedStaffId}
          />

          <Popconfirm
            title="本当に削除しますか？"
            description="この操作は取り消せません"
            onConfirm={handleDelete}
            okText="削除"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
            disabled={!selectedStaffId || !selectedDateKey}
          >
            <Button
              danger
              loading={loading}
              disabled={!selectedStaffId || !selectedDateKey}
              style={{ width: "100%" }}
            >
              削除する
            </Button>
          </Popconfirm>
        </Space>
      </Modal>
    </>
  );
}