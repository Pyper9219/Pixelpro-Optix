# Pixelpro-Optix

Riamxo Motors Limited — Kenya-focused advertising revenue web app. Members post sponsor ads on their WhatsApp status, earn KES 100 per view, and cash out via M-Pesa. Includes a casino-style Aviator crash game (demo mode).

## Stack

- **Backend:** Node.js + Express 4, MongoDB (Atlas) — screenshots and ad creatives are stored inline as data URLs
- **Frontend:** Vanilla JS single-page app (hash router, Tailwind-style CSS), Canvas 2D crash game
- **Auth:** scrypt password hashing + HMAC-SHA256 session tokens
- **Admin:** first registered user becomes admin; approves withdrawals & deposits

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string (allowlist your IP / `0.0.0.0/0`) |
| `MONGODB_DB` | Database name, default `aviator-web` |
| `RIAMXO_SECRET` | Session-signing secret — must be identical on every instance or logins drop on cold starts |

Indexes are created on boot. In Vercel, set the same three variables under Project → Settings → Environment Variables.

## Getting started

```bash
npm install
npm start        # http://localhost:3000
npm test         # smoke suite: spawns its own server against a throwaway database, then drops it
node scripts/migrate-to-mongo.js --admin=you@example.com   # one-off import of data/db.json
```

> `npm test` needs a reachable MongoDB. For a disposable local instance:
> `npm i --no-save mongodb-memory-server` and run the suite with `MONGODB_URI` pointed at it.

## Features

- View submissions with screenshot upload and a 24-hour cooldown
- Server-side balance math (earned − approved − pending)
- Withdrawals via M-Pesa / bank transfer with admin approval
- Deposit activation via M-Pesa transaction code with admin approval
- Aviator crash game: dual bet panels, auto-bet, auto-cashout, provably-fair hash display
- Notifications, dashboard charts, settings hub, dark theme
