import { type FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.resolve("data/users/base.json");

// TypeBoxスキーマ
const StaffBodySchema = Type.Object({
  name:              Type.String({ minLength: 1 }),
  position:          Type.String({ minLength: 1 }),
  "employment-type": Type.String({ minLength: 1 }),
  qualifications:    Type.String(),
  "work-place":      Type.String({ minLength: 1 }),
});

type StaffBody = Static<typeof StaffBodySchema>;

export async function staffRoutes(app: FastifyInstance) {

  app.post<{ Body: StaffBody }>(
    "/api/staff",
    { schema: { body: StaffBodySchema } },
    async (request, reply) => {
      const raw  = await fs.readFile(DATA_PATH, "utf-8");
      const json = JSON.parse(raw);

      // staffId末番を探して+1
      const maxId = json.basedata.reduce(
        (acc: number, s: any) => Math.max(acc, Number(s.staffId)),
        0
      );
      const newStaffId = String(maxId + 1);

      const newStaff = {
        staffId:            newStaffId,
        name:               request.body.name,
        position:           request.body.position,
        "employment-type":  request.body["employment-type"],
        qualifications:     request.body.qualifications,
        "work-place":       request.body["work-place"],
        // 以下は初期値
        days:    { workingDays: 0, paidLeaveDays: 0 },
        hours:   { workingHours: 0, nightHours: 0, morningEveningHours: 0,
                   overtimeHours: 0, emergencyPrevHours: 0,
                   emergencySameDayHours: 0, careTrainingHours: 0 },
        counts:  { travelCount: 0 },
        amounts: { drivingAllowance: 0, specialAllowance1: 0, specialAllowance2: 0,
                   trainingAllowance: 0, bathingAllowance: 0, excretionAllowance: 0,
                   lodgingAllowance: 0, longStayAllowance: 0, commutingAllowance: 0,
                   businessTripDay: 0, businessTripStay: 0, yearEndAllowance: 0,
                   specialBonus: 0 },
        details: {},
      };

      json.basedata.push(newStaff);
      await fs.writeFile(DATA_PATH, JSON.stringify(json, null, 2), "utf-8");

      return reply.status(201).send({ ok: true, staffId: newStaffId });
    }
  );
}
