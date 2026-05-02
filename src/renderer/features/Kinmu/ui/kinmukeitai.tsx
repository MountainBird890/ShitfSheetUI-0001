/**
 * kimukeitai.tsx
 * 介護業 勤務形態表
 * - 月初〜月末の日付列を生成
 * - APIから労働日数 / 労働時間 / 深夜時間 / 早朝夜間時間 /
 *   研修手当 / 移動手当 / 介護時間・介護率 を取得して表示
 */

import { useMemo, useState, useEffect } from "react";
import { Table, Tag, DatePicker, Tooltip, Badge, Statistic, Card, Row, Col, Typography, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { apiUrl } from "../../../../lib/api";

dayjs.locale("ja");

// ─── 型定義 ─────────────────────────────────────────────────

interface ScheduleDetail {
  user:  string;
  start: string;
  end:   string;
  type:  string;
}

interface StaffWork {
  staffId:            string;
  name:               string;
  position?:          string;
  "employment-type"?: string;
  qualifications?:    string;
  "work-place"?:      string;
  days:  { workingDays: number; paidLeaveDays: number };
  hours: {
    workingHours: number; nightHours: number;
    morningEveningHours: number; overtimeHours: number;
    emergencyPrevHours: number; emergencySameDayHours: number;
    careTrainingHours: number;
  };
  counts:  { travelCount: number };
  amounts: Record<string, number>;
  details?: Record<string, ScheduleDetail>;
}

// サーバーから返ってくるサマリー型
interface ApiMonthlySummary {
  staffId:             string;
  name:                string;
  workingDays:         number;
  workingHours:        number;
  nightHours:          number;
  morningEveningHours: number;
  careHours:           number;
  careRatio:           number;
  trainingHours:       number;
  travelHours:         number;
}

// ─── 種別カラー（日付セル表示用） ───────────────────────────

const TYPE_COLOR: Record<string, string> = {
  身体介護: "red", 身体: "volcano", 生活: "orange",
  外出支援: "gold", 見守り: "green", 入浴: "cyan",
  排泄: "purple", 研修: "blue",
};
const typeColor = (t: string) =>
  Object.entries(TYPE_COLOR).find(([k]) => t.includes(k))?.[1] ?? "default";

// ─── シフト時間計算（Tooltipの内訳表示用） ──────────────────

function toMin(dateTimeStr: string) {
  const d = new Date(dateTimeStr);
  return d.getHours() * 60 + d.getMinutes();
}
function overlap(aS: number, aE: number, bS: number, bE: number) {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

const CARE_TYPES = ["身体", "生活", "外出支援", "入浴", "排泄", "見守り", "身体介護"];

function calcShift(d: ScheduleDetail) {
  const s    = toMin(d.start);
  const e    = toMin(d.end);
  const adjE = e <= s ? e + 1440 : e;
  const workMin  = adjE - s;
  const nightMin =
    overlap(s, adjE,    0,   300) +
    overlap(s, adjE, 1320, 1440) +
    overlap(s, adjE, 1440, 1740);
  const meMin =
    overlap(s, adjE,  300,  480) +
    overlap(s, adjE, 1080, 1320);
  const careMin = CARE_TYPES.some(k => d.type.includes(k)) ? workMin : 0;
  return { workMin, nightMin, meMin, careMin };
}

// ─── サマリーカード（行展開時） ──────────────────────────────

interface SummaryCardsProps { summary: ApiMonthlySummary | undefined }

function SummaryCards({ summary: s }: SummaryCardsProps) {
  if (!s) return <Spin />;
const items = [
  { title: "労働日数",       value: s.workingDays,         suffix: "日" },
  { title: "労働時間",       value: s.workingHours,         suffix: "h"  },
  { title: "深夜時間",       value: s.nightHours,           suffix: "h"  },
  { title: "早朝・夜間時間", value: s.morningEveningHours,  suffix: "h"  },
  { title: "介護時間",       value: s.careHours,            suffix: "h"  },
  { title: "介護率",         value: s.careRatio,            suffix: "%"  },
  { title: "研修時間",       value: s.trainingHours,        suffix: "h"  }, // ← 変更
  { title: "移動時間", value: s.travelHours, suffix: "h" },
];
  return (
    <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
      {items.map(it => (
        <Col key={it.title} xs={12} sm={6} md={3}>
          <Card size="small" style={{ textAlign: "center", background: "#fafafa" }}>
            <Statistic
              title={<span style={{ fontSize: 11 }}>{it.title}</span>}
              value={it.value}
              suffix={it.suffix}
              precision={1}
              valueStyle={{ fontSize: 14, fontWeight: 700 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ─── メインコンポーネント ────────────────────────────────────

interface KimukeitaiProps {
  value?: Dayjs;
}

export default function Kimukeitai({ value }: KimukeitaiProps) {
  const [month, setMonth] = useState<Dayjs>(value ?? dayjs());

  // ── fetchで取得する state
  const [staffList, setStaffList]   = useState<StaffWork[]>([]);
  const [summaryMap, setSummaryMap] = useState<Record<string, ApiMonthlySummary>>({});
  const [loading, setLoading]       = useState(false);

  const year  = month.year();
  const mon   = month.month() + 1; // 1-based
  const start = month.startOf("month");
  const days  = month.daysInMonth();

  // 初回のみ：職員一覧を取得
useEffect(() => {
  fetch(apiUrl("/api/staff"))
    .then(res => res.json())
    .then((list: StaffWork[]) =>
      setStaffList(list) // ← filterを削除
    )
    .catch(err => console.error("職員一覧fetch失敗:", err));
}, []);

  // 月が変わるたびに：月次サマリーを取得
  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/api/calc/${year}/${mon}`))
      .then(res => res.json())
      .then((data: { summaries: ApiMonthlySummary[] }) => {
        const map: Record<string, ApiMonthlySummary> = {};
        for (const s of data.summaries) map[s.staffId] = s;
        setSummaryMap(map);
      })
      .catch(err => console.error("サマリーfetch失敗:", err))
      .finally(() => setLoading(false));
  }, [year, mon]); // ← monthが変わったら自動で再fetch

  // ─── 固定列 ───────────────────────────────────────────────

  const fixedCols: ColumnsType<StaffWork> = [
    {
      title: "職員名", dataIndex: "name", key: "name",
      width: 100, fixed: "left", align: "center",
      render: v => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    // ── 集計列（summaryMapから参照）
    {
      title: "労働日数", key: "workingDays",
      width: 70, fixed: "left", align: "center",
      render: (_, r) => (
        <Badge count={summaryMap[r.staffId]?.workingDays ?? 0} color="#1677ff" />
      ),
    },
    {
      title: "労働時間(h)", key: "workingHours",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => `${summaryMap[r.staffId]?.workingHours ?? 0}h`,
    },
    {
      title: "深夜(h)", key: "nightHours",
      width: 70, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.nightHours ?? 0;
        return v > 0 ? <Tag color="purple">{v}h</Tag> : <span style={{ color: "#ccc" }}>0h</span>;
      },
    },
    {
      title: "早朝夜間(h)", key: "meHours",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.morningEveningHours ?? 0;
        return v > 0 ? <Tag color="orange">{v}h</Tag> : <span style={{ color: "#ccc" }}>0h</span>;
      },
    },
    {
      title: "介護時間(h)", key: "careHours",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => {
        const s = summaryMap[r.staffId];
        if (!s) return "-";
        return (
          <Tooltip title={`介護率: ${s.careRatio}%`}>
            <Tag color="green">{s.careHours}h</Tag>
          </Tooltip>
        );
      },
    },
{
  title: "研修時間(h)", key: "trainingHours",
  width: 80, fixed: "left", align: "center",
  render: (_, r) => {
    const v = summaryMap[r.staffId]?.trainingHours ?? 0;
    return v > 0
      ? <Tag color="blue">{v}h</Tag>
      : <span style={{ color: "#ccc" }}>0h</span>;
  },
},
{
  title: "移動時間(h)", key: "travelHours",
  width: 80, fixed: "left", align: "center",
  render: (_, r) => {
      const v = summaryMap[r.staffId]?.travelHours ?? 0;
  return v > 0 ? <Tag color="green">{v}h</Tag> : <span style={{ color: "#ccc" }}>0h</span>;
  },
},
  ];

  // ─── 日付列（月初〜月末） ──────────────────────────────────

  const dateCols: ColumnsType<StaffWork> = [...Array(days)].map((_, i) => {
    const day     = start.add(i, "day");
    const dateStr = day.format("YYYY-MM-DD");
    const dow     = day.day();
    const isHol   = dow === 0;
    const isSat   = dow === 6;

    return {
      title: (
        <span style={{ color: isHol ? "#f5222d" : isSat ? "#1677ff" : undefined, fontSize: 11 }}>
          {day.format("D")}<br />
          <span style={{ fontSize: 10 }}>({day.format("ddd")})</span>
        </span>
      ),
      key: dateStr,
      width: 70,
      align: "center" as const,
      onHeaderCell: () => ({
        style: {
          background: isHol ? "#fff1f0" : isSat ? "#f0f5ff" : undefined,
          padding: "4px 2px",
        },
      }),
      render: (_: unknown, record: StaffWork) => {
        const detail = record.details?.[dateStr];
        if (!detail) return <span style={{ color: "#e8e8e8" }}>—</span>;

        const bd     = calcShift(detail);
        const startT = dayjs(detail.start).format("HH:mm");
        const endT   = dayjs(detail.end).format("HH:mm");

        return (
          <Tooltip
            title={
              <div style={{ fontSize: 12, lineHeight: "1.8" }}>
                <div>👤 {detail.user}</div>
                <div>🕐 {startT}〜{endT}</div>
                <div>📋 {detail.type}</div>
                <div>⏱ 労働: {(bd.workMin / 60).toFixed(1)}h</div>
                {bd.nightMin > 0 && <div>🌙 深夜: {(bd.nightMin / 60).toFixed(1)}h</div>}
                {bd.meMin    > 0 && <div>🌅 早朝夜間: {(bd.meMin / 60).toFixed(1)}h</div>}
                {bd.careMin  > 0 && <div>🩺 介護: {(bd.careMin / 60).toFixed(1)}h</div>}
              </div>
            }
          >
            <div style={{ padding: 2, borderRadius: 4, background: "#f9f9f9", cursor: "pointer", lineHeight: 1.4 }}>
              <Tag color={typeColor(detail.type)} style={{ fontSize: 10, margin: 0, padding: "0 3px" }}>
                {detail.type}
              </Tag>
              <div style={{ fontSize: 10, color: "#555" }}>{startT}</div>
              <div style={{ fontSize: 10, color: "#555" }}>〜{endT}</div>
            </div>
          </Tooltip>
        );
      },
    };
  });

  const columns: ColumnsType<StaffWork> = [...fixedCols, ...dateCols];

  // 全スタッフ合計（summaryMapから集計）
const totals = useMemo(() => {
  const list = Object.values(summaryMap);
  return {
    workingDays:   list.reduce((s, r) => s + r.workingDays,   0),
    workingHours:  list.reduce((s, r) => s + r.workingHours,  0),
    careHours:     list.reduce((s, r) => s + r.careHours,     0),
    trainingHours: list.reduce((s, r) => s + r.trainingHours, 0),
    travelHours: list.reduce((s, r) => s + r.travelHours, 0),
  };
}, [summaryMap]);

  // ─── レンダリング ────────────────────────────────────────

  return (
    <div style={{ padding: 16 }}>
      {/* ヘッダー */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>
            勤務形態表　{month.format("YYYY年M月")}
          </Typography.Title>
        </Col>
        <Col>
          <DatePicker
            picker="month"
            value={month}
            onChange={v => v && setMonth(v)}
            format="YYYY年M月"
            allowClear={false}
          />
        </Col>
      </Row>

      {/* 全体サマリーカード */}
      <Card size="small" title="月次サマリー（全スタッフ合計）" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {[
            { label: "総労働日数",  value: totals.workingDays,       suffix: "日" },
            { label: "総労働時間",  value: totals.workingHours,      suffix: "h"  },
            { label: "総介護時間",  value: totals.careHours,         suffix: "h"  },
            { label: "総研修時間", value: totals.trainingHours, suffix: "h"  },
            { label: "総移動時間", value: totals.travelHours, suffix: "h" },
          ].map(it => (
            <Col key={it.label} xs={12} sm={8} md={4}>
              <Statistic title={it.label} value={it.value} suffix={it.suffix} precision={1} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* メインテーブル */}
      <Spin spinning={loading}>
        <Table<StaffWork>
          columns={columns}
          dataSource={staffList}
          rowKey="staffId"
          bordered
          size="small"
          scroll={{ x: "max-content", y: 600 }}
          pagination={false}
          rowClassName={(_, idx) => idx % 2 === 0 ? "row-even" : "row-odd"}
          expandable={{
            expandedRowRender: record => (
              <SummaryCards summary={summaryMap[record.staffId]} />
            ),
            rowExpandable: () => true,
          }}
        />
      </Spin>

      <style>{`
        .row-even { background: #ffffff; }
        .row-odd  { background: #fafafa; }
        .ant-table-cell { vertical-align: top !important; }
      `}</style>
    </div>
  );
}