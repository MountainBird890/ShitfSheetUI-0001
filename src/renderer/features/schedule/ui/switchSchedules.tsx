import { Segmented } from "antd";
import { TableOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import UserColumn from "./tableUserColumns";
import StaffColumn from "./tableStaffColumns";

export default function ToggleSchedule() {
  const [mode, setMode] = useState<'staff' | 'user'>('staff');

  return (
    <>
      <Segmented
        options={[
          { label: '職員軸', value: 'staff', icon: <TableOutlined /> },
          { label: 'ご利用者軸', value: 'user', icon: <UserOutlined /> },
        ]}
        value={mode}
        onChange={(val) => setMode(val as 'staff' | 'user')}
        style={{ marginBottom: 16 }}
      />
      {mode === 'staff' ? <UserColumn /> : <StaffColumn />}
    </>
  );
}