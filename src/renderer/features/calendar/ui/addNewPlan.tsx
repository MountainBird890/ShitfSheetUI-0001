import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Typography,
  Space,
  Divider,
  Tag,
  Row,
  Col,
  Card,
  message,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  TagOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import locale from "antd/es/date-picker/locale/ja_JP";
import baseData from "../../../../backend/data/users/base.json";
import type { StaffWork } from "../../../../backend/data/basetype";
import { apiUrl } from "../../../../lib/api";

dayjs.locale("ja");

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SERVICE_TYPES = [
  { value: "見守り", color: "blue" },
  { value: "外出支援", color: "green" },
  { value: "生活", color: "orange" },
  { value: "身体介護", color: "red" },
  { value: "入浴介助", color: "cyan" },
  { value: "食事介助", color: "purple" },
  { value: "移乗介助", color: "magenta" },
  { value: "その他", color: "default" },
];

type AddFormValues = {
  staffId: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  user: string;
  type: string;
};

type Props = {
  onSuccess?: () => void; // 保存後にカレンダーを再描画したい場合に使う
};

const AddNewPlanModal: React.FC<Props> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<AddFormValues>();
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const data = baseData.basedata as unknown as StaffWork[];
  const staffOptions = data.map((s) => ({
    value: s.staffId,
    label: s.name,
  }));

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const dateKey = values.dateRange[0].format("YYYY-MM-DD");
      const start = values.dateRange[0].format("YYYY-MM-DDTHH:mm");
      const end = values.dateRange[1].format("YYYY-MM-DDTHH:mm");

      const res = await fetch(apiUrl("/api/schedule/add"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: values.staffId,
          dateKey,
          user: values.user,
          start,
          end,
          type: values.type,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "保存に失敗しました");
      }

      message.success("予定を追加しました");
      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      message.error(e.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (t?: string) =>
    SERVICE_TYPES.find((s) => s.value === t)?.color ?? "default";

  return (
    <>
      {/* 開くボタン */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleOpen}
        style={{
          background: "linear-gradient(135deg, #1a3a5c, #0d5c8f)",
          border: "none",
        }}
      >
        予定を追加
      </Button>

      <Modal
        open={open}
        onCancel={handleClose}
        afterOpenChange={(visible) => {
          if(visible){
              form.resetFields();
              setDirty(false);
          }
        }}
        footer={null}
        width={560}
        destroyOnHidden
        title={null}
        styles={{
          container: { padding: 0, borderRadius: 12, overflow: "hidden" },
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #0d5c8f 100%)",
            padding: "24px 28px 20px",
            color: "#fff",
          }}
        >
          <Space align="center" size={10}>
            <PlusOutlined style={{ fontSize: 20, opacity: 0.85 }} />
            <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
              サービス記録 新規追加
            </Title>
          </Space>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              display: "block",
              marginTop: 4,
            }}
          >
            同日に既存の予定がある場合は自動で連番保存されます
          </Text>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "24px 28px 8px" }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={() => setDirty(true)}
            requiredMark="optional"
          >
            {/* 職員選択 */}
            <Form.Item
              label={
                <Space size={6}>
                  <UserOutlined style={{ color: "#0d5c8f" }} />
                  <span style={{ fontWeight: 600 }}>職員名</span>
                </Space>
              }
              name="staffId"
              rules={[{ required: true, message: "職員を選択してください" }]}
            >
              <Select
                showSearch
                placeholder="職員を選択"
                size="large"
                options={staffOptions}
                filterOption={(input, option) =>
                  (option?.label ?? "").includes(input)
                }
              />
            </Form.Item>

            <Divider style={{ margin: "8px 0 16px" }} />

            {/* 被介護者 */}
            <Form.Item
              label={
                <Space size={6}>
                  <UserOutlined style={{ color: "#52c41a" }} />
                  <span style={{ fontWeight: 600 }}>被介護者</span>
                </Space>
              }
              name="user"
              rules={[{ required: true, message: "被介護者を入力してください" }]}
            >
              <Input placeholder="例：加藤" size="large" />
            </Form.Item>

            {/* サービス提供日時 */}
            <Form.Item
              label={
                <Space size={6}>
                  <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                  <span style={{ fontWeight: 600 }}>サービス提供日時</span>
                </Space>
              }
              name="dateRange"
              rules={[{ required: true, message: "日時を選択してください" }]}
            >
              <RangePicker
                showTime={{ format: "HH:mm", minuteStep: 1 }}
                format="YYYY/MM/DD HH:mm"
                locale={locale}
                size="large"
                style={{ width: "100%" }}
                placeholder={["開始日時", "終了日時"]}
              />
            </Form.Item>

            {/* 種別 */}
            <Form.Item
              label={
                <Space size={6}>
                  <TagOutlined style={{ color: "#722ed1" }} />
                  <span style={{ fontWeight: 600 }}>種別</span>
                </Space>
              }
              name="type"
              rules={[{ required: true, message: "種別を選択してください" }]}
            >
              <Select placeholder="種別を選択" size="large" allowClear>
                {SERVICE_TYPES.map((s) => (
                  <Option key={s.value} value={s.value}>
                    <Tag color={s.color} style={{ marginRight: 6 }}>
                      {s.value}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          {/* Preview card */}
          {dirty && (
            <Card
              size="small"
              style={{
                background: "#f0f9ff",
                border: "1px solid #91caff",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 12, color: "#0958d9", fontWeight: 600 }}>
                プレビュー（未保存）
              </Text>
              <Row gutter={8} style={{ marginTop: 6 }}>
                {(["staffId", "user", "type"] as const).map((f) => {
                  const v =
                    f === "staffId"
                      ? staffOptions.find(
                          (o) => o.value === form.getFieldValue("staffId")
                        )?.label
                      : form.getFieldValue(f);
                  return v ? (
                    <Col key={f} span={8}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {f === "staffId" ? "職員" : f === "user" ? "被介護者" : "種別"}
                      </Text>
                      <br />
                      <Text strong style={{ fontSize: 13 }}>
                        {v}
                      </Text>
                    </Col>
                  ) : null;
                })}
              </Row>
            </Card>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "12px 28px 20px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        >
          <Button icon={<CloseOutlined />} onClick={handleClose} size="large">
            キャンセル
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
            size="large"
            style={{
              background: "linear-gradient(135deg, #1a3a5c, #0d5c8f)",
              border: "none",
              minWidth: 120,
            }}
          >
            保存する
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default AddNewPlanModal;