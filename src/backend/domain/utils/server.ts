import Fastify from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fs from "node:fs/promises";
import path from "node:path";
import {
  calcMonthlySummary,
  type StaffWork,
} from "../services/kinmukeitai/calc/calcSummary";
import { createReadStream } from "node:fs";

// ---- Schemas (TypeBox) ------------------------------------------

const ScheduleEntrySchema = Type.Object({
  user:  Type.String({ minLength: 1 }),
  start: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  end:   Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  type:  Type.String({ minLength: 1 }),
});

const UpdateScheduleBodySchema = Type.Object({
  name:  Type.String({ minLength: 1 }),
  entry: ScheduleEntrySchema,
});

type UpdateScheduleBody = Static<typeof UpdateScheduleBodySchema>;

// ---- Data file path ---------------------------------------------

const DATA_PATH = process.env.NODE_ENV === "production"
  ? path.join(process.env.RESOURCES_PATH ?? "", "data", "users", "base.json")
  : path.resolve(process.cwd(), "src/backend/data/users/base.json");

async function readData(): Promise<{ basedata: Record<string, unknown>[] }> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: { basedata: Record<string, unknown>[] }): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
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

// ---- 職員ルート ------------------------------------------------

// GET /api/staff
server.get("/api/staff", async (_req, reply) => {
  const data = await readData();
  return reply.send(data.basedata);
});

// GET /api/staff/:staffId
server.get<{ Params: { staffId: string } }>(
  "/api/staff/:staffId",
  async (request, reply) => {
    const data  = await readData();
    const staff = data.basedata.find(
      (s) => (s as Record<string, unknown>).staffId === request.params.staffId
    );
    if (!staff) return reply.status(404).send({ message: "Staff not found" });
    return reply.send(staff);
  }
);

// PUT /api/staff/:staffId/schedule/:dateKey
server.put<{
  Params: { staffId: string; dateKey: string };
  Body: UpdateScheduleBody;
}>(
  "/api/staff/:staffId/schedule/:dateKey",
  { schema: { body: UpdateScheduleBodySchema } },
  async (request, reply) => {
    const { staffId, dateKey } = request.params;
    const { name, entry }      = request.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return reply.status(400).send({ message: "Invalid dateKey format" });
    }

    const data = await readData();
    const idx  = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    (data.basedata[idx] as Record<string, unknown>).name     = name;
    (data.basedata[idx] as Record<string, unknown>)[dateKey] = entry;
    await writeData(data);

    return reply.send({ staffId, dateKey, updated: entry });
  }
);

// POST /api/staff — 職員新規追加
const StaffBodySchema = Type.Object({
  name:              Type.String({ minLength: 1 }),
  position:          Type.String({ minLength: 1 }),
  "employment-type": Type.String({ minLength: 1 }),
  qualifications:    Type.String(),
  "work-place":      Type.String({ minLength: 1 }),
});

server.post<{ Body: Static<typeof StaffBodySchema> }>(
  "/api/staff",
  { schema: { body: StaffBodySchema } },
  async (request, reply) => {
    const data  = await readData();
    const maxId = (data.basedata as any[]).reduce(
      (acc: number, s) => Math.max(acc, Number(s.staffId)),
      0
    );
    const newStaffId = String(maxId + 1);

    const newStaff = {
      staffId:           newStaffId,
      name:              request.body.name,
      position:          request.body.position,
      "employment-type": request.body["employment-type"],
      qualifications:    request.body.qualifications,
      "work-place":      request.body["work-place"],
      days:    { workingDays: 0, paidLeaveDays: 0 },
      hours:   {
        workingHours: 0, nightHours: 0, morningEveningHours: 0,
        overtimeHours: 0, emergencyPrevHours: 0,
        emergencySameDayHours: 0, careTrainingHours: 0,
      },
      counts:  { travelCount: 0 },
      amounts: {
        drivingAllowance: 0, specialAllowance1: 0, specialAllowance2: 0,
        trainingAllowance: 0, bathingAllowance: 0, excretionAllowance: 0,
        lodgingAllowance: 0, longStayAllowance: 0, commutingAllowance: 0,
        businessTripDay: 0, businessTripStay: 0, yearEndAllowance: 0,
        specialBonus: 0,
      },
      details: {},
    };

    data.basedata.push(newStaff as any);
    await writeData(data);
    return reply.status(201).send({ ok: true, staffId: newStaffId });
  }
);

// ---- CSVダウンロード -------------------------------------------

const CsvBodySchema = Type.Array(Type.Object({
  staffId: Type.String(),
  name:    Type.String(),
  user:    Type.Optional(Type.String()),
  date:    Type.String(),
  start:   Type.Optional(Type.String()),
  end:     Type.Optional(Type.String()),
  type:    Type.String(),
}));

