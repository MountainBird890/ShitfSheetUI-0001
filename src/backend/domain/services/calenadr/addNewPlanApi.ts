import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve("backend/data/users/base.json");

const ScheduleBody = Type.Object({
  staffId: Type.String(),
  dateKey: Type.String(),   // "2026-04-23"
  user: Type.String(),
  start: Type.String(),     // "2026-04-23T09:00"
  end: Type.String(),
  type: Type.String(),
});

type ScheduleBodyType = Static<typeof ScheduleBody>;

export async function addScheduleRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: ScheduleBodyType }>(
    "/api/schedule/add",
    { schema: { body: ScheduleBody } },
    async (request, reply) => {
      const { staffId, dateKey, user, start, end, type } = request.body;

      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      const json = JSON.parse(raw);

      const staffIndex = json.basedata.findIndex(
        (s: any) => s.staffId === staffId
      );
      if (staffIndex === -1) {
        return reply.status(404).send({ error: "スタッフが見つかりません" });
      }

      const staff = json.basedata[staffIndex];
      const existing = staff.details?.[dateKey];

      if (!existing) {
        // 同日データなし → 通常保存
        staff.details[dateKey] = { user, start, end, type };
      } else {
        // 同日データあり → 連番サフィックスを探して追加
        // 既存キーから最大の番号を取得（user, user-2, user-3...）
        const existingKeys = Object.keys(existing); // ["user","start","end","type","user-2",...]
        const nums = existingKeys
          .map((k) => {
            const m = k.match(/^user(?:-(\d+))?$/);
            return m ? (m[1] ? parseInt(m[1]) : 1) : null;
          })
          .filter((n): n is number => n !== null);

        const nextNum = Math.max(...nums) + 1;
        const suffix = `-${nextNum}`;

        existing[`user${suffix}`] = user;
        existing[`start${suffix}`] = start;
        existing[`end${suffix}`] = end;
        existing[`type${suffix}`] = type;
      }

      fs.writeFileSync(DATA_PATH, JSON.stringify(json, null, 2), "utf-8");

      return reply.status(200).send({ ok: true });
    }
  );
}