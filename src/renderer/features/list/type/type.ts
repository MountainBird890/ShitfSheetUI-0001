export type StaffRecord = {
  staffId: string;
  name: string;
  active?: boolean;
  details: Record<string, { user: string }>;
};