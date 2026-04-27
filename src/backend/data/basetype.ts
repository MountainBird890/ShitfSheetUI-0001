import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// カレンダー用スケジュール型
export const ScheduleItemSchema = Type.Object({
  date: Type.String(), // "2026-04-08"
  type: Type.Union([
    Type.Literal("warning"),
    Type.Literal("success"),
    Type.Literal("error"),
  ]), // 現在の勤務状態
});

export const ScheduleDetailSchema = Type.Object({
  user:  Type.String(), // 利用者名
  start: Type.String(), // サービス開始時間
  end:   Type.String(), // サービス終了時間
  type:  Type.String(), //  種別
})

export const StaffWorkSchema = Type.Object({
  staffId: Type.String(),// 職員ID
  name: Type.String(),// 職員名

  // ↓ 追加
  schedule: Type.Array(ScheduleItemSchema),

  days: Type.Object({
    workingDays: Type.Number(),// 労働日数
    paidLeaveDays: Type.Number(),// 有給日数
  }),

  hours: Type.Object({
    workingHours: Type.Number(),// 労働時間
    nightHours: Type.Number(),// 深夜時間
    morningEveningHours: Type.Number(),// 朝、夜間時間
    overtimeHours: Type.Number(),// 時間外手当
    emergencyPrevHours: Type.Number(),// 緊急前日
    emergencySameDayHours: Type.Number(),// 緊急当日
    careTrainingHours: Type.Number(),// 介護練習
  }),

  counts: Type.Object({
    travelCount: Type.Number(),// 移動手当
  }),

  amounts: Type.Object({
    drivingAllowance: Type.Number(),// 運転手当
    specialAllowance1: Type.Number(),// 特殊手当1
    specialAllowance2: Type.Number(),// 特殊手当2
    trainingAllowance: Type.Number(),// 研修手当
    bathingAllowance: Type.Number(),// 入浴手当
    excretionAllowance: Type.Number(),// 排泄手当
    lodgingAllowance: Type.Number(),// 宿泊手当
    longStayAllowance: Type.Number(),// 長期外泊
    commutingAllowance: Type.Number(),// 通勤手当
    businessTripDay: Type.Number(),// 出張（日帰り）
    businessTripStay: Type.Number(),// 出張（宿泊）
    yearEndAllowance: Type.Number(),// 年末年始手当
    specialBonus: Type.Number(),// 特別手当
  }),
  details: Type.Optional(           // ScheduleDetailSchemaの親
    Type.Record(Type.String(), ScheduleDetailSchema)
  ),
});

export type ScheduleItem = Static<typeof ScheduleItemSchema>;
export type StaffWork = Static<typeof StaffWorkSchema>;
export type ScheduleDetail = Static<typeof ScheduleDetailSchema> 