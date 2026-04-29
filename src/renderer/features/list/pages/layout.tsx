import { useState } from "react";
import { Button, Modal } from "antd";
import StaffForm from "../ui/StaffForm";
import UserColumn from "../ui/setTable";
import dayjs from "dayjs";

export default function Shift() {
  const [open, setOpen] = useState(false);

  return (
    <div className="layout">
      <div className="list">

        <Button type="primary" onClick={() => setOpen(true)}>
          職員を追加
        </Button>

        <Modal
          title="職員を追加"
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          destroyOnHidden  
        >
          <StaffForm onSuccess={() => setOpen(false)} />
        </Modal>

        <UserColumn value={dayjs()} />

      </div>
    </div>
  );
}