import Fastify from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---- Schemas (TypeBox) ------------------------------------------

const ScheduleEntrySchema = Type.Object({
  user: Type.String({ minLength: 1 }),
  start: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  end: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  type: Type.String({ minLength: 1 }),
});

const UpdateScheduleBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  entry: ScheduleEntrySchema,
});

type UpdateScheduleBody = Static<typeof UpdateScheduleBodySchema>;

// ---- Data file path ---------------------------------------------

const DATA_PATH = process.env.NODE_ENV === "production"
  ? path.join(process.env.RESOURCES_PATH ?? "", "src/backend/data/users/base.json")
  : path.resolve(process.cwd(), "src/backend/data/users/base.json");

async function readData(): Promise<{ basedata: Record<string, unknown>[] }> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: { basedata: Record<string, unknown>[] }): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ================================================================
// ---- 介護計算ロジック ------------------------------------------
// ================================================================

interface ScheduleDetail {
  user:  string;
  start: string;
  end:   string;
  type:  string;
}

interface StaffWork {
  staffId:            string;
  name:               string;
  days:   { workingDays: number; paidLeaveDays: number };
  hours:  {
    workingHours: number; nightHours: number;
    morningEveningHours: number; overtimeHours: number;
    emergencyPrevHours: number; emergencySameDayHours: number;
    careTrainingHours: number;
  };
  counts:  { travelCount: number };
  amounts: Record<string, number>;
  details?: Record<string, ScheduleDetail>;
}

// 手当単価
const RATES = {
  trainingPerHour: 500, // 研修手当：1時間あたり 500円
  travelPerCount:  200, // 移動手当：1回あたり   200円
} as const;

// 介護種別キーワード
const CARE_TYPES = ["身体", "生活", "外出支援", "入浴", "排泄", "見守り", "身体介護"];

/** 2区間の重なり（分） */
function overlap(aS: number, aE: number, bS: number, bE: number) {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

/** "YYYY-MM-DDTHH:mm" → その日の00:00からの分数 */
function toMin(dateTimeStr: string) {
  const d = new Date(dateTimeStr);
  return d.getHours() * 60 + d.getMinutes();
}

interface ShiftBreakdown {
  workMin: number;
  nightMin: number;
  meMin: number;
  careMin: number;
}

function calcShift(detail: ScheduleDetail): ShiftBreakdown {
  const s    = toMin(detail.start);
  const e    = toMin(detail.end);
  const adjE = e <= s ? e + 1440 : e; // 日跨ぎ補正

  const workMin = adjE - s;

  // 深夜：22:00〜翌05:00
  const nightMin =
    overlap(s, adjE,    0,   300) +  // 00:00〜05:00
    overlap(s, adjE, 1320, 1440) +  // 22:00〜24:00
    overlap(s, adjE, 1440, 1740);   // 翌00:00〜翌05:00（日跨ぎ用）

  // 早朝・夜間：05:00〜08:00 / 18:00〜22:00
  const meMin =
    overlap(s, adjE,  300,  480) +  // 05:00〜08:00
    overlap(s, adjE, 1080, 1320);   // 18:00〜22:00

  const careMin = CARE_TYPES.some(k => detail.type.includes(k)) ? workMin : 0;

  return { workMin, nightMin, meMin, careMin };
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
  trainingAllowance:   number;
  travelAllowance:     number;
  dailyBreakdown: Record<string, {
    user:    string;
    type:    string;
    workMin: number;
    nightMin: number;
    meMin:   number;
    careMin: number;
  }>;
}

function calcMonthlySummary(staff: StaffWork, year: number, month: number): MonthlySummary {
  const prefix  = `${year}-${String(month).padStart(2, "0")}`;
  const entries = Object.entries(staff.details ?? {}).filter(([k]) => k.startsWith(prefix));

  let wm = 0, nm = 0, mm = 0, cm = 0;
  const days = new Set<string>();
  const dailyBreakdown: MonthlySummary["dailyBreakdown"] = {};

  for (const [date, detail] of entries) {
    const bd = calcShift(detail);
    wm += bd.workMin; nm += bd.nightMin; mm += bd.meMin; cm += bd.careMin;
    days.add(date);
    dailyBreakdown[date] = {
      user: detail.user, type: detail.type,
      workMin: bd.workMin, nightMin: bd.nightMin,
      meMin: bd.meMin, careMin: bd.careMin,
    };
  }

  const toH = (m: number) => Math.round(m / 6) / 10; // ÷60, 小数1桁
  const wH  = toH(wm);

  return {
    staffId:             staff.staffId,
    name:                staff.name,
    workingDays:         days.size || staff.days.workingDays,
    workingHours:        wH,
    nightHours:          toH(nm),
    morningEveningHours: toH(mm),
    careHours:           toH(cm),
    careRatio:           wH > 0 ? Math.round((toH(cm) / wH) * 1000) / 10 : 0,
    trainingAllowance:   staff.hours.careTrainingHours * RATES.trainingPerHour,
    travelAllowance:     staff.counts.travelCount       * RATES.travelPerCount,
    dailyBreakdown,
  };
}

// ================================================================
// ---- Fastify サーバー ------------------------------------------
// ================================================================

const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

// CORS for Vite dev server
server.addHook("onRequest", async (request, reply) => {
  reply.header("Access-Control-Allow-Origin", "http://localhost:5173");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") {
    reply.status(204).send();
  }
});

