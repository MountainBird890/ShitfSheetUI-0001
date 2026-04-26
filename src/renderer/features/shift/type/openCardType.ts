export interface CardContextValue {
  open: boolean;
  staff: StaffRecord | null;
  dateKey: string | null;
  openCard: (staff: StaffRecord, dateKey: string) => void;
  closeCard: () => void;
  handleSave: (staffId: string, dateKey: string, updated: ScheduleEntry, updatedName: string) => void;
}

export interface ScheduleEntry {
  user: string;
  start: string; // ISO datetime string e.g. "2026-04-25T10:00"
  end: string;
  type: string;
}

export interface StaffRecord {
  staffId: string;
  name: string;
  position?: string;
  details?: Record<string, ScheduleEntry>;  // ← detailsにまとめる
}
