#!/bin/bash
# DNS Cutover – prozdravedeti.cz SSL setup
# Run this on the Pi AFTER:
#   1. DNS A record for prozdravedeti.cz points to the Pi's public IP
#   2. DNS A record for www.prozdravedeti.cz points to the Pi's public IP
#   3. Port 80 and 443 are forwarded from the router to 192.168.1.11
set -e

DOMAIN="prozdravedeti.cz"
EMAIL="info@prozdravedeti.cz"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "=== Step 1: Install production nginx config ==="
cp nginx-prozdravedeti.conf "$NGINX_AVAILABLE/prozdravedeti"

# Temporarily make the config HTTP-only so certbot can complete the ACME challenge
cat > "$NGINX_AVAILABLE/prozdravedeti-http" <<'EOF'
server {
    listen 80;
    server_name prozdravedeti.cz www.prozdravedeti.cz;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://prozdravedeti.cz$request_uri; }
}
EOF

ln -sf "$NGINX_AVAILABLE/prozdravedeti-http" "$NGINX_ENABLED/prozdravedeti-http"
nginx -t && systemctl reload nginx

echo "=== Step 2: Obtain Let's Encrypt certificate ==="
certbot certonly --webroot -w /var/www/html \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

echo "=== Step 3: Enable full HTTPS nginx config ==="
ln -sf "$NGINX_AVAILABLE/prozdravedeti" "$NGINX_ENABLED/prozdravedeti"
rm -f "$NGINX_ENABLED/prozdravedeti-http"
nginx -t && systemctl reload nginx

echo "=== Step 4: Replace pzd.whatifai.cz config with redirect ==="
cp nginx-lenka.conf "$NGINX_AVAILABLE/pzd"
nginx -t && systemctl reload nginx

echo ""
echo "=== Done ==="
echo "prozdravedeti.cz is now live with HTTPS."
echo "pzd.whatifai.cz now 301-redirects to prozdravedeti.cz."
echo ""
echo "Verify:"
echo "  curl -I https://prozdravedeti.cz"
echo "  curl -I http://pzd.whatifai.cz"
