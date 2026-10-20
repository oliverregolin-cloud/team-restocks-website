# Server-Konfiguration für teamrestocks.de

Zwei nginx-Snippets, die auf dem Webserver eingebunden werden müssen:

| Datei | Zweck |
| --- | --- |
| [`nginx/security-headers.conf`](nginx/security-headers.conf) | Security-Header (securityheaders.com: F → A+) |
| [`nginx/performance.conf`](nginx/performance.conf) | Kompression, Caching, eigene 404-Seite |

Dazu kommt ein kleiner `server`-Block für die Weiterleitung von `www` auf die
Hauptdomain (siehe unten). Beides ist **noch nicht aktiv** — die Snippets
liegen bisher nur im Repo.

> **Hinweis:** Vor der Domain hängt inzwischen Cloudflare. Caching- und
> Weiterleitungsregeln lassen sich daher auch dort setzen. Die nginx-Variante
> ist trotzdem sinnvoll, weil Cloudflare die Header der Origin respektiert und
> die Seite ohne Cloudflare weiterhin korrekt ausgeliefert wird.

## Installation

Alle Schritte als `root` bzw. mit `sudo` auf dem Webserver (Origin
217.160.22.196):

1. Snippets aus dem Repo holen:

   ```bash
   sudo mkdir -p /etc/nginx/snippets
   sudo curl -fsSL https://raw.githubusercontent.com/oliverregolin-cloud/team-restocks-website/main/deploy/nginx/security-headers.conf -o /etc/nginx/snippets/security-headers.conf
   sudo curl -fsSL https://raw.githubusercontent.com/oliverregolin-cloud/team-restocks-website/main/deploy/nginx/performance.conf -o /etc/nginx/snippets/performance.conf
   ```

2. In der Site-Config (meist `/etc/nginx/sites-enabled/teamrestocks.de`) den
   HTTPS-Server-Block auf die Hauptdomain beschränken und beide Snippets
   einbinden:

   ```nginx
   # www -> Hauptdomain, damit nicht zwei identische Seiten im Index landen
   server {
       listen 443 ssl http2;
       server_name www.teamrestocks.de;
       # Das Zertifikat muss www mit abdecken (certbot -d teamrestocks.de -d www.teamrestocks.de)
       return 301 https://teamrestocks.de$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name teamrestocks.de;          # www steht jetzt im Block darüber

       include snippets/security-headers.conf;
       include snippets/performance.conf;

       root /var/www/teamrestocks.de;
       index index.html;
   }
   ```

3. Prüfen und neu laden:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Kontrollieren:

   ```bash
   curl -sSI https://teamrestocks.de/ | grep -Ei "strict-transport|content-security|x-frame|x-content-type|referrer|permissions|cross-origin|cache-control|server"
   ```

   Danach: Scan auf securityheaders.com wiederholen (Ergebnis **A+**),
   `https://www.teamrestocks.de/` muss mit **301** auf die Hauptdomain zeigen,
   und eine erfundene Adresse wie `https://teamrestocks.de/gibtesnicht` muss
   die gestaltete 404-Seite liefern.

## Was die Security-Header setzen

| Header | vorher | jetzt |
| --- | --- | --- |
| `Strict-Transport-Security` | fehlte | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | fehlte | strikte Policy, alles `'self'` |
| `X-Frame-Options` | fehlte | `SAMEORIGIN` |
| `X-Content-Type-Options` | fehlte | `nosniff` |
| `Referrer-Policy` | fehlte | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | fehlte | alle ungenutzten Features aus |
| `Cross-Origin-Opener-Policy` | fehlte | `same-origin` |
| `Cross-Origin-Resource-Policy` | fehlte | `same-origin` |
| `Cross-Origin-Embedder-Policy` | fehlte | `credentialless` |
| `Server: nginx/1.24.0 (Ubuntu)` | verriet die Version | `server_tokens off` → nur noch `nginx` |

## Fallstricke

* **`add_header` vererbt nicht.** Sobald ein `location`-Block ein eigenes
  `add_header` enthält, verliert er *alle* Header aus dem Server-Block.
  `performance.conf` bindet die Security-Header deshalb in jedem
  `location`-Block erneut ein — bei eigenen Ergänzungen genauso vorgehen.

* **HSTS ist bindend.** Nach dem ersten Aufruf akzeptiert der Browser ein Jahr
  lang kein HTTP mehr für die Domain. Das TLS-Zertifikat muss dauerhaft gültig
  bleiben (Certbot-Renewal läuft ohnehin).

* **`includeSubDomains`** gilt auch für künftige Subdomains. Aktuell existieren
  `www` und `inventar` — beide per HTTPS erreichbar. Eine neue Subdomain
  braucht ab dann zwingend ein gültiges Zertifikat.

* **CSP erweitern**, falls später externe Dienste dazukommen: ein
  Analytics-Skript braucht einen Eintrag in `script-src` *und* `connect-src`,
  ein YouTube-Embed in `frame-src`. Verstöße stehen als `Refused to load …` in
  der Browser-Konsole.

* **Bild-Caching ist bewusst auf 30 Tage begrenzt** (kein `immutable`), weil
  die Dateinamen keine Version tragen. Wird ein Logo ausgetauscht, hängt die
  alte Datei damit höchstens einen Monat in fremden Caches — bei `immutable`
  wäre es ein Jahr. CSS und JS tragen dagegen `?v=` und sind deshalb auf ein
  Jahr gesetzt.

## Optional: Server-Header ganz entfernen

`server_tokens off` entfernt nur die Version. Wer den Header komplett loswerden
will, braucht das Modul `headers-more`:

```bash
sudo apt install nginx-extras
```

und dann im Server-Block:

```nginx
more_clear_headers Server;
```

## GitHub-Pages-Kopie

Unter `https://oliverregolin-cloud.github.io/team-restocks-website/` liegt eine
vollständige zweite Kopie der Seite. Seit der SEO-Überarbeitung zeigt das
`canonical` aller Seiten auf `https://teamrestocks.de/`, auch in der Kopie —
Google wertet damit die Hauptdomain als Original.

Sauberer wäre, GitHub Pages ganz abzuschalten (Repo → Settings → Pages →
Source auf *None*), falls die Kopie nicht gebraucht wird. Eigene
Response-Header lassen sich dort ohnehin nicht setzen, die Konfiguration in
diesem Ordner wirkt ausschließlich für `teamrestocks.de`.
