# Deployment — morrow-web

GitHub Actions menjalankan typecheck, lint, test, dan build, membangun image
nginx statis, mendorongnya ke GHCR, lalu server cukup **menarik image dan
menjalankan `docker compose up -d`**. Server tidak pernah mengompilasi apa pun.

Repo ini adalah frontend. Backend punya pipeline dan stack terpisah di repo
`morrow-api`; keduanya berjalan di server yang sama dan dilayani nginx host.

## File

| Path | Kegunaan |
| --- | --- |
| `.github/workflows/ci.yml` | Typecheck/lint/test/build → build & push GHCR → deploy lewat SSH (hanya tag `v*`) |
| `deploy/docker-compose.yml` | Stack yang dijalankan server (service `web`), disalin ke `/opt/morrow-web/` setiap rilis |
| `deploy/deploy.sh` | Disalin ke `/opt/morrow-web/deploy.sh` setiap rilis; pull, tulis tag, `up -d --wait` |
| `deploy/.env.example` | Contoh `/opt/morrow-web/.env` produksi |
| `deploy/nginx/morrow-web.conf` | File site nginx host |
| `Dockerfile` | Build Vite lalu sajikan `dist/` lewat nginx |
| `nginx.conf` | Server block di dalam image: SPA fallback dan cache policy |

## Image dan tag

```
ghcr.io/fahmikudo/morrow-web
```

Setiap build di `main` dan setiap rilis mendorong tag:

- `sha-<pendek>`: selalu. Ini yang dipakai untuk rollback.
- `edge`: ujung `main`.
- `X.Y.Z`, `X.Y`, `latest`: hanya dari tag rilis `vX.Y.Z`.

Merge ke `main` hanya mempublikasikan image. **Hanya tag `v*` yang men-deploy.**
Versi yang berjalan tertulis di `/opt/morrow-web/.env` pada baris
`MORROW_WEB_IMAGE_TAG`.

## Urutan rilis backend dan frontend

`VITE_API_URL` ditanam ke bundle saat build, jadi build frontend harus memakai
origin API yang sudah final. Rilis backend lebih dulu (kontrak API stabil),
lalu frontend. Keduanya punya version tag sendiri; tidak harus sama.

## Setup server, sekali saja

```bash
sudo install -d -o deploy -g deploy -m 750 /opt/morrow-web
```

Salin file pertama kali dari laptop (setelah itu CI yang memperbarui compose dan
`deploy.sh`):

```bash
scp deploy/docker-compose.yml deploy/deploy.sh deploy@<server>:/opt/morrow-web/
scp deploy/.env.example deploy@<server>:/opt/morrow-web/.env
ssh deploy@<server> 'chmod +x /opt/morrow-web/deploy.sh && chmod 600 /opt/morrow-web/.env'
```

Isi `/opt/morrow-web/.env`:

- `MORROW_WEB_IMAGE_TAG` dibiarkan kosong: `deploy.sh` yang mengisinya.
- `APP_PORT` (bawaan `8082`) harus sama dengan `upstream` di site nginx dan belum
  dipakai di server (`ss -ltn | grep :8082`).

`VITE_API_URL` tidak ada di file ini: nilainya berasal dari repository variable
dan ditanam saat build.

## Login GHCR

```bash
sudo -u deploy bash -c 'echo "$GHCR_READ_TOKEN" | docker login ghcr.io -u fahmikudo --password-stdin'
```

## Nginx

Cloudflare menangani TLS (mode Flexible); origin hanya HTTP port 80.

```bash
sudo cp deploy/nginx/morrow-web.conf /etc/nginx/sites-available/<web-site>.conf
sudo ln -s /etc/nginx/sites-available/<web-site>.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Domain di file itu sudah `mrrw.my.id`. `www` dialihkan ke domain kanonik.

## Secret dan variable GitHub

Environment **production** di repo `morrow-web`:

| Secret | Isi |
| --- | --- |
| `DEPLOY_HOST` | alamat server |
| `DEPLOY_PORT` | port SSH |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | private key deploy |
| `DEPLOY_KNOWN_HOSTS` | hasil `ssh-keyscan -p <port> <host>` |

Repository variable (Settings → Variables):

| Variable | Wajib | Isi |
| --- | --- | --- |
| `VITE_API_URL` | ya | origin API + prefix, misal `https://api.mrrw.my.id/api/v1` |
| `WEB_URL` | tidak | origin frontend untuk smoke test, misal `https://mrrw.my.id` |

Build gagal bila `VITE_API_URL` kosong: tanpa nilai itu aplikasi jatuh ke mode
`localStorage`, bukan mode server.

## Rilis

```bash
git tag v1.0.0
git push origin v1.0.0
```

Workflow menjalankan test dan build, membangun image, lalu lewat SSH:

1. menyalin `docker-compose.yml` dan `deploy.sh` ke `/opt/morrow-web/`;
2. menjalankan `/opt/morrow-web/deploy.sh MORROW_WEB_IMAGE_TAG 1.0.0 web`:
   pull → tulis tag ke `.env` → `docker compose up -d --wait` → prune;
3. smoke test `GET ${WEB_URL}/` bila variable diisi.

## Rollback

```bash
ssh deploy@<server>
cd /opt/morrow-web
sed -i 's|^MORROW_WEB_IMAGE_TAG=.*|MORROW_WEB_IMAGE_TAG=sha-xxxxxxx|' .env
docker compose up -d
```

## Mengecek deployment

```bash
ssh deploy@<server> 'cd /opt/morrow-web && docker compose ps'
curl -sI https://mrrw.my.id/     # 200
```

- `web` berstatus `healthy`.
- Log: `docker compose logs -f web`.

## Mengganti origin API atau domain

`VITE_API_URL` dan domain frontend ditanam saat build, jadi perubahan butuh
rilis baru: ubah variable, commit bila perlu, lalu push tag baru. Sesuaikan juga
`server_name` di site nginx serta `CORS_ORIGIN` di stack backend.
