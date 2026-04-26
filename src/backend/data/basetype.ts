import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// 型を変えた後、データ構造の日付キーをdetails項目にまとめる。その後、現状のカレンダーの情報を吸い上げるフロントエンドロジックをcalendar.tsxに追加する


// カレンダー用スケジュール型
export const ScheduleItemSchema = Type.Object({
  date: Type.String(), // "2026-04-08"
  type: Type.Union([
    Type.Literal("warning"),
    Type.Literal("success"),
    Type.Literal("error"),
  ]),
});

export const ScheduleDetailSchema = Type.Object({
  user:  Type.String(),
  start: Type.String(),
  end:   Type.String(),
  type:  Type.String(),
})

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
  details: Type.Optional(           // ← これを追加
    Type.Record(Type.String(), ScheduleDetailSchema)
  ),
});

export type ScheduleItem = Static<typeof ScheduleItemSchema>;
export type StaffWork = Static<typeof StaffWorkSchema>;
export type ScheduleDetail = Static<typeof ScheduleDetailSchema> 