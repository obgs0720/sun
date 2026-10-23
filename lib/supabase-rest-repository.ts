import type { AttendanceRecord, DutySchedule, DutySettlement, MealOrder, NotificationDraft, ParentContact, PlayerGameStats, PlayerProfile, TrainingEvent } from './data-contracts';
import type { TeamRepository } from './repository';

type SupabaseConfig = { url: string; anonKey: string; accessToken: string; refreshToken?: string; userId: string };
type RawProfile = { id: string; jersey_number: string; display_name: string; role: PlayerProfile['role']; parent_name?: string; parent_phone?: string; city?: string; district?: string; school_name?: string; birthday?: string; email?: string; phone?: string; joined_on?: string; active: boolean };
type RawTrainingEvent = { id: string; event_date: string; title: string; event_type: TrainingEvent['eventType']; start_time?: string; end_time?: string; location?: string };
type RawDutySchedule = { id: string; duty_date: string; duty_player_id: string; equipment_one_id: string; equipment_two_id: string; status: DutySchedule['status'] };
type RawDirectoryEntry = { id: string; jersey_number: string; display_name: string };

/** Minimal REST repository. The database and RLS remain the source of truth. */
export function createSupabaseRepository(config: SupabaseConfig): TeamRepository {
  const baseUrl = `${config.url.replace(/\/$/, '')}/rest/v1`;
  let accessToken = config.accessToken;
  let refreshToken = config.refreshToken;
  async function refreshSession(): Promise<boolean> {
    if (!refreshToken || typeof window === 'undefined') return false;
    try {
      const response = await fetch(`${config.url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: config.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken }) });
      const next = await response.json() as { access_token?: string; refresh_token?: string };
      if (!response.ok || !next.access_token) return false;
      accessToken = next.access_token;
      refreshToken = next.refresh_token || refreshToken;
      const stored = JSON.parse(window.localStorage.getItem('sunshine-auth-session') || 'null') as Record<string, unknown> | null;
      window.localStorage.setItem('sunshine-auth-session', JSON.stringify({ ...stored, access_token: accessToken, refresh_token: refreshToken }));
      return true;
    } catch { return false; }
  }
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('apikey', config.anonKey);
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', 'application/json');
    let response = await fetch(`${baseUrl}/${path}`, {
      ...init,
      headers,
    });
    if (response.status === 401 && await refreshSession()) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(`${baseUrl}/${path}`, { ...init, headers });
    }
    if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    async getCurrentProfile() {
      const users = await request<RawProfile[]>(`profiles?select=id,jersey_number,display_name,role,parent_name,parent_phone,city,district,school_name,birthday,email,phone,joined_on,active&id=eq.${encodeURIComponent(config.userId)}&limit=1`);
      const profile = users[0];
      return profile ? { id: profile.id, jerseyNumber: profile.jersey_number, displayName: profile.display_name, role: profile.role, parentName: profile.parent_name, parentPhone: profile.parent_phone, city: profile.city, district: profile.district, schoolName: profile.school_name, birthday: profile.birthday, email: profile.email, phone: profile.phone, joinedOn: profile.joined_on, active: profile.active } : null;
    },
    updateCurrentProfile(input) {
      return request<void>('rpc/update_my_profile', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ p_birthday: input.birthday, p_city: input.city, p_district: input.district, p_school_name: input.schoolName, p_email: input.email, p_phone: input.phone }) });
    },
    saveParentContact(contact: ParentContact) {
      return request<void>('parent_contacts?on_conflict=player_id,is_primary', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ player_id: contact.playerId, name: contact.name, relation: contact.relation, phone: contact.phone, email: contact.email, line_handle: contact.line, is_primary: contact.isPrimary }) });
    },
    clearMyDutySettlements(dutyScheduleId: string) {
      return request<void>(`duty_settlements?duty_schedule_id=eq.${encodeURIComponent(dutyScheduleId)}&created_by=eq.${encodeURIComponent(config.userId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    },
    saveDutySettlement(settlement: DutySettlement) {
      return request<void>('duty_settlements', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ duty_schedule_id: settlement.dutyScheduleId, description: settlement.description, amount: settlement.amount, direction: settlement.direction, created_by: settlement.createdBy }) });
    },
    confirmMyDutySchedule(scheduleId: string) {
      return request<void>('rpc/confirm_my_duty_schedule', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ p_schedule_id: scheduleId }) });
    },
    listTrainingEvents(from, to) {
      return request<RawTrainingEvent[]>(`training_events?select=id,event_date,title,event_type,start_time,end_time,location&event_date=gte.${encodeURIComponent(from)}&event_date=lte.${encodeURIComponent(to)}&order=event_date.asc`).then(events => events.map(event => ({ id: event.id, eventDate: event.event_date, title: event.title, eventType: event.event_type, startTime: event.start_time, endTime: event.end_time, location: event.location })));
    },
    saveAttendance(record: AttendanceRecord) {
      return request<void>('attendance?on_conflict=event_id,player_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ event_id: record.eventId, player_id: record.playerId, status: record.status, note: record.note, submitted_at: record.submittedAt }) });
    },
    saveMealOrder(order: MealOrder) {
      return request<void>('meal_orders?on_conflict=event_id,player_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ event_id: order.eventId, player_id: order.playerId, menu_id: order.menuId, status: order.status, ordered_at: order.orderedAt }) });
    },
    listPlayerDirectory() {
      return request<RawDirectoryEntry[]>('player_directory?select=id,jersey_number,display_name&order=jersey_number.asc').then(rows => rows.map(row => ({ id: row.id, jerseyNumber: row.jersey_number, displayName: row.display_name })));
    },
    createNotifications(records: NotificationDraft[]) {
      return request<void>('notifications', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(records.map(record => ({ recipient_id: record.recipientId, notification_type: record.notificationType, title: record.title, body: record.body, channel: record.channel }))) });
    },
    setMealOrderingStatus(eventId: string, status: 'draft' | 'open' | 'stopped') {
      return request<void>(`training_events?id=eq.${encodeURIComponent(eventId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ meal_ordering_status: status }) });
    },
    listDutySchedules(from, to) {
      return request<RawDutySchedule[]>(`duty_schedules?select=id,duty_date,duty_player_id,equipment_one_id,equipment_two_id,status&duty_date=gte.${encodeURIComponent(from)}&duty_date=lte.${encodeURIComponent(to)}&order=duty_date.asc`).then(schedules => schedules.map(schedule => ({ id: schedule.id, dutyDate: schedule.duty_date, dutyPlayerId: schedule.duty_player_id, equipmentOneId: schedule.equipment_one_id, equipmentTwoId: schedule.equipment_two_id, status: schedule.status })));
    },
    savePlayerGameStats(records: PlayerGameStats[]) {
      return request<void>('player_game_stats?on_conflict=game_id,player_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(records.map(record => ({ game_id: record.gameId, player_id: record.playerId, at_bats: record.atBats, hits: record.hits, rbi: record.rbi, runs: record.runs, innings_pitched: record.inningsPitched, earned_runs: record.earnedRuns, strikeouts: record.strikeouts, errors: record.errors }))) });
    },
  };
}