server.post("/api/download/csv", {
  schema: { body: CsvBodySchema },
}, async (request, reply) => {
  const rows = request.body as any[];
  const csv  = [
    "staffId,name,user,date,start,end,type",
    ...rows.map((r: any) =>
      `"${r.staffId}","${r.name}","${r.user ?? ""}","${r.date}","${r.start ?? ""}","${r.end ?? ""}","${r.type}"`
    ),
  ].join("\n");

  reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="schedule.csv"`)
    .send("\uFEFF" + csv);
});

// ---- 介護計算ルート（calcSummary.tsに委譲） --------------------

const CalcParamsSchema = Type.Object({
  year:  Type.String({ pattern: "^\\d{4}$" }),
  month: Type.String({ pattern: "^([1-9]|1[0-2])$" }),
});

// GET /api/calc/:year/:month
server.get<{ Params: Static<typeof CalcParamsSchema> }>(
  "/api/calc/:year/:month",
  { schema: { params: CalcParamsSchema } },
  async (request, reply) => {
    const year  = parseInt(request.params.year,  10);
    const month = parseInt(request.params.month, 10);

    const data      = await readData();
    const summaries = (data.basedata as unknown as StaffWork[]).map(
      (s) => calcMonthlySummary(s, year, month)
    );
    return reply.send({ year, month, summaries });
  }
);

// GET /api/calc/:year/:month/:staffId
server.get<{ Params: Static<typeof CalcParamsSchema> & { staffId: string } }>(
  "/api/calc/:year/:month/:staffId",
  {
    schema: {
      params: Type.Intersect([
        CalcParamsSchema,
        Type.Object({ staffId: Type.String() }),
      ]),
    },
  },
  async (request, reply) => {
    const { year: y, month: m, staffId } = request.params;
    const year  = parseInt(y, 10);
    const month = parseInt(m, 10);

    const data  = await readData();
    const staff = (data.basedata as unknown as StaffWork[]).find(
      (s) => s.staffId === staffId
    );
    if (!staff) return reply.status(404).send({ message: "Staff not found" });

    return reply.send(calcMonthlySummary(staff, year, month));
  }
);

// ---- 予定新規追加 ----------------------------------------------

const AddScheduleBodySchema = Type.Object({
  staffId: Type.String({ minLength: 1 }),
  dateKey: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
  user:    Type.String({ minLength: 1 }),
  start:   Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  end:     Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  type:    Type.String({ minLength: 1 }),
});

server.post<{ Body: Static<typeof AddScheduleBodySchema> }>(
  "/api/schedule/add",
  { schema: { body: AddScheduleBodySchema } },
  async (request, reply) => {
    const { staffId, dateKey, user, start, end, type } = request.body;

    const data = await readData();
    const idx  = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    const staff    = data.basedata[idx] as Record<string, unknown>;
    const details  = (staff.details ?? {}) as Record<string, Record<string, string>>;
    const existing = details[dateKey];

    if (!existing) {
      details[dateKey] = { user, start, end, type };
    } else {
      const nums = Object.keys(existing)
        .map((k) => {
          const m = k.match(/^user(?:-(\d+))?$/);
          return m ? (m[1] ? parseInt(m[1]) : 1) : null;
        })
        .filter((n): n is number => n !== null);

      const nextNum = Math.max(...nums) + 1;
      const suffix  = `-${nextNum}`;
      existing[`user${suffix}`]  = user;
      existing[`start${suffix}`] = start;
      existing[`end${suffix}`]   = end;
      existing[`type${suffix}`]  = type;
    }

    staff.details = details;
    await writeData(data);
    return reply.status(201).send({ ok: true, staffId, dateKey });
  }
);

// ---- 月コピー --------------------------------------------------

const CopyScheduleBodySchema = Type.Object({
  fromYear:  Type.Integer({ minimum: 2000, maximum: 2100 }),
  fromMonth: Type.Integer({ minimum: 1,    maximum: 12   }),
  toYear:    Type.Integer({ minimum: 2000, maximum: 2100 }),
  toMonth:   Type.Integer({ minimum: 1,    maximum: 12   }),
});

server.post<{ Body: Static<typeof CopyScheduleBodySchema> }>(
  "/api/schedule/copy",
  { schema: { body: CopyScheduleBodySchema } },
  async (request, reply) => {
    const { fromYear, fromMonth, toYear, toMonth } = request.body;

    if (fromYear === toYear && fromMonth === toMonth) {
      return reply.status(400).send({ message: "コピー元とコピー先が同じ月です" });
    }

    const fromPrefix = `${fromYear}-${String(fromMonth).padStart(2, "0")}`;
    const toPrefix   = `${toYear}-${String(toMonth).padStart(2, "0")}`;

    const data = await readData();
    let copiedDays = 0;

    for (const staffRaw of data.basedata) {
      const staff   = staffRaw as Record<string, unknown>;
      const details = (staff.details ?? {}) as Record<string, Record<string, string>>;

      const fromEntries = Object.entries(details).filter(([dateKey]) =>
        dateKey.startsWith(fromPrefix)
      );

      for (const [fromDateKey, entry] of fromEntries) {
        const day       = fromDateKey.slice(8, 10);
        const toDateKey = `${toPrefix}-${day}`;
        const newEntry: Record<string, string> = {};
        for (const [k, v] of Object.entries(entry)) {
          newEntry[k] = v.replace(fromPrefix, toPrefix);
        }
        details[toDateKey] = newEntry;
        copiedDays++;
      }

      staff.details = details;
    }

    await writeData(data);
    return reply.status(200).send({ ok: true, copiedDays });
  }
);

// ---- 日本語フォント ------------------------------------------------------

server.get("/api/fonts/:name", async (request, reply) => {
  const { name } = request.params as { name: string };
  const fontPath = path.join(process.env.RESOURCES_PATH ?? "", "fonts", name);
  const stream = createReadStream(fontPath);
  reply.header("Content-Type", "font/ttf");
  return reply.send(stream);
});

// ---- Start ------------------------------------------------------

server.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});