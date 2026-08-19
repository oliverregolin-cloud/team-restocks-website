# Security-Header ausrollen

Der Scan von [securityheaders.com](https://securityheaders.com/?q=https%3A%2F%2Fteamrestocks.de%2F&followRedirects=on)
vom **19.08.2026** hat `teamrestocks.de` mit **F** bewertet: es wurde kein
einziger Security-Header ausgeliefert.

| Header | Report | jetzt gesetzt auf |
| --- | --- | --- |
| `Strict-Transport-Security` | fehlte | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | fehlte | strikte Policy, alles `'self'` |
| `X-Frame-Options` | fehlte | `SAMEORIGIN` |
| `X-Content-Type-Options` | fehlte | `nosniff` |
| `Referrer-Policy` | fehlte | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | fehlte | alle ungenutzten Features aus |
| `Cross-Origin-Opener-Policy` | "Upcoming" | `same-origin` |
| `Cross-Origin-Resource-Policy` | "Upcoming" | `same-origin` |
| `Cross-Origin-Embedder-Policy` | "Upcoming" | `credentialless` |
| `Server: nginx/1.24.0 (Ubuntu)` | verraet Version | `server_tokens off` -> nur noch `nginx` |

Die Header stecken in [`nginx/security-headers.conf`](nginx/security-headers.conf).
Die HTML-Dateien selbst mussten dafuer **nicht** angefasst werden.

## Installation auf dem Webserver (217.160.22.196)

Alle Schritte als `root` bzw. mit `sudo` auf dem Server:

1. Snippet aus dem Repo holen und ablegen:

   ```bash
   sudo mkdir -p /etc/nginx/snippets
   sudo curl -fsSL https://raw.githubusercontent.com/oliverregolin-cloud/team-restocks-website/main/deploy/nginx/security-headers.conf -o /etc/nginx/snippets/security-headers.conf
   ```

2. In der Site-Config (meist `/etc/nginx/sites-enabled/teamrestocks.de`) im
   **HTTPS**-Server-Block eine Zeile ergaenzen:

   ```nginx
   server {
       listen 443 ssl http2;
       server_name teamrestocks.de www.teamrestocks.de;

       include snippets/security-headers.conf;   # <-- diese Zeile

       root /var/www/teamrestocks.de;
       index index.html;
       ...
   }
   ```

3. Config pruefen und neu laden:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Ergebnis kontrollieren:

   ```bash
   curl -sSI https://teamrestocks.de/ | grep -Ei "strict-transport|content-security|x-frame|x-content-type|referrer|permissions|cross-origin|server"
   ```

   Danach den Scan auf securityheaders.com wiederholen - Ergebnis: **A+**.

## Fallstricke

* **`add_header` vererbt nicht.** Sobald ein `location`-Block ein eigenes
  `add_header` enthaelt (z. B. `Cache-Control` fuer Assets), verliert er
  *alle* Header aus dem Server-Block. In solchen Bloecken das Snippet
  einfach erneut einbinden:

  ```nginx
  location ~* \.(?:css|js|woff2|png)$ {
      include snippets/security-headers.conf;
      add_header Cache-Control "public, max-age=31536000, immutable" always;
  }
  ```

* **HSTS ist bindend.** Nach dem ersten Aufruf akzeptiert der Browser ein
  Jahr lang kein HTTP mehr fuer die Domain. Das TLS-Zertifikat muss also
  dauerhaft gueltig bleiben (Certbot-Renewal laeuft ohnehin).

* **`includeSubDomains`** gilt auch fuer kuenftige Subdomains. Aktuell
  existiert nur `www` (CNAME auf die Apex, per HTTPS erreichbar). Eine neue
  Subdomain braucht ab dann zwingend ein gueltiges Zertifikat.

* **CSP erweitern**, falls spaeter externe Dienste dazukommen: ein Analytics-
  Skript braucht einen Eintrag in `script-src` *und* `connect-src`, ein
  YouTube-Embed in `frame-src`. Verstoesse stehen als `Refused to load ...`
  in der Browser-Konsole.

## Optional: Server-Header ganz entfernen

`server_tokens off` entfernt nur die Version. Wer den Header komplett
loswerden will, braucht das Modul `headers-more`:

```bash
sudo apt install nginx-extras
```

und dann im Server-Block:

```nginx
more_clear_headers Server;
```

## Hinweis zur GitHub-Pages-Kopie

`https://oliverregolin-cloud.github.io/team-restocks-website/` (aktuell als
`canonical` in den HTML-Dateien hinterlegt) liegt auf GitHub Pages. Dort
lassen sich keine eigenen Response-Header setzen - die Konfiguration hier
wirkt ausschliesslich fuer `teamrestocks.de`.
