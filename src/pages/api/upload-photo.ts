import type { APIRoute } from 'astro';
import { validateSession, getSessionFromRequest } from '../../lib/auth';
import { getDb } from '../../lib/db';
import { getPhotosDir, PHOTO_SLOTS } from '../../lib/photos';
import fs from 'fs';
import path from 'path';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const VALID_SLOTS = PHOTO_SLOTS.map(s => s.key);

export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(getSessionFromRequest(request))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await request.formData();
  const slot = form.get('slot') as string;
  const file = form.get('file') as File | null;

  if (!VALID_SLOTS.includes(slot as any) || !file || file.size === 0) {
    return new Response(JSON.stringify({ error: 'Neplatný požadavek' }), { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTS.includes(ext)) {
    return new Response(JSON.stringify({ error: 'Povolené formáty: jpg, png, webp' }), { status: 400 });
  }

  const photosDir = getPhotosDir();
  fs.mkdirSync(photosDir, { recursive: true });

  // Smaž starý soubor pro tento slot
  for (const oldExt of ALLOWED_EXTS) {
    const old = path.join(photosDir, `${slot}.${oldExt}`);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const filename = `${slot}.${ext}`;
  fs.writeFileSync(path.join(photosDir, filename), Buffer.from(await file.arrayBuffer()));

  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").run(`photo_${slot}`, filename);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
