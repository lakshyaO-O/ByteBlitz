# DevRann Multiplayer System Guide

## Overview
DevRann now features a **complete real-time multiplayer competitive coding system** with matchmaking, synchronized battles, and ELO rating updates.

## Components Implemented

### 1. **Real Statistics** (`src/firebase/stats/use-stats.tsx`)
- Fetches actual game statistics from Firestore
- Displays on homepage:
  - Total registered players
  - Total battles played
  - Average code execution time
  - Currently active battles

### 2. **Real-Time Matchmaking** (`src/hooks/use-matchmaking.ts`)
- Finds opponents with similar ELO ratings
- Expands search radius every 2 seconds if no match found
- ELO ranges: ±100, ±150, ±200, ±300, ±500
- Returns opponent information when match is found

**Endpoint:** `POST /api/matchmaking/find-opponent`
```json
Request: { userId, rating, tier }
Response: { found: boolean, opponent: {...}, battleId }
```

### 3. **Synchronized Battle Logic** (`src/components/arena/BattleArenaMultiplayer.tsx`)
Features:
- ✅ Real-time countdown timer (20 minutes)
- ✅ Code submission with test case validation
- ✅ Score calculation (0-100 points)
- ✅ Live opponent progress tracking
- ✅ Battle result determination (WIN/LOSS/DRAW)
- ✅ Console output with battle logs
- ✅ Hint system (AI-powered)
- ✅ Automatic opponent score simulation

### 4. **ELO Rating System** (`src/app/api/battles/calculate-elo/route.ts`)
Implements **standard chess ELO algorithm**:
- K-factor: 32 (standard for competitive games)
- Formula: `newRating = rating + K * (actualScore - expectedScore)`
- Updates:
  - Player ratings
  - Win/Loss/Draw counts
  - Highest rating (peak tracking)

**Endpoint:** `POST /api/battles/calculate-elo`
```json
Request: { userId1, userId2, score1, score2 }
Response: { player1: {...}, player2: {...} }
```

### 5. **Battle Persistence** (`src/app/api/battles/submit/route.ts`)
Saves battle records to Firestore:
- Individual player combat logs
- Global battle leaderboard
- Opponent history
- Problem & execution data

**Endpoint:** `POST /api/battles/submit`
```json
Request: { 
  battleId, userId1, userId2, 
  code1, code2,
  score1, score2,
  timeUsed1, timeUsed2,
  problemId, problemTitle
}
```

## Database Schema

### Firestore Collections

#### `users` collection
```json
{
  "uid": "firebase_user_id",
  "username": "string",
  "rating": 1200,
  "highestRating": 1200,
  "wins": 0,
  "losses": 0,
  "draws": 0,
  "xp": 0,
  "level": 1,
  "tier": "Beginner|Learner|Intermediate|Advanced|Expert|Master",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `users/{userId}/combatLogs` subcollection
```json
{
  "battleId": "string",
  "opponentId": "string",
  "opponentName": "string",
  "result": "WIN|LOSS|DRAW",
  "yourScore": 100,
  "opponentScore": 85,
  "timeUsed": 450,
  "opponentTimeUsed": 580,
  "problem": {
    "id": "two-sum",
    "title": "Two Sum"
  },
  "timestamp": "timestamp"
}
```

#### `battles` collection (global)
```json
{
  "battleId": "string",
  "player1Id": "string",
  "player1Name": "string",
  "player2Id": "string",
  "player2Name": "string",
  "score1": 100,
  "score2": 85,
  "result1": "WIN|LOSS|DRAW",
  "result2": "LOSS|WIN|DRAW",
  "timeUsed1": 450,
  "timeUsed2": 580,
  "problem": {
    "id": "two-sum",
    "title": "Two Sum"
  },
  "timestamp": "timestamp"
}
```

#### `matchmaking` collection (queue)
```json
{
  "userId": "string",
  "username": "string",
  "rating": 1200,
  "tier": "Beginner",
  "status": "waiting|matched",
  "createdAt": "timestamp"
}
```

## Matchmaking Flow

```
1. User clicks "ENTER MATCHMAKING"
   ↓
2. Added to matchmaking queue
   ↓
3. System searches for opponent every 2 seconds
   ↓
4. If found within ELO range:
   - Both marked as "matched"
   - Battle initiated
   ↓
5. If not found after 15 seconds:
   - ELO search radius expands
   - Try again (±100 → ±500)
```

## Battle Flow

```
1. Both players see opponent info
   ↓
2. 20-minute countdown starts
   ↓
3. Player codes solution to problem
   ↓
4. Player clicks SUBMIT
   ↓
5. Code validated locally (test cases)
   ↓
6. Score calculated (0-100 points)
   ↓
7. Opponent score simulated*
   ↓
8. Battle result determined (WIN/LOSS/DRAW)
   ↓
9. ELO updated
   ↓
10. Battle saved to Firestore
    ↓
11. Combat log displayed
```

*Currently opponent score is simulated. In production, use real-time Firestore listeners for actual sync.

## Setup Instructions

### Step 1: Firebase Configuration
1. Create `.env.local` with Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

2. Enable in Firebase Console:
   - ✅ Firestore Database (test mode)
   - ✅ Firebase Authentication (Google sign-in)

### Step 2: Create Collections (Manual or Auto)
Run the app - it will auto-create collections on first use.

Or manually create in Firebase Console:
- `users`
- `battles`
- `matchmaking`

### Step 3: Start Dev Server
```bash
npm run dev
```

### Step 4: Test Multiplayer
1. Create 2 test accounts
2. One enters matchmaking from incognito window
3. Other joins from regular window
4. They should match and start battle

## API Endpoints

### POST `/api/matchmaking/find-opponent`
Find or create opponent match
- Request: `{ userId, rating, tier }`
- Response: `{ found: boolean, opponent, battleId }`

### DELETE `/api/matchmaking/find-opponent`
Cancel matchmaking search
- Request: `{ userId }`
- Response: `{ success: boolean }`

### POST `/api/battles/submit`
Save battle result
- Request: See schema above
- Response: `{ success: boolean, battleId, player1Result, player2Result }`

### POST `/api/battles/calculate-elo`
Update player ELO ratings
- Request: `{ userId1, userId2, score1, score2 }`
- Response: `{ player1, player2 }` with new ratings and ELO changes

## Future Enhancements

- [ ] Real-time code sync using Firestore Realtime Database
- [ ] WebSocket for instant opponent updates
- [ ] Multiple coding problems per battle
- [ ] AI opponent mode
- [ ] Replay system
- [ ] Team battles (2v2, 3v3)
- [ ] Seasonal rankings & leaderboards
- [ ] Custom rating tiers
- [ ] Achievement system

## Troubleshooting

**No opponents found?**
- Check Firestore connection
- Ensure both players have user profiles created
- Test with different ELO ratings

**ELO not updating?**
- Verify Firebase Admin SDK credentials
- Check `/api/battles/calculate-elo` logs
- Ensure battle data saved to Firestore

**Matchmaking slow?**
- Current implementation polls every 2 seconds
- For production: use Firestore Listeners for instant updates

## Support
For issues, check:
1. Firebase Console for data validation
2. Browser console for client errors
3. Terminal logs for API errors
