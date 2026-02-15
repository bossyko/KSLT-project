# KSLT — Kyrgyzstan Social Lawn Tennis

Official website for the first tennis community in Kyrgyzstan, uniting amateurs and professionals through organized tournaments, rankings, and events.

**Live:** [kslt.kg](https://kslt.kg)

---

## Overview

KSLT is a multi-language (RU / EN / KG) tennis platform featuring:

- **Tournament System** — Browse upcoming and past tournaments with filtering by category (Pro-Masters, Masters, Challenger, Futures, Tour, Friendly)
- **Tournament Brackets** — Interactive Single Elimination (16/32 draw) and Round Robin brackets with match scores, seedings, and connectors
- **Bracket Generator** — Auto-generates tournament brackets from player lists with ATP-standard seeding positions
- **Match Schedule** — Day-by-day schedule with court assignments and live status
- **Player Rankings** — Singles and doubles rankings for men and women
- **Live Streams** — Real-time match streaming section
- **Responsive Design** — Fully adaptive from desktop to mobile (375px+)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5, semantic sections |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6) |
| Design | Dark theme, electric lime accent (#CCFF00), Inter font |
| Hosting | Static site |

---

## Project Structure

```
KSLT/
├── index.html / index-en.html / index-kg.html   # Main pages (RU/EN/KG)
├── tournaments.html / tournaments-en.html         # Tournament list pages
├── tournament.html / tournament-en.html           # Tournament detail pages
├── auth.html / auth-en.html                       # Authentication pages
├── style.css                                      # Global styles & design system
├── tournaments.css                                # Tournament list styles
├── tournament-detail.css                          # Tournament detail styles
├── script.js                                      # Main site logic
├── tournaments-data.js / tournaments-data-en.js   # Tournament list data
├── tournament-detail-data.js / -en.js             # Tournament detail data
├── tournament-detail.js                           # Bracket & schedule renderer
├── tournament-generator.js                        # Bracket auto-generator
├── pics/                                          # Static assets
└── README.md
```

---

## Tournament Bracket Generator

The generator (`tournament-generator.js`) creates complete tournament structures from a player list:

```javascript
generateTournament({
  id: "tournament-1",
  players: [...],          // Array of { id, name, ranking, country }
  bracketType: "single_elimination", // or "round_robin"
  drawSize: 32,            // 16 or 32
  courts: 4,
  matchDuration: 90,
  days: 3,
  lang: "en"               // "ru" or "en"
});
```

**Features:**
- ATP-standard seeding: 8 seeds for 32-draw, 4 seeds for 16-draw
- Proper seed placement (positions 1, 32, 17, 16, 9, 24, 25, 8)
- Round Robin with serpentine group distribution
- Smart schedule distribution respecting round boundaries

---

## Key Features

### Multi-Language Support
Three language versions with consistent UI. Language switcher preserves page state and query parameters across navigation.

### Tournament Categories
Six tournament tiers with distinct branding:
- **Pro-Masters** — Elite level
- **Masters** — Advanced
- **Challenger** — Intermediate
- **Futures** — Entry level
- **Tour** — Community events
- **Friendly** — Casual matches

### Responsive Breakpoints
- `1200px` — Desktop large
- `992px` — Desktop / tablet landscape
- `768px` — Tablet portrait
- `480px` — Mobile

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone git@github.com:bossyko/KSLT-project.git
   ```
2. Open `index.html` in a browser — no build tools required.

---

## License

All rights reserved. &copy; 2026 KSLT.
