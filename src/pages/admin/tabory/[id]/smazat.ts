import type { APIRoute } from 'astro';
import { validateSession, getSessionFromRequest } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import type { Camp } from '../../../../lib/db';
import { deleteUpload } from '../../../../lib/upload';

export const POST: APIRoute = ({ request, params }) => {
  if (!validateSession(getSessionFromRequest(request))) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }
  const db = getDb();
  const camp = db.prepare("SELECT * FROM camps WHERE id = ?").get(Number(params.id)) as Camp | undefined;
  if (camp?.poster_url) deleteUpload(camp.poster_url);
  db.prepare("DELETE FROM camps WHERE id = ?").run(Number(params.id));
  return new Response(null, { status: 302, headers: { Location: '/admin/tabory' } });
};
