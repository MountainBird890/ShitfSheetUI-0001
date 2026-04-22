import React, { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  ConfigProvider,
  Layout,
  Badge,
  Tooltip,
  message,
} from "antd";
import { EditOutlined, CalendarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import ScheduleEditModal, {
  type StaffRecord,
  type ScheduleEntry,
} from "../../../../renderer/features/calendar/ui/editer";
import { useEditor } from "../state/useCalendar";

dayjs.locale("ja");

const { Title, Text } = Typography;
const { Header, Content } = Layout;

// ---- Sample JSON data -------------------------------------------

const initialData: StaffRecord[] = [
  {
    staffId: "1",
    name: "兵庫太郎",
    position: "管理者",
    "2026-04-25": {
      user: "加藤",
      start: "2026-04-25T10:00",
      end: "2026-04-25T14:00",
      type: "見守り",
    },
    "2026-04-20": {
      user: "鈴木",
      start: "2026-04-20T08:00",
      end: "2026-04-20T11:00",
      type: "外出支援",
    },
    "2026-04-30": {
      user: "山田",
      start: "2026-04-30T09:00",
      end: "2026-04-30T17:00",
      type: "生活",
    },
  },
  {
    staffId: "2",
    name: "大阪花子",
    position: "介護職員",
    "2026-04-22": {
      user: "田中",
      start: "2026-04-22T09:00",
      end: "2026-04-22T12:00",
      type: "身体介護",
    },
    "2026-04-24": {
      user: "佐藤",
      start: "2026-04-24T14:00",
      end: "2026-04-24T16:00",
      type: "入浴介助",
    },
  },
];

// ---- Date keys extractor ----------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getDateEntries(
  staff: StaffRecord
): { dateKey: string; entry: ScheduleEntry }[] {
  return Object.entries(staff)
    .filter(([k]) => DATE_RE.test(k))
    .map(([k, v]) => ({ dateKey: k, entry: v as ScheduleEntry }));
}

// ---- Color map --------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  見守り: "blue",
  外出支援: "green",
  生活: "orange",
  身体介護: "red",
  入浴介助: "cyan",
  食事介助: "purple",
  移乗介助: "magenta",
  その他: "default",
};

// ---- Flat row type for Table -------------------------------------

interface FlatRow {
  key: string;
  staffId: string;
  name: string;
  position: string;
  dateKey: string;
  entry: ScheduleEntry;
}

function flatten(data: StaffRecord[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const s of data) {
    const entries = getDateEntries(s);
    for (const { dateKey, entry } of entries) {
      rows.push({
        key: `${s.staffId}-${dateKey}`,
        staffId: s.staffId as string,
        name: s.name as string,
        position: (s.position as string) ?? "",
        dateKey,
        entry,
      });
    }
  }
  return rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

// ---- Main App ---------------------------------------------------

const App: React.FC = () => {
  const [data, setData] = useState<StaffRecord[]>(initialData);
  const { openEditor } = useEditor();  
  const [messageApi, contextHolder] = message.useMessage();

  const openEdit = (staffId: string, dateKey: string) => {
    const staff = data.find((s) => s.staffId === staffId) ?? null;
    setSelectedStaff(staff);
    setSelectedDate(dateKey);
    setModalOpen(true);
  };

  const handleSave = (
    staffId: string,
    dateKey: string,
    updated: ScheduleEntry,
    updatedName: string
  ) => {
    setData((prev) =>
      prev.map((s) => {
        if (s.staffId !== staffId) return s;
        return { ...s, name: updatedName, [dateKey]: updated };
      })
    );
    setModalOpen(false);
    messageApi.success("保存しました");
  };

  const columns: ColumnsType<FlatRow> = [
    {
      title: "職員名",
      dataIndex: "name",
      key: "name",
      width: 140,
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>
            {name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.position}
          </Text>
        </Space>
      ),
    },
    {
      title: "サービス提供日",
      dataIndex: "dateKey",
      key: "dateKey",
      width: 160,
      render: (d: string) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "#0d5c8f" }} />
          <Text>{dayjs(d).format("YYYY/MM/DD（ddd）")}</Text>
        </Space>
      ),
    },
    {
      title: "開始",
      key: "start",
      width: 90,
      render: (_, row) => (
        <Text style={{ fontVariantNumeric: "tabular-nums" }}>
          {dayjs(row.entry.start).format("HH:mm")}
        </Text>
      ),
    },
    {
      title: "終了",
      key: "end",
      width: 90,
      render: (_, row) => (
        <Text style={{ fontVariantNumeric: "tabular-nums" }}>
          {dayjs(row.entry.end).format("HH:mm")}
        </Text>
      ),
    },
    {
      title: "被介護者",
      key: "user",
      width: 100,
      render: (_, row) => (
        <Badge
          color="#52c41a"
          text={<Text strong>{row.entry.user}</Text>}
        />
      ),
    },
    {
      title: "種別",
      key: "type",
      width: 120,
      render: (_, row) => (
        <Tag color={TYPE_COLORS[row.entry.type] ?? "default"}>
          {row.entry.type}
        </Tag>
      ),
    },
    {
      title: "",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <Tooltip title="編集">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(row.staffId, row.dateKey)}
            style={{ color: "#0d5c8f" }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0d5c8f",
          borderRadius: 8,
          fontFamily: "'Noto Sans JP', sans-serif",
        },
        components: {
          Table: {
            headerBg: "#f0f7ff",
            headerColor: "#1a3a5c",
          },
        },
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
        <Header
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #0d5c8f 100%)",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
          }}
        >
          <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
            サービス記録管理
          </Title>
        </Header>

        <Content style={{ padding: "32px 40px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Space style={{ marginBottom: 20 }} align="center">
              <CalendarOutlined style={{ fontSize: 20, color: "#0d5c8f" }} />
              <Title level={5} style={{ margin: 0, color: "#1a3a5c" }}>
                サービス提供一覧
              </Title>
              <Tag color="blue">{flatten(data).length} 件</Tag>
            </Space>

            <Table
              columns={columns}
              dataSource={flatten(data)}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="middle"
              bordered={false}
              rowHoverable
            />
          </div>
        </Content>
      </Layout>

      <ScheduleEditModal
        open={modalOpen}
        staff={selectedStaff}
        dateKey={selectedDate}
        onSave={handleSave}
        onCancel={() => setModalOpen(false)}
      />
    </ConfigProvider>
  );
};

export default App;