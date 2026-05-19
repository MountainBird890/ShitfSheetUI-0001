export interface ScheduleDetail {
  user:  string;
  start: string;
  end:   string;
  type:  string;
}

export interface StaffWork {
  staffId:            string;
  name:               string;
  days:   { workingDays: number; paidLeaveDays: number };
  hours:  {
    workingHours:          number;
    nightHours:            number;
    morningEveningHours:   number;
    overtimeHours:         number;
    emergencyPrevHours:    number;
    emergencySameDayHours: number;
    careTrainingHours:     number;
    officeWorkHours:       number;
  };
  counts:  { travelCount: number };
  amounts: Record<string, number>;
  details?: Record<string, Record<string, string>>; // user-2等のサフィックス対応
}

export interface MonthlySummary {
  staffId:             string;
  name:                string;
  workingDays:         number;
  workingHours:        number;
  nightHours:          number;
  morningEveningHours: number;
  careHours:           number;
  careRatio:           number;
  trainingHours:       number;
  officeWorkHours:     number;
  travelHours:         number; // ← 移動回数→移動時間に変更
  dailyBreakdown: Record<string, {
    user:      string;
    type:      string;
    workMin:   number;
    nightMin:  number;
    meMin:     number;
    careMin:   number;
    travelMin: number; // ← 追加
  }>;
}

const CARE_TYPES = ["身体", "生活", "外出支援", "入浴", "排泄", "見守り", "身体介護"];

function toMin(dateTimeStr: string): number {
  const d = new Date(dateTimeStr);
  return d.getHours() * 60 + d.getMinutes();
}

function overlap(aS: number, aE: number, bS: number, bE: number): number {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

function toH(min: number): number {
  return Math.round(min / 6) / 10;
}

interface ShiftBreakdown {
  workMin:  number;
  nightMin: number;
  meMin:    number;
  careMin:  number;
}

export function calcShift(detail: ScheduleDetail): ShiftBreakdown {
  const s    = toMin(detail.start);
  const e    = toMin(detail.end);
  const adjE = e <= s ? e + 1440 : e;
  const workMin  = adjE - s;
  const nightMin =
    overlap(s, adjE,    0,   300) +
    overlap(s, adjE, 1320, 1440) +
    overlap(s, adjE, 1440, 1740);
  const meMin =
    overlap(s, adjE,  300,  480) +
    overlap(s, adjE, 1080, 1320);
  const careMin = CARE_TYPES.some(k => detail.type.includes(k)) ? workMin : 0;
  return { workMin, nightMin, meMin, careMin };
}

// ─── 同日の複数予定を番号サフィックスから抽出してソート ──────

interface RawEntry {
  start: string;
  end:   string;
  user:  string;
  type:  string;
}

function extractEntries(
  details: Record<string, Record<string, string>>,
  dateKey: string  // "2026-05-05" 形式
): RawEntry[] {
  return Object.entries(details)
    .filter(([k]) => k.startsWith(dateKey))
    .map(([, entry]) => ({
      start: entry.start ?? "",
      end:   entry.end   ?? "",
      user:  entry.user  ?? "",
      type:  entry.type  ?? "",
    }))
    .filter(e => e.start && e.end)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

// ─── 同日複数予定間の移動時間を計算 ─────────────────────────

function calcTravelMin(entries: RawEntry[]): number {
  if (entries.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < entries.length - 1; i++) {
    const endMin   = toMin(entries[i].end);
    const startMin = toMin(entries[i + 1].start);
    // 次の予定の開始 - 前の予定の終了 = 移動時間（負にはならない）
    const gap = startMin - endMin;
    if (gap > 0) total += gap;
  }
  return total;
}

// ─── 月次サマリー計算 ────────────────────────────────────────

export function calcMonthlySummary(
  staff: StaffWork,
  year: number,
  month: number
): MonthlySummary {
  const prefix  = `${year}-${String(month).padStart(2, "0")}`;
  const dateDays = [...new Set(
  Object.keys(staff.details ?? {})
    .filter(k => k.startsWith(prefix))
    .map(k => k.slice(0, 10))
)];

  let wm = 0, nm = 0, mm = 0, cm = 0, tvm = 0;
  const days = new Set<string>();
  const dailyBreakdown: MonthlySummary["dailyBreakdown"] = {};

for (const date of dateDays) {
  const rawEntries = extractEntries(staff.details ?? {}, date);
    const travelMin  = calcTravelMin(rawEntries);
    tvm += travelMin;

    // 全エントリの合算
    let dayWm = 0, dayNm = 0, dayMm = 0, dayCm = 0;
    for (const raw of rawEntries) {
      const bd = calcShift({ user: raw.user, start: raw.start, end: raw.end, type: raw.type });
      dayWm += bd.workMin;
      dayNm += bd.nightMin;
      dayMm += bd.meMin;
      dayCm += bd.careMin;
    }
    wm += dayWm; nm += dayNm; mm += dayMm; cm += dayCm;
    days.add(date);

    dailyBreakdown[date] = {
      user:      rawEntries[0]?.user ?? "",
      type:      rawEntries[0]?.type ?? "",
      workMin:   dayWm,
      nightMin:  dayNm,
      meMin:     dayMm,
      careMin:   dayCm,
      travelMin, // ← 予定間の移動時間
    };
  }

  const wH = toH(wm);

  return {
    staffId:             staff.staffId,
    name:                staff.name,
    workingDays:         days.size || staff.days.workingDays,
    workingHours:        toH(wm), // 介護時間＋内勤＋研修時間の合算
    nightHours:          toH(nm),
    morningEveningHours: toH(mm),
    careHours:           toH(wm) - (staff.hours.officeWorkHours ?? 0) - staff.hours.careTrainingHours, // 介護時間オンリー
    careRatio:           wH > 0 ? Math.round((toH(cm) / wH) * 1000) / 10 : 0,
    trainingHours:       staff.hours.careTrainingHours,
    officeWorkHours:     staff.hours.officeWorkHours ?? 0,  
    travelHours:         toH(tvm), // ← 移動時間（時間換算）
    dailyBreakdown,
  };
}