# Shubham Sunny DSA Sheet

A full-stack DSA learning web app that turns a structured problem sheet (450+ problems) into a **daily habit** — with coins, badges, progress tracking, Monaco IDE, interview timer, favorites, and an admin CMS.

**Stack:** Astro + React + Ant Design · Node.js + Express + MongoDB

---

## Features

| Area | What you get |
|------|----------------|
| **Dashboard** | Bento grid: coins, session timer, progress, badges, favorites, time stats, activity calendar, focus chart, email reminders, collab |
| **DSA Sheet** | 30+ chapters on one scrollable page — filter by difficulty & company, numbered problem cards |
| **Problem page** | Statement, Monaco IDE, YouTube, links, 45-min timer, notes, community insights, time bar chart |
| **Favorites** | Table page: starred problems, time spent, last opened |
| **Wallet** | 5 coins per solve · withdraw via UPI or donate |
| **Search** | Cmd+K command palette — jump to any problem |
| **Admin** | Excel import, analytics, password-gated panel |

---

## Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env — MONGODB_URI, JWT_SECRET, SMTP (optional)

# 3. Load DSA sheet from Excel
npm run enrich:sheet

# 4. Run (two terminals)
npm run dev:server   # API → http://localhost:5001
npm run dev:web      # App → http://localhost:4321
```

### Admin access
- Register/login with admin email (see `server/src/constants.js`)
- Admin panel: `http://localhost:4321/admin`
- Set `ADMIN_PANEL_PASSWORD` in `server/.env`

### Optional — dummy time data for charts
```bash
npm run seed:time -- your@email.com
```

---

## Project Structure

```
DSA Web/
├── web/                    Astro + React frontend (port 4321)
│   └── src/
│       ├── components/     Dashboard, problem page, layout, UI
│       └── lib/api.ts      API client
├── server/                 Express API (port 5001)
│   └── src/
│       ├── controllers/    Route handlers
│       ├── services/       Sheet import, email scheduler, cache
│       └── models/         MongoDB schemas
├── docs/                   Documentation + Excel data
│   ├── strivers-a2z-dsa.xlsx
│   ├── SHEETSTACK_DEMO_SCRIPT.md
│   ├── SHEETSTACK_TECHNICAL_GUIDE.md
│   └── *.pdf               Generated PDFs (run docs:pdf)
└── scripts/                PDF generator
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start Express API |
| `npm run dev:web` | Start Astro dev server |
| `npm run seed` | Load Excel sheet + ensure admin user |
| `npm run enrich:sheet` | Fill missing descriptions in Excel + import |
| `npm run build:web` | Production static build |
| `npm run docs:pdf` | Generate demo + technical PDFs |
| `npm run seed:time` | Seed dummy time logs for demo charts |

---

## Documentation (PDFs)

| Document | Purpose |
|----------|---------|
| [Demo Script (MD)](./docs/SHEETSTACK_DEMO_SCRIPT.md) | Live demo flow, benefits, pitch script |
| [Technical Guide (MD)](./docs/SHEETSTACK_TECHNICAL_GUIDE.md) | System design, DFD diagrams, scalability, tech stack |
| [Demo Script (PDF)](./docs/Shubham-Sunny-DSA-Demo-Script.pdf) | Printable pitch script |
| [Technical Guide (PDF)](./docs/Shubham-Sunny-DSA-Technical-Guide.pdf) | Printable system design doc |

Generate PDFs anytime:

```bash
pip install fpdf2   # first time only
npm run docs:pdf
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Astro 4, React 18, Ant Design, Monaco Editor, Recharts |
| Backend | Express 4, Mongoose, JWT, bcrypt, xlsx, nodemailer, node-cron |
| Database | MongoDB Atlas |
| Auth | JWT (stateless) — scales horizontally |
| Caching | In-memory sheet cache (120s TTL) |

**Scale target:** 40,000–50,000 users with horizontal API scaling + MongoDB Atlas + CDN. See [Technical Guide](./docs/SHEETSTACK_TECHNICAL_GUIDE.md).

---

## Gamification

- **5 coins** per problem marked solved  
- **2 coins** per correct quiz answer  
- **1 coin = 10 paise** (₹0.10)  
- **Badges:** first solve, 10 solves, 50 solves, 7-day streak, quiz master  

---

## SMTP (email reminders)

Add to `server/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app-password
SMTP_FROM=your@gmail.com
REMINDER_CRON=0 9 * * *
CLIENT_URL=http://localhost:4321
```

---

## License

Private / educational project — Shubham Sunny.
