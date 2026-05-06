import { useState, useEffect } from "react";
import { Button, Modal, Select, Popconfirm, message } from "antd";
import { apiUrl } from "../../../../lib/api";

type StaffRecord = {
  staffId: string;
  name: string;
  active?: boolean;
};

type Props = { onSuccess?: () => void };

export default function DeleteStaff({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchStaff = () => {
    fetch(apiUrl("/api/staff"))
      .then(res => res.json())
      .then((list: StaffRecord[]) =>
        setStaffList(list.filter(s => s.active !== false))
      )
      .catch(err => console.error("職員一覧fetch失敗:", err));
  };

  useEffect(() => {
    if (open) fetchStaff();  // Modal開いた時だけfetch
  }, [open]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/staff/${selectedId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("職員を削除しました");
      setOpen(false);
      setSelectedId(undefined);
      onSuccess?.();
    } catch (err) {
      message.error(`削除失敗: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button danger onClick={() => setOpen(true)}>
        職員を削除
      </Button>

      <Modal
        title="職員を削除"
        open={open}
        onCancel={() => { setOpen(false); setSelectedId(undefined); }}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="削除する職員を選択"
            style={{ width: "100%" }}
            value={selectedId}
            onChange={setSelectedId}
            options={staffList.map(s => ({ value: s.staffId, label: s.name }))}
          />
        </div>
        <Popconfirm
          title="本当に削除しますか？"
          description="データは非表示になります（記録は保持されます）"
          onConfirm={handleDelete}
          okText="削除"
          cancelText="キャンセル"
          okButtonProps={{ danger: true }}
          disabled={!selectedId}
        >
          <Button
            danger
            loading={loading}
            disabled={!selectedId}
            style={{ width: "100%" }}
          >
            削除する
          </Button>
        </Popconfirm>
      </Modal>
    </>
  );
}