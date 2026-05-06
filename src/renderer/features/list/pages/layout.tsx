import { useState } from "react";
import { Button, Modal, Space } from "antd";
import StaffForm from "../ui/StaffForm";
import UserColumn from "../ui/setTable";
import DeleteStaff from "../ui/deleteStaff";
import dayjs from "dayjs";

export default function Shift() {
  const [open, setOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const handleSuccess = () => setTableKey(k => k + 1);

  return (
    <div className="layout">
      <div className="list">
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setOpen(true)}>
            職員を追加
          </Button>
          <DeleteStaff onSuccess={handleSuccess} />
        </Space>

        <Modal
          title="職員を追加"
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          destroyOnHidden
        >
          <StaffForm onSuccess={() => {
            setOpen(false);
            handleSuccess();
          }} />
        </Modal>

        <UserColumn key={tableKey} value={dayjs()} />
      </div>
    </div>
  );
}