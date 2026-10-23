/**
 * Frontend data contracts shared by the prototype and the future Supabase adapter.
 * Keep UI components dependent on these shapes rather than database column names.
 */

export type AttendanceStatus = 'registered' | 'attended' | 'leave' | 'late' | 'cancelled';
export type MealOrderStatus = 'ordered' | 'no_meal' | 'unconfirmed' | 'cancelled';
export type DutyStatus = 'draft' | 'confirmed' | 'completed';

export type PlayerProfile = {
  id: string;
  jerseyNumber: string;
  displayName: string;
  role: 'player' | 'coach' | 'admin';
  parentName?: string;
  parentPhone?: string;
  city?: string;
  district?: string;
  schoolName?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  joinedOn?: string;
  active: boolean;
};

export type TrainingEvent = {
  id: string;
  eventDate: string;
  title: string;
  eventType: 'training' | 'game' | 'other';
  startTime?: string;
  endTime?: string;
  location?: string;
};

export type AttendanceRecord = {
  eventId: string;
  playerId: string;
  status: AttendanceStatus;
  note?: string;
  submittedAt: string;
};

export type MealOrder = {
  eventId: string;
  playerId: string;
  menuId?: string;
  status: MealOrderStatus;
  orderedAt: string;
};

export type DutySchedule = {
  id: string;
  dutyDate: string;
  dutyPlayerId: string;
  equipmentOneId: string;
  equipmentTwoId: string;
  status: DutyStatus;
};

export type PlayerGameStats = {
  gameId: string;
  playerId: string;
  atBats: number;
  hits: number;
  rbi: number;
  runs: number;
  inningsPitched: number;
  earnedRuns: number;
  strikeouts: number;
  errors: number;
};

export type PlayerDirectoryEntry = { id: string; jerseyNumber: string; displayName: string };
export type NotificationDraft = { recipientId: string; notificationType: 'meal_reminder' | 'attendance_reminder' | 'announcement'; title: string; body: string; channel: 'in_app' | 'line' | 'email' };
export type ParentContact = { playerId: string; name: string; relation: string; phone: string; email: string; line?: string; isPrimary: boolean };
export type DutySettlement = { dutyScheduleId: string; description: string; amount: number; direction: 'income' | 'expense'; createdBy: string };
