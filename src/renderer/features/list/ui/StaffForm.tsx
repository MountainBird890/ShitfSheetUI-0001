import { useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import { apiUrl } from "../../../../lib/api";

type StaffFormValues = {
  name:              string;
  position:          string;
  employmentType: string;
  qualifications: string;
  workPlace:      string; 
};

type Props = { onSuccess?: () => void };  // ← 定義はそのまま

export default function StaffForm({ onSuccess }: Props) {  // ← ここが抜けてた
  const [form]      = Form.useForm<StaffFormValues>();
  const [loading, setLoading] = useState(false);
  const [modal, contextHolder] = Modal.useModal();

const onFinish = async (values: StaffFormValues) => {
  setLoading(true);
  try {
    const payload = {  // ← tryの中に移動
      name:              values.name,
      position:          values.position,
      "employment-type": values.employmentType,
      qualifications:    values.qualifications,
      "work-place":      values.workPlace,
    };
    const res = await fetch(apiUrl("/api/staff"), {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { staffId } = await res.json();
    modal.success({
      title:   "保存完了",
      content: `職員を登録しました（staffId: ${staffId}）`,
    });
    onSuccess?.();
    form.resetFields();
  } catch (err) {
    modal.error({
      title:   "保存失敗",
      content: `エラーが発生しました: ${(err as Error).message}`,
    });
  } finally {
    setLoading(false);
  }
};

   return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
        <Form.Item name="name" label="職員名"
          rules={[{ required: true, message: "職員名を入力してください" }]}>
          <Input placeholder="例: 兵庫太郎" />
        </Form.Item>
        <Form.Item name="position" label="職種"
          rules={[{ message: "職種を入力してください" }]}>
          <Input placeholder="例: 管理者" />
        </Form.Item>
        <Form.Item name="employmentType" label="勤務形態"
          rules={[{ message: "勤務形態を選択してください" }]}>
          <Select placeholder="選択してください">
            <Select.Option value="A">A</Select.Option>
            <Select.Option value="B">B</Select.Option>
            <Select.Option value="C">C</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="qualifications" label="資格">
          <Input placeholder="例: 介護福祉士" />
        </Form.Item>
        <Form.Item name="workPlace" label="兼務先"
          rules={[{ message: "兼務先を入力してください" }]}>
          <Input placeholder="例: 特別養護老人ホーム兵庫" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
        </Form.Item>
      </Form>

          </>
  );
}