// ---- 既存ルート ------------------------------------------------

// GET /api/staff  — 全職員データ取得
server.get("/api/staff", async (_req, reply) => {
  const data = await readData();
  return reply.send(data.basedata);
});

// GET /api/staff/:staffId  — 単一職員データ取得
server.get<{ Params: { staffId: string } }>(
  "/api/staff/:staffId",
  async (request, reply) => {
    const data = await readData();
    const staff = data.basedata.find(
      (s) => (s as Record<string, unknown>).staffId === request.params.staffId
    );
    if (!staff) return reply.status(404).send({ message: "Staff not found" });
    return reply.send(staff);
  }
);

// PUT /api/staff/:staffId/schedule/:dateKey  — スケジュール更新
server.put<{
  Params: { staffId: string; dateKey: string };
  Body: UpdateScheduleBody;
}>(
  "/api/staff/:staffId/schedule/:dateKey",
  { schema: { body: UpdateScheduleBodySchema } },
  async (request, reply) => {
    const { staffId, dateKey } = request.params;
    const { name, entry } = request.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return reply.status(400).send({ message: "Invalid dateKey format" });
    }

    const data = await readData();
    const idx  = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    (data.basedata[idx] as Record<string, unknown>).name    = name;
    (data.basedata[idx] as Record<string, unknown>)[dateKey] = entry;
    await writeData(data);

    return reply.send({ staffId, dateKey, updated: entry });
  }
);

// POST /api/download/csv  — CSVダウンロード
const CsvBodySchema = Type.Array(Type.Object({
  staffId: Type.String(),
  name:    Type.String(),
  date:    Type.String(),
  type:    Type.String(),
}));

server.post("/api/download/csv", {
  schema: { body: CsvBodySchema },
}, async (request, reply) => {
  const body: unknown = request.body;
  const rows = body as any;
  const csv  = [
    "staffId,name,date,type",
    ...rows.map((r: any) => `"${r.staffId}","${r.name}","${r.date}","${r.type}"`),
  ].join("\n");

  reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="schedule.csv"`)
    .send("\uFEFF" + csv);
});

// ---- 介護計算ルート --------------------------------------------

const CalcParamsSchema = Type.Object({
  year:  Type.String({ pattern: "^\\d{4}$" }),
  month: Type.String({ pattern: "^([1-9]|1[0-2])$" }),
});

// GET /api/calc/:year/:month  — 全スタッフの月次サマリー
server.get<{ Params: Static<typeof CalcParamsSchema> }>(
  "/api/calc/:year/:month",
  { schema: { params: CalcParamsSchema } },
  async (request, reply) => {
    const year  = parseInt(request.params.year,  10);
    const month = parseInt(request.params.month, 10);

    const data     = await readData();
    const summaries = (data.basedata as unknown as StaffWork[]).map(
      s => calcMonthlySummary(s, year, month)
    );

    return reply.send({ year, month, summaries });
  }
);

// GET /api/calc/:year/:month/:staffId  — 特定スタッフの月次サマリー
server.get<{ Params: Static<typeof CalcParamsSchema> & { staffId: string } }>(
  "/api/calc/:year/:month/:staffId",
  { schema: { params: Type.Intersect([CalcParamsSchema, Type.Object({ staffId: Type.String() })]) } },
  async (request, reply) => {
    const { year: y, month: m, staffId } = request.params;
    const year  = parseInt(y, 10);
    const month = parseInt(m, 10);

    const data  = await readData();
    const staff = (data.basedata as unknown as StaffWork[]).find(s => s.staffId === staffId);
    if (!staff) return reply.status(404).send({ message: "Staff not found" });

    return reply.send(calcMonthlySummary(staff, year, month));
  }
);

// ---- Start ------------------------------------------------------

server.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});