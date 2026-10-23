import type { AttendanceRecord, DutySchedule, DutySettlement, MealOrder, NotificationDraft, ParentContact, PlayerDirectoryEntry, PlayerGameStats, PlayerProfile, TrainingEvent } from './data-contracts';
import { createSupabaseRepository } from './supabase-rest-repository';

/**
 * Boundary used by pages when the Supabase client is connected.
 * The current prototype intentionally keeps its localStorage implementation in
 * components; this contract prevents the eventual migration from changing UI
 * state shapes or weakening authorization assumptions.
 */
export interface TeamRepository {
  getCurrentProfile(): Promise<PlayerProfile | null>;
  updateCurrentProfile(input: Partial<Pick<PlayerProfile, 'birthday' | 'city' | 'district' | 'schoolName'>> & { email?: string; phone?: string }): Promise<void>;
  saveParentContact(contact: ParentContact): Promise<void>;
  clearMyDutySettlements(dutyScheduleId: string): Promise<void>;
  saveDutySettlement(settlement: DutySettlement): Promise<void>;
  confirmMyDutySchedule(scheduleId: string): Promise<void>;
  listTrainingEvents(from: string, to: string): Promise<TrainingEvent[]>;
  saveAttendance(record: AttendanceRecord): Promise<void>;
  saveMealOrder(order: MealOrder): Promise<void>;
  listPlayerDirectory(): Promise<PlayerDirectoryEntry[]>;
  createNotifications(records: NotificationDraft[]): Promise<void>;
  setMealOrderingStatus(eventId: string, status: 'draft' | 'open' | 'stopped'): Promise<void>;
  listDutySchedules(from: string, to: string): Promise<DutySchedule[]>;
  savePlayerGameStats(records: PlayerGameStats[]): Promise<void>;
}

export function requireConfiguredSupabase(): { url: string; anonKey: string } {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase 尚未設定：請在部署環境提供 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。');
  }
  return { url, anonKey };
}

/**
 * Returns a browser repository only when both Supabase configuration and a
 * signed-in session are available. Preview mode intentionally returns null so
 * the local prototype can still be used without weakening the production
 * authorization boundary.
 */
export function getBrowserRepository(): { repository: TeamRepository; userId: string } | null {
  if (typeof window === 'undefined') return null;
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const session = JSON.parse(window.localStorage.getItem('sunshine-auth-session') || 'null') as { access_token?: string; refresh_token?: string; user?: { id?: string } } | null;
    const accessToken = session?.access_token;
    const userId = session?.user?.id;
    if (!accessToken || !userId) return null;
    return { repository: createSupabaseRepository({ url, anonKey, accessToken, refreshToken: session?.refresh_token, userId }), userId };
  } catch {
    return null;
  }
}

/** Public contact form write. The database policy validates the fields again. */
export async function submitPublicContact(input: { name: string; email: string; topic: string; message: string }): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/contact_messages`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Supabase contact write failed: ${response.status}`);
  return true;
}

/** Uploads an admin-managed homepage image to the protected Storage bucket. */
export async function uploadHomepageAsset(file: File, kind: 'hero' | 'gallery'): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isAllowedImage(file)) return null;
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const session = JSON.parse(window.localStorage.getItem('sunshine-auth-session') || 'null') as { access_token?: string } | null;
    if (!session?.access_token) return null;
    const safeExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const path = `homepage/${kind}-${Date.now()}.${safeExtension}`;
    const response = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/homepage-assets/${path}`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
      body: file,
    });
    if (!response.ok) throw new Error(`Supabase asset upload failed: ${response.status}`);
    return `${url.replace(/\/$/, '')}/storage/v1/object/public/homepage-assets/${path}`;
  } catch {
    return null;
  }
}

export async function uploadGalleryAsset(file: File): Promise<string | null> {
  return uploadStorageAsset(file, 'gallery-assets', 'gallery');
}

export async function deleteGalleryAsset(publicUrl: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const marker = '/storage/v1/object/public/gallery-assets/';
  if (!url || !anonKey || !publicUrl.includes(marker)) return false;
  try {
    const session = JSON.parse(window.localStorage.getItem('sunshine-auth-session') || 'null') as { access_token?: string } | null;
    if (!session?.access_token) return false;
    const path = publicUrl.split(marker)[1];
    const response = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/gallery-assets/${path}`, { method: 'DELETE', headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}` } });
    return response.ok;
  } catch { return false; }
}

async function uploadStorageAsset(file: File, bucket: string, folder: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isAllowedImage(file)) return null;
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const session = JSON.parse(window.localStorage.getItem('sunshine-auth-session') || 'null') as { access_token?: string } | null;
    if (!session?.access_token) return null;
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const response = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }, body: file });
    if (!response.ok) return null;
    return `${url.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
  } catch { return null; }
}

function isAllowedImage(file: File): boolean {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  return allowedTypes.has(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024;
}
