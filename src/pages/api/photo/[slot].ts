import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getPhotosDir } from '../../../lib/photos';
import fs from 'fs';
import path from 'path';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};

export const GET: APIRoute = ({ params }) => {
  const slot = params.slot as string;
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(`photo_${slot}`) as { value: string } | undefined;
  if (!row) return new Response('Not found', { status: 404 });

  const filepath = path.join(getPhotosDir(), row.value);
  if (!fs.existsSync(filepath)) return new Response('Not found', { status: 404 });

  const ext = row.value.split('.').pop()?.toLowerCase() || 'jpg';
  const data = fs.readFileSync(filepath);
  return new Response(data, {
    headers: {
      'Content-Type': MIME[ext] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
