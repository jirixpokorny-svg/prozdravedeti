import fs from 'fs';
import path from 'path';
import { getDb } from './db';

export const PHOTO_SLOTS = [
  { key: 'lenka-hero',              label: 'Hlavní stránka — velká fotka nahoře (hero)',          fallback: '/images/Lenka_foto/lenka-hero.png' },
  { key: 'lenka-o-mne',            label: 'Hlavní stránka — sekce O Lence',                      fallback: '/images/Lenka_foto/lenka-o-mne.png' },
  { key: 'workshop',               label: 'Hlavní stránka — foto z konzultace / workshopu',      fallback: null },
  { key: 'tabor-cta',              label: 'Hlavní stránka — foto z tábora (CTA sekce)',           fallback: null },
  { key: 'lenka-o-mne-page',       label: 'Stránka „O mně" — portrét nahoře',                   fallback: '/images/Lenka_foto/lenka-o-mne-page.png' },
  { key: 'prace-rodiny',           label: 'Stránka „O mně" — fotka z práce s rodinami',          fallback: null },
  { key: 'spoluprace',             label: 'Stránka „O mně" — fotka ze spolupráce / workshopu',   fallback: null },
  { key: 'sluzba-tehotenstvi',     label: 'Poradenství — Výživa v těhotenství',                  fallback: null },
  { key: 'sluzba-kojeni',          label: 'Poradenství — Výživa kojících maminek',               fallback: null },
  { key: 'sluzba-prikrmy',         label: 'Poradenství — Začínáme s příkrmy',                    fallback: null },
  { key: 'sluzba-deti',            label: 'Poradenství — Výživa dětí od 1 roku',                 fallback: null },
  { key: 'sluzba-hmotnost',        label: 'Poradenství — Úprava hmotnosti',                      fallback: null },
] as const;

export type PhotoSlotKey = typeof PHOTO_SLOTS[number]['key'];

export function getPhotosDir(): string {
  const dbPath = process.env.DB_PATH;
  return dbPath
    ? path.join(path.dirname(dbPath), 'photos')
    : path.join(process.cwd(), 'data', 'photos');
}

export function getPhotoUrl(slot: PhotoSlotKey): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(`photo_${slot}`) as { value: string } | undefined;
  if (row) {
    const filepath = path.join(getPhotosDir(), row.value);
    if (fs.existsSync(filepath)) return `/api/photo/${slot}`;
  }
  return PHOTO_SLOTS.find(s => s.key === slot)!.fallback;
}
