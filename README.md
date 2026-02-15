# NC Leg Tracker

Real-time legislative tracking dashboard for the **North Carolina General Assembly**. Built with Next.js 14, designed for one-click Vercel deployment.

## Features

- **All Bills Feed** — Complete bill listing with last action from the 2025–2026 session
- **Recently Filed** — Bills with activity in the last 7 days
- **Enacted Bills** — Chaptered legislation signed into law
- **Governor Action** — Bills pending, signed, or vetoed by the governor
- **Active Committees** — All standing, non-standing, and joint committees
- **Healthcare Flagging** — Automatic keyword-based detection of health-related bills with visual highlighting
- **Full-Text Search** — Search across bill numbers, titles, and action descriptions
- **Chamber Filters** — Filter by House, Senate, or All
- **On-Demand Refresh** — Fresh data from ncleg.gov on every load/refresh

## Data Sources

All data comes from the [NC General Assembly Web Services API](https://www.ncleg.gov/About/Webservices):

| Endpoint | Data |
|----------|------|
| `/Legislation/Bills/LastActionByYear/{year}/All/RSS` | All bills with last action |
| `/Legislation/Bills/LastActionByYear/{year}/All/Chaptered/RSS` | Enacted bills |
| `/Legislation/Bills/WithAction/{year}/400/RSS` | Governor-signed bills |
| `/Legislation/Bills/PendingGovernorSignature/{year}/RSS` | Pending governor action |
| `webservices.ncleg.gov/AllActiveCommittees/{year}/true` | Active committees (JSON) |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deploy to Vercel

### Option 1: One-Click Deploy
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — no environment variables needed

### Option 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

## Architecture

```
ncleg-tracker/
├── app/
│   ├── api/
│   │   ├── bills/route.js       # Proxy for NCGA bill RSS feeds
│   │   └── committees/route.js  # Proxy for NCGA committee JSON API
│   ├── components/
│   │   ├── Dashboard.js         # Main interactive dashboard
│   │   ├── BillCard.js          # Individual bill display
│   │   ├── CommitteeCard.js     # Committee list item
│   │   └── StatCard.js          # Stats summary card
│   ├── globals.css              # Global styles + CSS variables
│   ├── layout.js                # Root layout with metadata
│   └── page.js                  # Entry point
├── lib/
│   ├── constants.js             # Session config, health keywords, utilities
│   └── parser.js                # RSS XML → JSON parser
├── vercel.json                  # Vercel deployment config (IAD1 region)
├── next.config.js               # Next.js configuration
└── package.json
```

### Why server-side API routes?

The NCGA APIs don't include CORS headers, so browser-side `fetch` calls would fail. The Next.js API routes in `/app/api/` act as a server-side proxy — they fetch from ncleg.gov on Vercel's servers and return clean JSON to the client. This also enables Vercel's edge caching (5-minute TTL for bills, 1-hour for committees).

## Healthcare Keyword Matching

Bills are flagged as health-related if their title or description contains any of 80+ keywords covering:

- **Programs**: Medicaid, Medicare, 340B, CHIP
- **Facilities**: Hospital, ambulatory, surgical center, critical access, nursing
- **Professionals**: Physician, nurse, pharmacy, scope of practice, licensure
- **Conditions**: Opioid, fentanyl, mental health, diabetes, cancer, chronic
- **Policy**: Certificate of need, prior authorization, value-based, managed care
- **Equity**: Health equity, disparities, social determinants, rural health

Keywords are maintained in `lib/constants.js` and can be easily extended.

## Customization

### Change Session Year
Edit `SESSION_YEAR` in `lib/constants.js`:
```js
export const SESSION_YEAR = "2025"; // Change to "2027" for next session
```

### Add Keywords
Add to the `HEALTH_KEYWORDS` array in `lib/constants.js`.

### Adjust Cache Duration
Edit `revalidate` values in the API route files:
- `app/api/bills/route.js` — currently 300 seconds (5 min)
- `app/api/committees/route.js` — currently 3600 seconds (1 hour)

## License

MIT
