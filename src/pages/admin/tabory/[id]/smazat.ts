import type { APIRoute } from 'astro';
import { validateSession, getSessionFromRequest } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import type { Camp } from '../../../../lib/db';
import fs from 'fs';
import path from 'path';

export const POST: APIRoute = ({ request, params }) => {
  if (!validateSession(getSessionFromRequest(request))) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }
  const db = getDb();
  const camp = db.prepare("SELECT * FROM camps WHERE id = ?").get(Number(params.id)) as Camp | undefined;
  if (camp?.poster_url) {
    const p = path.join(process.cwd(), 'public', camp.poster_url);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.prepare("DELETE FROM camps WHERE id = ?").run(Number(params.id));
  return new Response(null, { status: 302, headers: { Location: '/admin/tabory' } });
};
