import type { APIRoute } from 'astro';
import { getDb } from '../lib/db';

const SITE = 'https://prozdravedeti.cz';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/tabory', priority: '0.9', changefreq: 'weekly' },
  { url: '/seminare', priority: '0.9', changefreq: 'weekly' },
  { url: '/o-mne', priority: '0.7', changefreq: 'monthly' },
  { url: '/poradenstvi', priority: '0.8', changefreq: 'monthly' },
  { url: '/skolni-jidelny', priority: '0.8', changefreq: 'monthly' },
];

export const GET: APIRoute = () => {
  const db = getDb();

  const camps = db
    .prepare('SELECT slug, created_at FROM camps WHERE active = 1')
    .all() as { slug: string; created_at: string }[];

  const seminars = db
    .prepare('SELECT slug, created_at FROM seminars WHERE active = 1')
    .all() as { slug: string; created_at: string }[];

  const now = new Date().toISOString().split('T')[0];

  const urls = [
    ...STATIC_PAGES.map(
      (p) => `
  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    ),
    ...camps.map(
      (c) => `
  <url>
    <loc>${SITE}/tabory/${c.slug}</loc>
    <lastmod>${c.created_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
    ...seminars.map(
      (s) => `
  <url>
    <loc>${SITE}/seminare/${s.slug}</loc>
    <lastmod>${s.created_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
