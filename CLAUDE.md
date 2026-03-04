# Emotion Orchard — Development Guidelines

## Project Structure

```
emotion-orchard/
├── src/                    # React frontend (Vite)
│   ├── components/         # React components
│   ├── contexts/           # AuthContext
│   ├── data/               # Emotions data
│   ├── lib/                # Supabase client
│   └── styles/             # CSS per component
├── backend/                # Express API server
│   ├── middleware/          # Auth, rate limiting
│   ├── lib/                # AI usage, cost tracking
│   └── routes/             # API routes
├── ios/                    # iOS app (SwiftUI)
│   └── EmotionOrchard/
└── supabase/
    └── migrations/         # Database migrations
```

## How to Run Locally

```bash
# Frontend (port 3006)
npm install && npm run dev

# Backend (port 3007)
cd backend && npm install && node --watch server.js
```

## Tech Stack
- **Frontend**: React 18 + Vite, Lucide icons, CSS modules
- **Backend**: Express, Supabase (service role), Anthropic SDK
- **Database**: Supabase PostgreSQL (shared project tdjyqykkngyflqkjuzai)
- **iOS**: SwiftUI, URLSession API client
- **AI**: Claude Haiku 4.5 for chat companion

## Architecture
Part of the Product Hacker ecosystem. Shares:
- Supabase auth (same project, `eo_` table prefix)
- BlankSlate feedback pipeline (`tc_feature_requests` with `emotion-orchard` tag)
- AI cost tracking (`tc_skill_executions` with `app='emotion-orchard'`)
- Tao Data observability (fire-and-forget traces)

## Database Tables
| Table | Purpose |
|-------|---------|
| `eo_trees` | User's trees (emotion or gratitude type) |
| `eo_leaves` | Leaves on trees with emotion/color/position |
| `eo_comments` | Comments on public trees |
| `eo_chat_messages` | AI chat history |

## Brand Styling
Follows Product Hacker amber/dark brand with nature-inspired overlay:
- Background: `#000` with subtle green gradients for tree area
- Accent: `#f59e0b` (amber) for buttons and active states
- Font: Nunito for display, SF Mono for labels/metadata
- Tree SVGs: procedurally generated with organic bezier curves

## Core Concepts
- **Emotion Tree**: Tap emotions to grow colored leaves (max 30 per tree)
- **Gratitude Tree**: Add blossoms dedicated to people you appreciate
- **Orchard**: Collection of all trees, scrollable grid view
- **Insights**: Emotion distribution, balance meter, patterns
- **Chat**: AI companion for emotional reflection

## Key Files
- `src/components/TreeCanvas.jsx` — SVG tree rendering engine
- `src/data/emotions.js` — 14 emotions with colors
- `backend/routes/chat.js` — AI chat with 3 analysis tools
- `backend/routes/leaves.js` — Leaf CRUD with position calculation
