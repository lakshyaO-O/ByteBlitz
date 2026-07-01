# DevRann — Competitive Coding Arena

The ultimate esports-inspired competitive coding platform. Compete in 1v1 battles, climb the ELO ladder, solve challenges, and become a legendary architect.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Authentication:** Firebase Auth (Email/Password + Google Sign-In)
- **Database:** Cloud Firestore
- **AI:** Google Gemini (GenKit) — Code Review & Problem Hints
- **Mobile:** Capacitor v8 (Android APK)
- **Deployment:** Firebase Hosting / Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project (for auth & database)

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `GEMINI_API_KEY` | Google AI API Key (for AI features) |

> **Note:** Without Firebase credentials, the app runs in **demo mode** using localStorage for auth and mock data.

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:9002](http://localhost:9002).

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 9002) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run android:apk` | Build Android APK |

## Architecture

```
src/
├── app/                    # Next.js App Router pages & API
│   ├── achievements/       # Achievement showcase
│   ├── arena/              # Battle arena + matchmaking
│   ├── arena/congrats/     # Victory screen
│   ├── auth/               # Sign in / sign up
│   ├── challenges/         # Daily & weekly challenges
│   ├── contests/           # Coding competitions
│   ├── dashboard/          # User dashboard
│   ├── friends/            # Friends list & requests
│   ├── leaderboard/        # Global rankings
│   ├── notifications/      # In-app notifications
│   ├── practice/           # Practice problems
│   ├── problems/           # Problem archive
│   ├── profile/            # User profile page
│   ├── progress/           # Progress tracking
│   ├── rooms/              # Game rooms lobby
│   ├── search/             # Search users & problems
│   ├── settings/           # User settings
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── ai/                     # GenKit AI flows
│   └── flows/
│       ├── code-review-assistant-flow.ts
│       └── problem-hint-generator.ts
├── components/
│   ├── arena/              # Arena-specific components
│   ├── common/             # Shared components
│   ├── layout/             # Shell, sidebar
│   ├── settings/           # Settings modal
│   └── ui/                 # shadcn/ui components
├── firebase/
│   ├── auth/               # Auth hooks
│   ├── firestore/          # Firestore hooks
│   ├── stats/              # Global stats
│   ├── config.ts           # Firebase config
│   ├── errors.ts           # Error types
│   ├── index.ts            # Init & re-exports
│   └── provider.tsx        # Firebase context
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── middleware.ts           # Route protection
├── store/                  # App state (context)
├── types/                  # TypeScript interfaces
└── services/               # Service layer (extensible)
```

## Features

- **1v1 Battles** — Real-time matchmaking with ELO-based opponents
- **Practice Zone** — Curated coding challenges with difficulty tiers
- **Leaderboards** — Global rankings with ELO rating system
- **Contests** — Timed coding competitions with prizes
- **Challenges** — Daily & weekly coding challenges
- **Achievements** — Milestone-based rewards system
- **Profile** — Detailed user statistics and history
- **Progress Tracking** — Visual progress with leveling system
- **Friends** — Add friends, send requests, challenge to battles
- **Notifications** — Real-time in-app notifications
- **Search** — Search players and problems
- **Game Rooms** — Create/join private rooms with codes
- **AI Code Review** — Get AI-powered feedback on your code
- **AI Hints** — Get subtle hints when stuck on problems
- **Settings** — Profile editing, theme toggle, account management
- **Authentication** — Email/Password + Google Sign-In
- **Dark/Light Theme** — Persistent theme preference

## Mobile Build

### Android APK

```bash
npm run build
npx cap sync android
cd android && .\gradlew.bat assembleDebug
```

The APK will be generated at `android/app/build/outputs/apk/debug/`.

### Capacitor Configuration

See `capacitor.config.ts` for app ID, name, and splash screen settings.

## Firebase Security Rules

The project includes `firestore.rules` with proper security rules covering all collections (`users`, `matches`, `gameRooms`, `leaderboard`, etc.). Rules enforce authentication checks and data ownership.

## Performance Optimizations

- Middleware-based route protection (no client-side flicker)
- Optimized bundle size (removed 8 unused dependencies)
- Lazy-loaded page components via Next.js App Router
- Efficient Firestore queries with limits and indexes
- Skeleton loaders and loading states on all pages

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Vercel

```bash
npm run build
vercel --prod
```

## License

MIT
