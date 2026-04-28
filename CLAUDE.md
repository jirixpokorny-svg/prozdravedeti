# ProZdraveDeti.cz — CLAUDE.md

Tento soubor poskytuje kontext pro AI agenty pracující na projektu.

## O projektu

Web certifikované výživové poradkyně **Lenky Pokorné** z Písku.
Zaměření: dětské výživové tábory, semináře, poradenství pro rodiny.

- **Staging:** https://pzd.whatifai.cz
- **Produkce (plánovaná):** https://prozdravedeti.cz
- **GitHub:** https://github.com/jirixpokorny-svg/prozdravedeti
- **Kontakt Lenky:** info@prozdravedeti.cz, +420 725 757 041, IČ: 88631681

## Technický stack

- **Framework:** Astro 5 (SSR, Node adapter)
- **Styling:** Tailwind CSS v4
- **Fonty:** Nunito + Inter
- **Barvy:** zelená `#3d7a4a` / krémová `#faf8f3` / oranžová `#f5a623`
- **Databáze:** SQLite (better-sqlite3), volume `/data/pzd.db`
- **Email:** Nodemailer → SMTP mail.prozdravedeti.cz
- **Deployment:** Docker Compose na Raspberry Pi 5 (Debian 13)

## Infrastruktura

- **Raspberry Pi 5 (8GB):** `192.168.1.11`
- **SSH na Pi:** `ssh -i ~/.ssh/id_ed25519_pi pi@192.168.1.11`
- **Pi project dir:** `/home/pi/prozdravedeti/`
- **Docker container:** `prozdravedeti-web`, port 4321
- **nginx config:** `/etc/nginx/sites-available/pzd`
- **SSL:** Let's Encrypt certbot

## Deploy workflow

```bash
# Na Pi:
cd /home/pi/prozdravedeti && git pull && docker compose build --no-cache && docker compose up -d
```

## Struktura projektu

```
src/
  pages/          — Astro stránky
  components/     — UI komponenty
  layouts/        — layouty
  lib/db.ts       — SQLite přístup
public/images/    — loga, fotky
data/             — SQLite DB (lokálně)
docker-compose.yml
Dockerfile
```

## Stránky webu

| URL | Obsah |
|-----|-------|
| `/` | Homepage — hero, nejbližší akce z DB, o Lence, služby, CTA |
| `/tabory` | Seznam táborů z DB |
| `/tabory/[slug]` | Detail táboru + přihláška |
| `/seminare` | Seznam seminářů z DB |
| `/seminare/[slug]` | Detail semináře + přihláška |
| `/o-mne` | Příběh Lenky, timeline kariéry, spolupráce |
| `/poradenstvi` | 5 oblastí poradenství |
| `/admin/*` | Admin panel (chráněný heslem, bcrypt) |
| `/api/order` | POST endpoint — přihláška → email |

## Admin panel

- **URL:** https://pzd.whatifai.cz/admin/login
- **Heslo:** nastaveno při prvním přihlášení (bcrypt hash v SQLite)
- **Funkce:** CRUD tábory/semináře, upload letáků, přehled přihlášek

## Objednávkový formulář

Zákazník vyplní: jméno dítěte, věk, jméno rodiče, email, telefon, poznámka.
Po odeslání: email Lence + potvrzení zákazníkovi.
Platba online zatím není — řeší se ručně.

## Zabezpečení

- HTTPS (Let's Encrypt, HSTS)
- nginx rate limit: 20 req/s, burst 50
- fail2ban: nginx-limit-req (ban 1h), nginx-botsearch (ban 24h)
- Admin: session cookie HttpOnly, bcrypt heslo, 7denní session
- `checkOrigin = false` v Astro — ochrana zajištěna nginxem + fail2ban

## ENV proměnné (Pi: `/home/pi/prozdravedeti/.env`)

```
SMTP_HOST=mail.prozdravedeti.cz
SMTP_PORT=587
SMTP_USER=info@prozdravedeti.cz
SMTP_PASS=<heslo z wp-hosting.cz>
```

## TODO — otevřené úkoly (priorita)

- [ ] **SMTP heslo** — doplnit z wp-hosting.cz administrace, otestovat emaily
- [ ] **Fotky od Lenky** — placeholdery na homepage, /o-mne, /poradenstvi → `public/images/`
- [ ] **Tábory 2026** — přidat přes admin panel
- [ ] **SEO** — meta tagy, sitemap.xml, structured data (LocalBusiness, Event)
- [ ] **DNS migrace** — přesun na prozdravedeti.cz (nameservery na gransy.com)
- [ ] **Online platby** — ComGate nebo Stripe
- [ ] **Blog/recepty** — obsah od Lenky, organická návštěvnost z Googlu
- [ ] **Google Analytics nebo Plausible**
- [ ] **Čekací listina** — waitlist když je tábor plný

## Hotové funkce

- [x] Homepage — reálný obsah, foto placeholdery (2026-04-23)
- [x] Stránka /o-mne — příběh Lenky, timeline, spolupráce (2026-04-23)
- [x] Stránka /poradenstvi — 5 oblastí s reálným textem (2026-04-23)
- [x] Admin panel — CRUD tábory/semináře, upload letáků
- [x] Objednávkový formulář
- [x] Logo v navbaru — mix-blend-mode: multiply

## Loga (public/images/)

- `logo.png` — horizontální, bílé pozadí (navbar, CSS mix-blend-mode: multiply)
- `logo-vertical.png` — vertikální, bílé pozadí
- `logo-vertical-white.png` — vertikální, transparentní bg, bílé logo (footer)
- `logo-horizontal-white.png` — horizontální, bílé logo
- `logo-image.png` — jen ikonka

## DNS

- `pzd.whatifai.cz` → A → 89.203.148.39
- NAT hairpin nefunguje → `/etc/hosts` na Pi: `127.0.0.1 pzd.whatifai.cz`
