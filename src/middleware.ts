import { defineMiddleware } from 'astro:middleware';
import { getDb } from './lib/db';

// Staré adresy z WordPressu (prozdravedeti.cz do 11/2026) → nové stránky. Trvalé přesměrování 301.
const PAGES: Record<string, string> = {
  '/kurzy': '/seminare',
  '/seminare-2': '/seminare',
  '/s-cim-vam-pomohu': '/poradenstvi',
  '/jak-probiha-poradenstvi': '/poradenstvi#jak-probiha',
  '/jednorazova-konzultace': '/poradenstvi?konzultace=jednorazova#konzultace',
  '/komplexni-konzultace': '/poradenstvi?konzultace=komplexni#konzultace',
  '/vstupni-konzultace': '/poradenstvi?konzultace=komplexni#konzultace',
  '/motivacni-konzultace': '/poradenstvi?konzultace=motivacni#konzultace',
  '/reference-2': '/reference',
  '/reference-3': '/reference',
  '/prohlaseni-o-zasadach-ochrany-osobnich-udaju': '/ochrana-osobnich-udaju',
  '/zasady-cookies-eu': '/ochrana-osobnich-udaju',
  '/vanocni-peceni': '/seminare/spolecne-vanocni-peceni-2026-12',
  '/jarni-ocista': '/seminare',
  '/svacina-pro-skolacku-i-skolaka': '/seminare',
  '/about': '/o-mne',
  '/obchod': '/', '/shop': '/', '/kosik': '/', '/cart': '/', '/pokladna': '/', '/pokladna-2': '/', '/checkout': '/',
  '/muj-ucet': '/', '/my-account': '/', '/web-pripravujeme': '/', '/home-alternate': '/', '/guides': '/', '/recipes': '/',
  '/teach-your-family-to-have-an-healthy-relationship-with-food': '/',
  '/feed': '/', '/comments/feed': '/',
};

// /produkt/<slug> z WooCommerce
const PRODUCTS: Record<string, string> = {
  'nebojte-se-varit-rostlinne': '/seminare/nebojte-se-varit-rostlinne-2026-11',
  'spolecne-vanocni-peceni': '/seminare/spolecne-vanocni-peceni-2026-12',
  'english-cooking-camp-2026': '/tabory/english-cooking-camp-2026-2026-08',
  'primestsky-tabor-kulinarsky-13-7-2026': '/tabory/primestsky-tabor-kulinarsky-2026-2026-07',
  'english-cooking-camp-11-8-2025': '/tabory',
  'primestsky-tabor-kulinarsky-14-7-2025': '/tabory',
  'spolecne-vanocni-peceni-kopirovat': '/poukazky?poukaz=kurz-dle-vyberu#objednat',
  'komplexni-konzultace-vyzivoveho-poradenstvi': '/poukazky?poukaz=komplexni-konzultace#objednat',
  'jednorazova-konzultace-vyzivoveho-poradenstvi': '/poukazky?poukaz=jednorazova-konzultace#objednat',
  'parove-vareni-a-vinna-degustace-poukaz': '/poukazky?poukaz=parove-vareni#objednat',
};

function target(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (PAGES[path]) return PAGES[path];

  const product = path.match(/^\/produkt\/([^/]+)$/);
  if (product) {
    const slug = decodeURIComponent(product[1]);
    if (PRODUCTS[slug]) return PRODUCTS[slug];
    // Kurzy převzaté z WP mají na novém webu stejný slug
    const s = getDb().prepare('SELECT slug FROM seminars WHERE slug = ?').get(slug) as { slug: string } | undefined;
    return s ? `/seminare/${s.slug}` : '/seminare';
  }
  if (/^\/kategorie-produktu\/tabory/.test(path)) return '/tabory';
  if (/^\/kategorie-produktu\/poukazky/.test(path)) return '/poukazky';
  if (/^\/kategorie-produktu\//.test(path)) return '/seminare';
  // Staré příspěvky /2023/06/24/nazev/ a archivy
  const post = path.match(/^\/20\d\d\/\d\d\/\d\d\/([^/]+)$/);
  if (post) {
    const s = getDb().prepare('SELECT slug FROM seminars WHERE slug = ?').get(decodeURIComponent(post[1])) as { slug: string } | undefined;
    if (s) return `/seminare/${s.slug}`;
  }
  if (/^\/20\d\d\/\d\d\/\d\d\/[^/]*(tabor|camp)/.test(path)) return '/tabory';
  if (/^\/20\d\d(\/|$)/.test(path)) return '/seminare';
  if (/^\/(category|tag|author|page)\//.test(path)) return '/';
  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/uploads')) {
    const to = target(pathname);
    if (to && to !== pathname) return context.redirect(to, 301);
  }
  return next();
});
