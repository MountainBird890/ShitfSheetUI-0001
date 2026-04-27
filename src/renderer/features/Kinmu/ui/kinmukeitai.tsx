/**
 * kimukeitai.tsx
 * 介護業 勤務形態表
 * - 月初〜月末の日付列を生成
 * - 労働日数 / 労働時間 / 深夜時間 / 早朝夜間時間 /
 *   研修手当 / 移動手当 / 介護時間・介護率 を表示
 */

import { useMemo, useState } from "react";
import { Table, Tag, DatePicker, Tooltip, Badge, Statistic, Card, Row, Col, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import isBetween from "dayjs/plugin/isBetween";

dayjs.locale("ja");
dayjs.extend(isBetween);

// ─── 型定義 ─────────────────────────────────────────────────

interface ScheduleDetail {
  user:  string;
  start: string;
  end:   string;
  type:  string;
}

interface StaffWork {
  staffId:           string;
  name:              string;
  position?:         string;
  "employment-type"?: string;
  qualifications?:   string;
  "work-place"?:     string;
  days:  { workingDays: number; paidLeaveDays: number };
  hours: {
    workingHours: number; nightHours: number;
    morningEveningHours: number; overtimeHours: number;
    emergencyPrevHours: number; emergencySameDayHours: number;
    careTrainingHours: number;
  };
  counts:  { travelCount: number };
  amounts: {
    drivingAllowance: number; specialAllowance1: number; specialAllowance2: number;
    trainingAllowance: number; bathingAllowance: number; excretionAllowance: number;
    lodgingAllowance: number; longStayAllowance: number; commutingAllowance: number;
    businessTripDay: number; businessTripStay: number; yearEndAllowance: number;
    specialBonus: number;
  };
  details?: Record<string, ScheduleDetail>;
}

// ─── 手当単価 ────────────────────────────────────────────────

const RATES = { trainingPerHour: 500, travelPerCount: 200 } as const;

// 介護種別キーワード
const CARE_TYPES = ["身体", "生活", "外出支援", "入浴", "排泄", "見守り", "身体介護"];

// 種別 → Antd Tag カラー
const TYPE_COLOR: Record<string, string> = {
  身体介護: "red", 身体: "volcano", 生活: "orange",
  外出支援: "gold", 見守り: "green", 入浴: "cyan",
  排泄: "purple", 研修: "blue",
};
const typeColor = (t: string) =>
  Object.entries(TYPE_COLOR).find(([k]) => t.includes(k))?.[1] ?? "default";

// ─── 計算ユーティリティ ──────────────────────────────────────

function toMin(dateTimeStr: string) {
  const d = new Date(dateTimeStr);
  return d.getHours() * 60 + d.getMinutes();
}
function overlap(aS: number, aE: number, bS: number, bE: number) {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

interface ShiftBD {
  workMin: number; nightMin: number; meMin: number; careMin: number;
}

function calcShift(d: ScheduleDetail): ShiftBD {
  const s = toMin(d.start);
  const e = toMin(d.end);
  const adjE = e <= s ? e + 1440 : e;
  const workMin = adjE - s;

  // 深夜 22:00〜翌5:00
  const nightMin =
    overlap(s, adjE,    0,   300) +   // 00:00-05:00
    overlap(s, adjE, 1320, 1440) +   // 22:00-24:00
    overlap(s, adjE, 1440, 1740);    // 翌00:00-翌05:00

  // 早朝・夜間 05:00-08:00 / 18:00-22:00
  const meMin =
    overlap(s, adjE,  300,  480) +   // 05:00-08:00
    overlap(s, adjE, 1080, 1320);    // 18:00-22:00

  const careMin = CARE_TYPES.some(k => d.type.includes(k)) ? workMin : 0;
  return { workMin, nightMin, meMin, careMin };
}

interface MonthlySummary {
  workingDays:  number;
  workingHours: number;
  nightHours:   number;
  meHours:      number;
  careHours:    number;
  careRatio:    number;
  trainingAllowance: number;
  travelAllowance:   number;
}

function calcSummary(staff: StaffWork, year: number, month: number): MonthlySummary {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const entries = Object.entries(staff.details ?? {}).filter(([k]) => k.startsWith(prefix));

  let wm = 0, nm = 0, mm = 0, cm = 0;
  const days = new Set<string>();
  for (const [date, d] of entries) {
    const bd = calcShift(d);
    wm += bd.workMin; nm += bd.nightMin; mm += bd.meMin; cm += bd.careMin;
    days.add(date);
  }

  const toH = (m: number) => Math.round(m / 6) / 10; // ÷60, 小数1桁
  const wH  = toH(wm);
  return {
    workingDays:  days.size || staff.days.workingDays,
    workingHours: wH,
    nightHours:   toH(nm),
    meHours:      toH(mm),
    careHours:    toH(cm),
    careRatio:    wH > 0 ? Math.round((toH(cm) / wH) * 1000) / 10 : 0,
    trainingAllowance: staff.hours.careTrainingHours * RATES.trainingPerHour,
    travelAllowance:   staff.counts.travelCount       * RATES.travelPerCount,
  };
}

// ─── サマリーカード ──────────────────────────────────────────

interface SummaryCardsProps { staff: StaffWork; year: number; month: number }

function SummaryCards({ staff, year, month }: SummaryCardsProps) {
  const s = useMemo(() => calcSummary(staff, year, month), [staff, year, month]);
  const items = [
    { title: "労働日数",       value: s.workingDays,       suffix: "日" },
    { title: "労働時間",       value: s.workingHours,      suffix: "h" },
    { title: "深夜時間",       value: s.nightHours,        suffix: "h" },
    { title: "早朝・夜間時間", value: s.meHours,           suffix: "h" },
    { title: "介護時間",       value: s.careHours,         suffix: "h" },
    { title: "介護率",         value: s.careRatio,         suffix: "%" },
    { title: "研修手当",       value: s.trainingAllowance, suffix: "円", prefix: "¥" },
    { title: "移動手当",       value: s.travelAllowance,   suffix: "円", prefix: "¥" },
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

// ─── メイン コンポーネント ───────────────────────────────────

interface KimukeitaiProps {
  /** 表示月（Dayjs）。省略時は今月 */
  value?: Dayjs;
}

// サンプルデータ（実際は props / API から受け取る想定）
import data from "../../../../backend/data/users/base.json";

export default function Kimukeitai({ value }: KimukeitaiProps) {
  const [month, setMonth] = useState<Dayjs>(value ?? dayjs());

  const year  = month.year();
  const mon   = month.month() + 1; // 1-based
  const start = month.startOf("month");
  const days  = month.daysInMonth();

  // employment-type B or D のみ
  const staffList = useMemo(
    () => (data.basedata as unknown as StaffWork[]).filter(
      s => s["employment-type"] === "B" || s["employment-type"] === "D"
    ),
    []
  );

  // 月別サマリーをメモ化
  const summaryMap = useMemo(() => {
    const m: Record<string, MonthlySummary> = {};
    for (const s of staffList) m[s.staffId] = calcSummary(s, year, mon);
    return m;
  }, [staffList, year, mon]);

  // ─── 列定義 ─────────────────────────────────────────────

  const fixedCols: ColumnsType<StaffWork> = [
    {
      title: "職種", dataIndex: "position", key: "position",
      width: 90, fixed: "left", align: "center",
      render: v => <span style={{ fontSize: 12 }}>{v ?? "-"}</span>,
    },
    {
      title: "勤務形態", dataIndex: "employment-type", key: "emp",
      width: 80, fixed: "left", align: "center",
      render: v => <Tag color="blue" style={{ fontSize: 11 }}>{v ?? "-"}</Tag>,
    },
    {
      title: "資格", dataIndex: "qualifications", key: "qual",
      width: 100, fixed: "left", align: "center",
      render: v => <span style={{ fontSize: 12 }}>{v ?? "-"}</span>,
    },
    {
      title: "兼務先", key: "workplace",
      width: 130, fixed: "left", align: "center",
      render: (_, r) =>
        r["employment-type"] === "B" || r["employment-type"] === "D"
          ? <span style={{ fontSize: 11 }}>{r["work-place"] ?? "-"}</span>
          : "-",
    },
    {
      title: "職員名", dataIndex: "name", key: "name",
      width: 100, fixed: "left", align: "center",
      render: v => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    // 集計列
    {
      title: "労働日数", key: "workingDays",
      width: 70, fixed: "left", align: "center",
      render: (_, r) => <Badge count={summaryMap[r.staffId]?.workingDays ?? "-"} color="#1677ff" />,
    },
    {
      title: "労働時間(h)", key: "workingHours",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => (summaryMap[r.staffId]?.workingHours ?? "-") + "h",
    },
    {
      title: "深夜(h)", key: "nightHours",
      width: 70, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.nightHours ?? 0;
        return v > 0
          ? <Tag color="purple">{v}h</Tag>
          : <span style={{ color: "#ccc" }}>0h</span>;
      },
    },
    {
      title: "早朝夜間(h)", key: "meHours",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.meHours ?? 0;
        return v > 0
          ? <Tag color="orange">{v}h</Tag>
          : <span style={{ color: "#ccc" }}>0h</span>;
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
      title: "研修手当", key: "trainingAllowance",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.trainingAllowance ?? 0;
        return v > 0
          ? <span style={{ color: "#1677ff", fontWeight: 600 }}>¥{v.toLocaleString()}</span>
          : "-";
      },
    },
    {
      title: "移動手当", key: "travelAllowance",
      width: 80, fixed: "left", align: "center",
      render: (_, r) => {
        const v = summaryMap[r.staffId]?.travelAllowance ?? 0;
        return v > 0
          ? <span style={{ color: "#52c41a", fontWeight: 600 }}>¥{v.toLocaleString()}</span>
          : "-";
      },
    },
  ];

  // 日付列（月初〜月末）
  const dateCols: ColumnsType<StaffWork> = [...Array(days)].map((_, i) => {
    const day    = start.add(i, "day");
    const dateStr = day.format("YYYY-MM-DD");
    const dow    = day.day(); // 0=日, 6=土
    const isHol  = dow === 0;
    const isSat  = dow === 6;

    return {
      title: (
        <span style={{
          color: isHol ? "#f5222d" : isSat ? "#1677ff" : undefined,
          fontSize: 11,
        }}>
          {day.format("D")}
          <br />
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

        const bd = calcShift(detail);
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
                {bd.nightMin > 0  && <div>🌙 深夜: {(bd.nightMin / 60).toFixed(1)}h</div>}
                {bd.meMin    > 0  && <div>🌅 早朝夜間: {(bd.meMin / 60).toFixed(1)}h</div>}
                {bd.careMin  > 0  && <div>🩺 介護: {(bd.careMin / 60).toFixed(1)}h</div>}
              </div>
            }
          >
            <div style={{
              padding: "2px",
              borderRadius: 4,
              background: "#f9f9f9",
              cursor: "pointer",
              lineHeight: "1.4",
            }}>
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

      {/* 全体サマリーカード（全スタッフの合計） */}
      <Card size="small" title="月次サマリー（全スタッフ合計）" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {[
            { label: "総労働日数",    value: staffList.reduce((s, r) => s + (summaryMap[r.staffId]?.workingDays ?? 0), 0), suffix: "日" },
            { label: "総労働時間",    value: staffList.reduce((s, r) => s + (summaryMap[r.staffId]?.workingHours ?? 0), 0), suffix: "h" },
            { label: "総介護時間",    value: staffList.reduce((s, r) => s + (summaryMap[r.staffId]?.careHours ?? 0), 0), suffix: "h" },
            { label: "総研修手当",    value: staffList.reduce((s, r) => s + (summaryMap[r.staffId]?.trainingAllowance ?? 0), 0), suffix: "円" },
            { label: "総移動手当",    value: staffList.reduce((s, r) => s + (summaryMap[r.staffId]?.travelAllowance ?? 0), 0), suffix: "円" },
          ].map(it => (
            <Col key={it.label} xs={12} sm={8} md={4}>
              <Statistic title={it.label} value={it.value} suffix={it.suffix} precision={1} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* メインテーブル */}
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
            <SummaryCards staff={record} year={year} month={mon} />
          ),
          rowExpandable: () => true,
        }}
      />

      <style>{`
        .row-even { background: #ffffff; }
        .row-odd  { background: #fafafa; }
        .ant-table-cell { vertical-align: top !important; }
      `}</style>
    </div>
  );
}