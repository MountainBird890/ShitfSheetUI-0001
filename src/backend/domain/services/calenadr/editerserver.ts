import Fastify from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fs from "node:fs/promises";
import path from "node:path";

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

const DATA_PATH = path.resolve(process.cwd(), "data", "basedata.json");

async function readData(): Promise<{ basedata: Record<string, unknown>[] }> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: { basedata: Record<string, unknown>[] }): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Server -----------------------------------------------------

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
  {
    schema: {
      body: UpdateScheduleBodySchema,
    },
  },
  async (request, reply) => {
    const { staffId, dateKey } = request.params;
    const { name, entry } = request.body;

    // Validate date key format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return reply.status(400).send({ message: "Invalid dateKey format" });
    }

    const data = await readData();
    const idx = data.basedata.findIndex(
      (s) => (s as Record<string, unknown>).staffId === staffId
    );

    if (idx === -1) {
      return reply.status(404).send({ message: "Staff not found" });
    }

    // Update fields
    (data.basedata[idx] as Record<string, unknown>).name = name;
    (data.basedata[idx] as Record<string, unknown>)[dateKey] = entry;

    await writeData(data);

    return reply.send({
      staffId,
      dateKey,
      updated: entry,
    });
  }
);

// ---- Start ------------------------------------------------------

server.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});