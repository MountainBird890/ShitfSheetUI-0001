/**
 * 介護業務 計算ロジック
 * - 労働日数
 * - 労働時間
 * - 深夜時間（22:00〜翌05:00）
 * - 早朝夜間時間（05:00〜08:00 / 18:00〜22:00）
 * - 研修手当（careTrainingHours × 単価）
 * - 移動手当（travelCount × 単価）
 * - 労働時間に占める介護時間
 */

import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";
import Fastify from "fastify";

// ─── スキーマ ────────────────────────────────────────────────

export const ScheduleDetailSchema = Type.Object({
  user:  Type.String(),
  start: Type.String(),
  end:   Type.String(),
  type:  Type.String(),
});

export const StaffWorkSchema = Type.Object({
  staffId:          Type.String(),
  name:             Type.String(),
  position:         Type.Optional(Type.String()),
  "employment-type": Type.Optional(Type.String()),
  qualifications:   Type.Optional(Type.String()),
  "work-place":     Type.Optional(Type.String()),

  days: Type.Object({
    workingDays:   Type.Number(),
    paidLeaveDays: Type.Number(),
  }),

  hours: Type.Object({
    workingHours:         Type.Number(),
    nightHours:           Type.Number(),
    morningEveningHours:  Type.Number(),
    overtimeHours:        Type.Number(),
    emergencyPrevHours:   Type.Number(),
    emergencySameDayHours: Type.Number(),
    careTrainingHours:    Type.Number(),
  }),

  counts: Type.Object({
    travelCount: Type.Number(),
  }),

  amounts: Type.Object({
    drivingAllowance:   Type.Number(),
    specialAllowance1:  Type.Number(),
    specialAllowance2:  Type.Number(),
    trainingAllowance:  Type.Number(),
    bathingAllowance:   Type.Number(),
    excretionAllowance: Type.Number(),
    lodgingAllowance:   Type.Number(),
    longStayAllowance:  Type.Number(),
    commutingAllowance: Type.Number(),
    businessTripDay:    Type.Number(),
    businessTripStay:   Type.Number(),
    yearEndAllowance:   Type.Number(),
    specialBonus:       Type.Number(),
  }),

  details: Type.Optional(
    Type.Record(Type.String(), ScheduleDetailSchema)
  ),
});

export type StaffWork     = Static<typeof StaffWorkSchema>;
export type ScheduleDetail = Static<typeof ScheduleDetailSchema>;

// ─── 手当単価定数 ────────────────────────────────────────────

const RATES = {
  trainingPerHour: 500,   // 研修手当：1時間あたり 500円
  travelPerCount:  200,   // 移動手当：1回あたり   200円
} as const;

// ─── 時刻ユーティリティ ─────────────────────────────────────

/** "YYYY-MM-DDTHH:mm" → その日の 00:00 からの分数 */
function toMinutes(dateTimeStr: string): number {
  const d = new Date(dateTimeStr);
  return d.getHours() * 60 + d.getMinutes();
}

/** 2つの区間 [aStart, aEnd) と [bStart, bEnd) の重なり（分） */
function overlapMinutes(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): number {
  const start = Math.max(aStart, bStart);
  const end   = Math.min(aEnd,   bEnd);
  return Math.max(0, end - start);
}

// ─── 1シフトの各種時間を計算 ────────────────────────────────

interface ShiftBreakdown {
  /** 総労働時間（分） */
  workMinutes: number;
  /** 深夜時間（22:00〜翌05:00）（分） */
  nightMinutes: number;
  /** 早朝・夜間時間（05:00〜08:00 / 18:00〜22:00）（分） */
  morningEveningMinutes: number;
  /** 介護時間（分）── 種別が介護系なら workMinutes 全体 */
  careMinutes: number;
}

// 介護系の種別キーワード
const CARE_TYPES = ["身体", "生活", "外出支援", "入浴", "排泄", "見守り", "身体介護"];

function calcShiftBreakdown(detail: ScheduleDetail): ShiftBreakdown {
  const startMin = toMinutes(detail.start);
  const endMin   = toMinutes(detail.end);

  // 日をまたぐ場合は翌日分（+1440）として扱う
  const adjEnd = endMin <= startMin ? endMin + 1440 : endMin;

  const workMinutes = adjEnd - startMin;

  // ── 深夜：22:00〜翌05:00 → 1320〜1740（翌日を+1440で正規化）
  const nightSegments: [number, number][] = [
    [0,    5 * 60],          // 00:00〜05:00
    [22 * 60, 24 * 60],      // 22:00〜24:00
    [24 * 60, 29 * 60],      // 翌00:00〜翌05:00（日跨ぎシフト用）
  ];
  const nightMinutes = nightSegments.reduce(
    (sum, [ns, ne]) => sum + overlapMinutes(startMin, adjEnd, ns, ne),
    0
  );

  // ── 早朝・夜間：05:00〜08:00 / 18:00〜22:00
  const meSegments: [number, number][] = [
    [5  * 60, 8  * 60],
    [18 * 60, 22 * 60],
  ];
  const morningEveningMinutes = meSegments.reduce(
    (sum, [ms, me]) => sum + overlapMinutes(startMin, adjEnd, ms, me),
    0
  );

  // ── 介護時間
  const isCare = CARE_TYPES.some(k => detail.type.includes(k));
  const careMinutes = isCare ? workMinutes : 0;

  return { workMinutes, nightMinutes, morningEveningMinutes, careMinutes };
}

