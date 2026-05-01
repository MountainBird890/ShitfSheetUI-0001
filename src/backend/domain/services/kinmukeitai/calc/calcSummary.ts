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

function extractEntries(dayRecord: Record<string, string>): RawEntry[] {
  // サフィックスなし（1件目）を取得
  const base: RawEntry[] = [];
  if (dayRecord.start && dayRecord.end) {
    base.push({
      start: dayRecord.start,
      end:   dayRecord.end,
      user:  dayRecord.user  ?? "",
      type:  dayRecord.type  ?? "",
    });
  }

  // -2, -3, -4... のサフィックス付きを収集
  const nums = Object.keys(dayRecord)
    .map(k => { const m = k.match(/^start-(\d+)$/); return m ? parseInt(m[1]) : null; })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  for (const n of nums) {
    const s = dayRecord[`start-${n}`];
    const e = dayRecord[`end-${n}`];
    if (s && e) {
      base.push({
        start: s,
        end:   e,
        user:  dayRecord[`user-${n}`]  ?? "",
        type:  dayRecord[`type-${n}`]  ?? "",
      });
    }
  }

  // 開始時刻でソート（移動時間計算のため）
  return base.sort((a, b) => toMin(a.start) - toMin(b.start));
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
  const entries = Object.entries(staff.details ?? {}).filter(([k]) => k.startsWith(prefix));

  let wm = 0, nm = 0, mm = 0, cm = 0, tvm = 0;
  const days = new Set<string>();
  const dailyBreakdown: MonthlySummary["dailyBreakdown"] = {};

  for (const [date, dayRecord] of entries) {
    const rawEntries = extractEntries(dayRecord as Record<string, string>);
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
    workingHours:        wH,
    nightHours:          toH(nm),
    morningEveningHours: toH(mm),
    careHours:           toH(cm),
    careRatio:           wH > 0 ? Math.round((toH(cm) / wH) * 1000) / 10 : 0,
    trainingHours:       staff.hours.careTrainingHours,
    travelHours:         toH(tvm), // ← 移動時間（時間換算）
    dailyBreakdown,
  };
}