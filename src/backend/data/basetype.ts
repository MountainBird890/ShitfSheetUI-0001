import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// カレンダー用スケジュール型
export const ScheduleItemSchema = Type.Object({
  date: Type.String(), // "2026-04-08"
  type: Type.Union([
    Type.Literal("warning"),
    Type.Literal("success"),
    Type.Literal("error"),
  ]),
});

export const StaffWorkSchema = Type.Object({
  staffId: Type.String(),
  name: Type.String(),

  // ↓ 追加
  schedule: Type.Array(ScheduleItemSchema),

  days: Type.Object({
    workingDays: Type.Number(),
    paidLeaveDays: Type.Number(),
  }),

  hours: Type.Object({
    workingHours: Type.Number(),
    nightHours: Type.Number(),
    morningEveningHours: Type.Number(),
    overtimeHours: Type.Number(),
    emergencyPrevHours: Type.Number(),
    emergencySameDayHours: Type.Number(),
    careTrainingHours: Type.Number(),
  }),

  counts: Type.Object({
    travelCount: Type.Number(),
  }),

  amounts: Type.Object({
    drivingAllowance: Type.Number(),
    specialAllowance1: Type.Number(),
    specialAllowance2: Type.Number(),
    trainingAllowance: Type.Number(),
    bathingAllowance: Type.Number(),
    excretionAllowance: Type.Number(),
    lodgingAllowance: Type.Number(),
    longStayAllowance: Type.Number(),
    commutingAllowance: Type.Number(),
    businessTripDay: Type.Number(),
    businessTripStay: Type.Number(),
    yearEndAllowance: Type.Number(),
    specialBonus: Type.Number(),
  }),
});

export type ScheduleItem = Static<typeof ScheduleItemSchema>;
export type StaffWork = Static<typeof StaffWorkSchema>;