// ─── スタッフ全体の月次集計 ─────────────────────────────────

export interface MonthlySummary {
  staffId:              string;
  name:                 string;
  /** 労働日数 */
  workingDays:          number;
  /** 総労働時間（h） */
  workingHours:         number;
  /** 深夜時間（h） */
  nightHours:           number;
  /** 早朝・夜間時間（h） */
  morningEveningHours:  number;
  /** 介護時間（h） */
  careHours:            number;
  /** 介護時間率（%）*/
  careRatio:            number;
  /** 研修手当（円） */
  trainingAllowance:    number;
  /** 移動手当（円） */
  travelAllowance:      number;
  /** 日別内訳 */
  dailyBreakdown: Record<string, {
    user:                  string;
    type:                  string;
    workMinutes:           number;
    nightMinutes:          number;
    morningEveningMinutes: number;
    careMinutes:           number;
  }>;
}

export function calcMonthlySummary(
  staff: StaffWork,
  year: number,
  month: number          // 1-based
): MonthlySummary {
  const details = staff.details ?? {};

  // 対象月のエントリだけ抽出
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthlyEntries = Object.entries(details).filter(([k]) => k.startsWith(prefix));

  let totalWorkMin    = 0;
  let totalNightMin   = 0;
  let totalMEMin      = 0;
  let totalCareMin    = 0;
  const workDaySet    = new Set<string>();
  const dailyBreakdown: MonthlySummary["dailyBreakdown"] = {};

  for (const [dateStr, detail] of monthlyEntries) {
    const bd = calcShiftBreakdown(detail);
    totalWorkMin  += bd.workMinutes;
    totalNightMin += bd.nightMinutes;
    totalMEMin    += bd.morningEveningMinutes;
    totalCareMin  += bd.careMinutes;
    workDaySet.add(dateStr);

    dailyBreakdown[dateStr] = {
      user:                  detail.user,
      type:                  detail.type,
      workMinutes:           bd.workMinutes,
      nightMinutes:          bd.nightMinutes,
      morningEveningMinutes: bd.morningEveningMinutes,
      careMinutes:           bd.careMinutes,
    };
  }

  const toH = (m: number) => Math.round((m / 60) * 10) / 10;

  // details から計算できる日数（固定値 workingDays も参照可能）
  const workingDays = workDaySet.size > 0
    ? workDaySet.size
    : staff.days.workingDays;

  const workingHours        = toH(totalWorkMin);
  const nightHours          = toH(totalNightMin);
  const morningEveningHours = toH(totalMEMin);
  const careHours           = toH(totalCareMin);
  const careRatio           = workingHours > 0
    ? Math.round((careHours / workingHours) * 1000) / 10
    : 0;

  const trainingAllowance = staff.hours.careTrainingHours * RATES.trainingPerHour;
  const travelAllowance   = staff.counts.travelCount       * RATES.travelPerCount;

  return {
    staffId: staff.staffId,
    name:    staff.name,
    workingDays,
    workingHours,
    nightHours,
    morningEveningHours,
    careHours,
    careRatio,
    trainingAllowance,
    travelAllowance,
    dailyBreakdown,
  };
}

// ─── Fastify サーバー ────────────────────────────────────────

const CalcQuerySchema = Type.Object({
  year:  Type.String(),
  month: Type.String(),
});

async function buildServer() {
  const fastify = Fastify({ logger: true });

  // GET /api/calc?year=2026&month=4
  fastify.get(
    "/api/calc",
    { schema: { querystring: CalcQuerySchema } },
    async (req, reply) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { basedata } = require("../data/users/base.json") as {
        basedata: StaffWork[];
      };

      const qs    = req.query as Static<typeof CalcQuerySchema>;
      const year  = parseInt(qs.year,  10);
      const month = parseInt(qs.month, 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return reply.status(400).send({ error: "year / month が不正です" });
      }

      const summaries = basedata.map(s => calcMonthlySummary(s, year, month));
      return reply.send({ year, month, summaries });
    }
  );

  return fastify;
}

// メインエントリ
if (require.main === module) {
  buildServer().then(f =>
    f.listen({ port: 3001, host: "0.0.0.0" }, err => {
      if (err) { f.log.error(err); process.exit(1); }
    })
  );
}

export { buildServer };