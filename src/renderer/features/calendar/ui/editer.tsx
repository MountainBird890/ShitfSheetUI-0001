import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  TagOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import locale from "antd/es/date-picker/locale/ja_JP";
import { useEditor } from "../state/useCalendar";

dayjs.locale("ja");

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ---- Types -------------------------------------------------------

export interface ScheduleEntry {
  user: string;
  start: string; // ISO datetime string e.g. "2026-04-25T10:00"
  end: string;
  type: string;
}

export interface StaffRecord {
  staffId: string;
  name: string;
  position?: string;
  details?: Record<string, ScheduleEntry>;  // ← detailsにまとめる
}

export interface EditFormValues {
  name: string;
  user: string;
  dateRange: [Dayjs, Dayjs];
  type: string;
}

// ---- Service type options ----------------------------------------

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

// ---- Component ---------------------------------------------------
const ScheduleEditModal: React.FC = () => {
  const { open, staff, dateKey, handleSave, closeEditor } = useEditor();  // ← 追加
  const [form] = Form.useForm<EditFormValues>();
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (!open || !staff || !dateKey) return;

    const entry = staff.details?.[dateKey] as ScheduleEntry | undefined;

    form.setFieldsValue({
      name: staff.name as string,
      user: entry?.user ?? "",
      dateRange: entry
        ? [dayjs(entry.start), dayjs(entry.end)]
        : [dayjs(dateKey + "T09:00"), dayjs(dateKey + "T17:00")],
      type: entry?.type ?? undefined,
    });
    setDirty(false);
  }, [open, staff, dateKey, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const updated: ScheduleEntry = {
        user: values.user,
        start: values.dateRange[0].format("YYYY-MM-DDTHH:mm"),
        end: values.dateRange[1].format("YYYY-MM-DDTHH:mm"),
        type: values.type,
      };

      // Simulate async save
      await new Promise((r) => setTimeout(r, 400));

      handleSave(staff!.staffId as string, dateKey!, updated, values.name);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const typeColor = (t?: string) =>
    SERVICE_TYPES.find((s) => s.value === t)?.color ?? "default";

  const currentEntry = staff && dateKey ? (staff.details?.[dateKey] as ScheduleEntry | undefined) : undefined;

  console.log("editer.tsx is correct")
  return (
    <Modal
      open={open}
      onCancel={closeEditor}
      footer={null}
      width={560}
      destroyOnHidden
      title={null}
      styles={{
        container: {
          padding: 0,
          borderRadius: 12,
          overflow: "hidden",
        },
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
          <EditOutlined style={{ fontSize: 20, opacity: 0.85 }} />
          <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
            サービス記録 編集
          </Title>
        </Space>
        {dateKey && (
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "block", marginTop: 4 }}>
            {dayjs(dateKey).format("YYYY年M月D日（ddd）")}
          </Text>
        )}
        {currentEntry && (
          <Tag
            color={typeColor(currentEntry.type)}
            style={{ marginTop: 8, borderRadius: 12, fontWeight: 500 }}
          >
            {currentEntry.type}
          </Tag>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "24px 28px 8px" }}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => setDirty(true)}
          requiredMark="optional"
        >
          {/* 職員名 */}
          <Form.Item
            label={
              <Space size={6}>
                <UserOutlined style={{ color: "#0d5c8f" }} />
                <span style={{ fontWeight: 600 }}>職員名</span>
              </Space>
            }
            name="name"
            rules={[{ required: true, message: "職員名を入力してください" }]}
          >
            <Input placeholder="例：兵庫太郎" size="large" />
          </Form.Item>

          <Divider style={{ margin: "8px 0 16px" }} />

          {/* ご利用者 */}
          <Form.Item
            label={
              <Space size={6}>
                <UserOutlined style={{ color: "#52c41a" }} />
                <span style={{ fontWeight: 600 }}>ご利用者</span>
              </Space>
            }
            name="user"
            rules={[{ required: true, message: "ご利用者を入力してください" }]}
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
              {(["name", "user", "type"] as const).map((f) => {
                const v = form.getFieldValue(f);
                return v ? (
                  <Col key={f} span={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {f === "name" ? "職員" : f === "user" ? "ご利用者" : "種別"}
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
        <Button icon={<CloseOutlined />} onClick={closeEditor} size="large">
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
  );
};

export default ScheduleEditModal;