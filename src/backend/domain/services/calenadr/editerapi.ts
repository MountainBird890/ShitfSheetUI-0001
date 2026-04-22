// api.ts — フロントエンド用 APIクライアント

import type{ ScheduleEntry, StaffRecord } from "../../../../renderer/features/calendar/ui/editer";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

/** 全職員データ取得 */
export async function fetchAllStaff(): Promise<StaffRecord[]> {
  const res = await fetch(`${BASE}/api/staff`);
  if (!res.ok) throw new Error(`fetchAllStaff: ${res.status}`);
  return res.json();
}

/** 単一職員データ取得 */
export async function fetchStaff(staffId: string): Promise<StaffRecord> {
  const res = await fetch(`${BASE}/api/staff/${staffId}`);
  if (!res.ok) throw new Error(`fetchStaff: ${res.status}`);
  return res.json();
}

/** スケジュールエントリ更新 */
export async function updateScheduleEntry(
  staffId: string,
  dateKey: string,
  name: string,
  entry: ScheduleEntry
): Promise<void> {
  const res = await fetch(
    `${BASE}/api/staff/${encodeURIComponent(staffId)}/schedule/${encodeURIComponent(dateKey)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entry }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `updateScheduleEntry: ${res.status}`);
  }
}