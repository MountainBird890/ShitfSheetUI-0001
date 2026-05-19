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

const RESOURCES_PATH = process.env.RESOURCES_PATH ?? "";

const DATA_PATH = process.env.NODE_ENV === "production"
  ? path.join(
      path.dirname(process.env.RESOURCES_PATH ?? ""),
      "appdata", "users", "base.json"
    )
  : path.resolve(process.cwd(), "src/backend/data/users/base.json");

async function readData(): Promise<{ basedata: Record<string, unknown>[] }> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: { basedata: Record<string, unknown>[] }): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function ensureDataFile() {
  if (process.env.NODE_ENV !== "production") return;
  try {
    await fs.access(DATA_PATH);
  } catch {
    const srcPath = path.join(
      process.env.RESOURCES_PATH ?? "",
      "data_default", "users", "base.json"
    );
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.copyFile(srcPath, DATA_PATH);
  }
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

// PUT /api/staff/:staffId/schedule/:dateKey ー useShift.tsxで使用
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

// PUT /api/staff/:staffId/schedule/edit — 日付変更対応の編集ルート ー useCalendar.tsxのediter.tsxコンテキストで使用
const EditScheduleBodySchema = Type.Object({
  name:       Type.String({ minLength: 1 }),
  entry:      ScheduleEntrySchema,
  oldDateKey: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
});

server.put<{
  Params: { staffId: string };
  Body: Static<typeof EditScheduleBodySchema>;
}>(
  "/api/staff/:staffId/schedule/edit",
  { schema: { body: EditScheduleBodySchema } },
  async (request, reply) => {
    const { staffId }              = request.params;
    const { name, entry, oldDateKey } = request.body;

    const newDateKey = entry.start.slice(0, 10);

    const data = await readData();
    const idx  = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    const staff   = data.basedata[idx] as Record<string, unknown>;
    const details = (staff.details ?? {}) as Record<string, unknown>;

    // 古いキーを削除（日付が変わった場合のみ）
    if (oldDateKey !== newDateKey && details[oldDateKey]) {
      delete details[oldDateKey];
    }

    details[newDateKey] = entry;
    staff.details       = details;
    staff.name          = name;

    await writeData(data);
    return reply.send({ staffId, oldDateKey, newDateKey, updated: entry });
  }
);

// POST /api/staff — 職員新規追加
const StaffBodySchema = Type.Object({
  name:              Type.String({ minLength: 1 }),
  position:          Type.Optional(Type.String()),
  "employment-type": Type.Optional(Type.String()),
  qualifications:    Type.Optional(Type.String()),
  "work-place":      Type.Optional(Type.String()),
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
      position:          request.body.position          ?? "",
      "employment-type": request.body["employment-type"] ?? "",
      qualifications:    request.body.qualifications     ?? "",
      "work-place":      request.body["work-place"]      ?? "",
      days:    { workingDays: 0, paidLeaveDays: 0 },
      hours:   {
        workingHours: 0, nightHours: 0, morningEveningHours: 0,
        overtimeHours: 0, emergencyPrevHours: 0,
        emergencySameDayHours: 0, careTrainingHours: 0, officeWorkHours: 0,
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

// DELETE /api/staff/:staffId — 論理削除
server.delete<{ Params: { staffId: string } }>(
  "/api/staff/:staffId",
  async (request, reply) => {
    const { staffId } = request.params;
    const data = await readData();
    const idx = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });
    (data.basedata[idx] as Record<string, unknown>).active = false;
    await writeData(data);
    return reply.send({ ok: true, staffId });
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
    const existingNums = Object.keys(details)
      .filter(k => k.startsWith(dateKey))
      .map(k => {
        const m = k.match(/^.+-(\d{3})$/);
        return m ? parseInt(m[1]) : 0;
      });
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newKey  = `${dateKey}-${String(nextNum).padStart(3, "0")}`;

    details[newKey] = { user, start, end, type };

    staff.details = details;
    await writeData(data);
    return reply.status(201).send({ ok: true, staffId, dateKey });
  }
);

// ---- 予定削除 --------------------------------------------------
// DELETE /api/staff/:staffId/schedule/:dateKey — 予定削除
server.delete<{ Params: { staffId: string; dateKey: string } }>(
  "/api/staff/:staffId/schedule/:dateKey",
  async (request, reply) => {
    const { staffId, dateKey } = request.params;
    const data = await readData();
    const idx = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    const staff = data.basedata[idx] as Record<string, unknown>;
    const details = (staff.details ?? {}) as Record<string, unknown>;
    if (!details[dateKey]) return reply.status(404).send({ message: "Schedule not found" });

    delete details[dateKey];
    staff.details = details;
    await writeData(data);
    return reply.send({ ok: true, staffId, dateKey });
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

    const data = await readData();
    let copiedDays = 0;

    for (const staffRaw of data.basedata) {
      const staff   = staffRaw as Record<string, unknown>;
      const details = (staff.details ?? {}) as Record<string, Record<string, string>>;

      const fromEntries = Object.entries(details).filter(([dateKey]) =>
        dateKey.startsWith(fromPrefix)
      );

      for (const [fromDateKey, entry] of fromEntries) {
        // ★ コピー元の曜日を取得（0=日, 1=月, ..., 6=土）
        const fromDate = new Date(fromDateKey);
        const fromDow = fromDate.getDay();

        // ★ コピー先の月の同じ曜日の日付を全て探す
        const toYear_ = toYear;
        const toMonth_ = toMonth;
        const firstDayOfToMonth = new Date(toYear_, toMonth_ - 1, 1);
        const daysInToMonth = new Date(toYear_, toMonth_, 0).getDate();

        // コピー先月の最初の同曜日を求める
        const firstDow = firstDayOfToMonth.getDay();
        let firstMatchDay = 1 + ((fromDow - firstDow + 7) % 7);

        // 同曜日の全ての日付にコピー（1回だけコピーする場合は最初の1件のみ）
        // ★ コピー元の日が何番目の同曜日かを求める
        const fromDay = fromDate.getDate();
        const weekIndex = Math.floor((fromDay - 1) / 7); // 0=第1週, 1=第2週...

        // コピー先の同じ週番号・同じ曜日の日付を求める
        const toDay = firstMatchDay + weekIndex * 7;

        // 月末を超える場合はスキップ
        if (toDay > daysInToMonth) continue;

        const toDateKey = `${toYear_}-${String(toMonth_).padStart(2, "0")}-${String(toDay).padStart(2, "0")}`;
        const toPrefix = `${toYear_}-${String(toMonth_).padStart(2, "0")}`;
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

// ---- 内勤・研修データ保存 --------------------------------------------------
const InternalWorkBodySchema = Type.Object({
  staffId:  Type.String({ minLength: 1 }),
  dateKey:  Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
  workType: Type.Union([Type.Literal("training"), Type.Literal("office")]),
  start:    Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
  end:      Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" }),
});

server.post<{ Body: Static<typeof InternalWorkBodySchema> }>(
  "/api/schedule/internal",
  { schema: { body: InternalWorkBodySchema } },
  async (request, reply) => {
    const { staffId, dateKey, workType, start, end } = request.body;

    // 時間計算（分 → 時間）
    const startMin = new Date(start).getHours() * 60 + new Date(start).getMinutes();
    const endMin   = new Date(end).getHours() * 60 + new Date(end).getMinutes();
    const adjEnd   = endMin <= startMin ? endMin + 1440 : endMin;
    const hours    = Math.round(((adjEnd - startMin) / 60) * 10) / 10;

    const data = await readData();
    const idx  = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );
    if (idx === -1) return reply.status(404).send({ message: "Staff not found" });

    const staff = data.basedata[idx] as Record<string, unknown>;
    const hoursObj = (staff.hours ?? {}) as Record<string, number>;

    if (workType === "training") {
      hoursObj.careTrainingHours = (hoursObj.careTrainingHours ?? 0) + hours;
    } else {
      hoursObj.officeWorkHours = (hoursObj.officeWorkHours ?? 0) + hours;
    }

    staff.hours = hoursObj;

    // detailsにも記録（カレンダーに表示させるため）
    const details = (staff.details ?? {}) as Record<string, Record<string, string>>;
        const existingNums = Object.keys(details)
      .filter(k => k.startsWith(dateKey))
      .map(k => {
        const m = k.match(/^.+-(\d{3})$/);
        return m ? parseInt(m[1]) : 0;
      });
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newKey  = `${dateKey}-${String(nextNum).padStart(3, "0")}`;
    details[dateKey] = {
      user:  workType === "training" ? "研修" : "内勤",
      start,
      end,
      type:  workType === "training" ? "研修" : "内勤",
    };
    staff.details = details;

    await writeData(data);
    return reply.status(201).send({ ok: true, staffId, dateKey, hours });
  }
);

// ---- 日本語フォント ------------------------------------------------------
// 本番環境でエラーが出るときは
// server.get("/api/fonts/:name", async (request, reply) => {
// const { name } = request.params as { name: string };
// const fontPath = path.join(process.env.RESOURCES_PATH ?? "", "fonts", name);
// const stream = createReadStream(fontPath);
// reply.header("Content-Type", "font/ttf");
// return reply.send(stream);
// });
// ↑を使う

server.get("/api/fonts/:name", async (request, reply) => {
  const { name } = request.params as { name: string };

  const fontPath = process.env.NODE_ENV === "production"
    ? path.join(process.env.RESOURCES_PATH ?? "", "fonts", name)
    : path.resolve(process.cwd(), "public/fonts", name);

  try {
    const stream = createReadStream(fontPath);
    reply.header("Content-Type", "font/ttf");
    return reply.send(stream);
  } catch (err) {
    return reply.status(404).send({ message: `Font not found: ${name}` });
  }
});

// ---- Start ------------------------------------------------------
(async () => {
  await ensureDataFile();
  server.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
    if (err) { server.log.error(err); process.exit(1); }
  });
})();