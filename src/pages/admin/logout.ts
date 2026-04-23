import type { APIRoute } from 'astro';
import { destroySession, getSessionFromRequest } from '../../lib/auth';

export const GET: APIRoute = ({ request }) => {
  const token = getSessionFromRequest(request);
  if (token) destroySession(token);
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login', 'Set-Cookie': 'pzd_admin=; Path=/; Max-Age=0' },
  });
};
