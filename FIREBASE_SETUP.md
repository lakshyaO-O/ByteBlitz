# Firebase Configuration Guide

To use real multiplayer features, you need to set up Firebase:

## 1. Create Firebase Project
- Go to https://console.firebase.google.com
- Click "Create a project"
- Name it "DevRann"
- Enable Google Analytics (optional)

## 2. Get Your Credentials
In Firebase Console:
1. Go to Project Settings (⚙️)
2. Copy these values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

## 3. Create .env.local
Create `c:\Users\nothing\Downloads\download\ByteBlitz\.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 4. Enable Firestore
In Firebase Console:
- Build → Firestore Database → Create Database
- Start in test mode (development)
- Choose region closest to you

## 5. Enable Authentication
In Firebase Console:
- Build → Authentication → Get Started
- Enable "Google" sign-in method

## 6. Create Firestore Collections
The app will auto-create these, but here's the schema:

### `users` collection
```json
{
  "username": "string",
  "rating": 1200,
  "highestRating": 1200,
  "wins": 0,
  "losses": 0,
  "draws": 0,
  "xp": 0,
  "level": 1,
  "tier": "Beginner",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `battles` subcollection (under each user)
```json
{
  "opponentId": "string",
  "opponentName": "string",
  "result": "WIN|LOSS|DRAW",
  "yourCode": "string",
  "opponentCode": "string",
  "yourScore": 100,
  "opponentScore": 85,
  "problem": {
    "id": "string",
    "title": "string"
  },
  "timeLimit": 1200,
  "timeUsed": 450,
  "eloChange": 25,
  "timestamp": "timestamp"
}
```

### `matchmaking` collection
```json
{
  "userId": "string",
  "username": "string",
  "rating": 1200,
  "tier": "Beginner",
  "status": "waiting",
  "createdAt": "timestamp"
}
```

Once you've set up Firebase and updated `.env.local`, restart the dev server.
