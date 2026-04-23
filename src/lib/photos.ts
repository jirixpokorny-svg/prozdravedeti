import fs from 'fs';
import path from 'path';
import { getDb } from './db';

export const PHOTO_SLOTS = [
  { key: 'lenka-hero',        label: 'Hlavní stránka — velká fotka nahoře (hero)',   fallback: '/images/Lenka_foto/lenka-hero.png' },
  { key: 'lenka-o-mne',       label: 'Hlavní stránka — sekce O Lence',               fallback: '/images/Lenka_foto/lenka-o-mne.png' },
  { key: 'lenka-o-mne-page',  label: 'Stránka „O mně" — portrét nahoře',            fallback: '/images/Lenka_foto/lenka-o-mne-page.png' },
] as const;

export type PhotoSlotKey = typeof PHOTO_SLOTS[number]['key'];

export function getPhotosDir(): string {
  const dbPath = process.env.DB_PATH;
  return dbPath
    ? path.join(path.dirname(dbPath), 'photos')
    : path.join(process.cwd(), 'data', 'photos');
}

export function getPhotoUrl(slot: PhotoSlotKey): string {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(`photo_${slot}`) as { value: string } | undefined;
  if (!row) return PHOTO_SLOTS.find(s => s.key === slot)!.fallback;
  const filepath = path.join(getPhotosDir(), row.value);
  if (!fs.existsSync(filepath)) return PHOTO_SLOTS.find(s => s.key === slot)!.fallback;
  return `/api/photo/${slot}`;
}
