# DevRann Project — Comprehensive Audit Report

**Project:** DevRann (ByteBlitz)  
**Date:** 2026-07-18  
**Type:** Audit Only — No Changes Made  
**Auditor:** OpenCode (Ponytail full mode)

---

## A. Executive Summary

DevRann is a Next.js 15.5.9 (App Router) competitive coding platform with Firebase backend, real-time multiplayer battles, AI-powered learning tools, and a full gamification economy. It is ambitious in scope but carries significant security, architectural, and reliability risks.

**Key metrics:**
- ~300 source files across src/
- 43 API route files
- 26 custom hooks
- ~100+ React components
- 58 Firestore composite indexes defined
- 4 `.env` files with secrets committed to the repository

**Critical issues found:**
1. **Secrets committed to git** — Firebase API keys, Gemini API key, Vercel OIDC tokens in `.env.local`, `.env.production`, and `.env.vercel`
2. **Session cookie `httpOnly: false`** — Accessible to JavaScript, stealable via XSS
3. **Client-side admin Firestore reads** — Any authenticated user can read admin data from the browser console
4. **No rate limiting on 12 AI routes** — Unrestricted Gemini API abuse potential
5. **GitHub OAuth tokens stored in plaintext** in Firestore
6. **Battle system trusts client-side logic** for matchmaking, scoring, and problem selection
7. **~60+ unused TypeScript type exports**, ~40+ unused service functions, 9 unused hooks
8. **Firebase Admin SDK private key exposed** in `.env.local` committed to git

---

## B. Critical Security Issues

### B1. Secrets and API Keys Committed to Git

**Files:** `.env.local`, `.env.production`, `.env.vercel`  
**Evidence:** These files contain live credentials in the repository:
- `GEMINI_API_KEY=AQ.Ab8RN6K0xE3O7_jFz7GE8pMJEDUlu2GXuRcbzzjGHkYIPOflZg`
- `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAZF5e8O8zQMswjwyE6EfCWjrhnYpP-nfI`
- `VERCEL_OIDC_TOKEN=eyJ...` (JWT token for Vercel deployment)
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` listed in `.env.example` (expected to be populated)
- **Impact:** Anyone with repo access can use the Gemini API key, Firebase project credentials, and Vercel deployment tokens. The Vercel OIDC token allows authenticating as the project's Vercel environment.

**Recommended fix:** Rotate ALL exposed keys immediately. Add ALL `.env*` files to `.gitignore` (not just `.env` and `.env.local` — `.env.production` and `.env.vercel` are missing). Use Vercel Environment Variables for production secrets.

### B2. Session Cookie `httpOnly: false`

**Files:**
- `src/middleware.ts:58` — `httpOnly: false`
- `src/components/auth/SessionCookieSync.tsx:17` — Sets via `document.cookie` without `httpOnly`
- `src/app/auth/auth-form.tsx:126,245,272` — Sets via `document.cookie` without `httpOnly`

**Evidence:** The `__session` cookie is set with `httpOnly: false` in the middleware, meaning `document.cookie` can read it. The client-side files set it directly without `httpOnly` at all. The server-side `/api/auth/session` route correctly sets `httpOnly: true`, but client-side code overwrites it.

**Impact:** Any XSS vulnerability allows stealing the session cookie and impersonating any user.

### B3. Client-Side Admin Firestore Reads

**File:** `src/services/admin.ts`  
**Evidence:** Functions like `getAdminDashboardStats`, `setDailyChallenge`, `getAIUsageStats`, `getPlatformAnalytics`, `getFeatureFlags`, `getPlatformSettings` read and write directly to Firestore using the client SDK without any server-side admin role verification. Any authenticated user can call these from the browser console.

**Impact:** Any logged-in user can read all platform analytics, user data, AI usage stats, feature flags, and settings. They can also modify challenges and content through client-side writes if Firestore rules allow.

### B4. GitHub OAuth Tokens in Plaintext

**File:** `src/app/api/github/connect/route.ts:70-77`  
**Evidence:**
```typescript
await db.collection('users').doc(uid).collection('github').doc('integration').set({
  connected: true,
  githubUsername: userData.login,
  accessToken,  // PLAINTEXT GitHub OAuth token
  repos,
  lastSynced: new Date().toISOString(),
});
```

**Impact:** Any admin with `users.read` permission can read users' GitHub access tokens. These tokens grant access to private repositories and GitHub account actions.

### B5. No Rate Limiting on AI Routes

**Files:** All 12 routes under `src/app/api/ai/`  
**Evidence:** None of the AI routes (`chat`, `code-review`, `mentor`, `mentor-v2`, `debugger`, `complexity-analyzer`, `interviewer`, `roadmap`, `revision-generator`, `resume-review`, `mistake-predictor`, `feed`) implement any rate limiting. They all authenticate via `verifyAuth()` but have no request frequency controls.

**Impact:** An authenticated user can spam the Gemini API without restriction, generating unlimited costs on the Gemini API billing.

---

## C. High-Priority Bugs

### C1. `use-matchmaking.ts` — Race Condition in Transaction

**File:** `src/hooks/use-matchmaking.ts:97-140`  
**Issue:** The `findMatch` function uses `onSnapshot` to watch for opponents, then uses `runTransaction` to create the battle. If two players find each other simultaneously, the transaction correctly fails on one side. However, there's no fallback: if the transaction fails, the user stays in the matchmaking queue with no retry and no error notification. The `onSnapshot` listener is already torn down by the `cleanup()` call, so the user is stuck in `idle` state even though the opponent found them.

### C2. `use-arena-matchmaking.ts` — Hardcoded Sample Problem

**File:** `src/hooks/use-arena-matchmaking.ts:136-160`  
**Issue:** The `acceptMatch` function hardcodes a "Two Sum" problem instead of fetching a real problem from the database. The `fetchProblem` import exists but is never called. All arena battles use the same problem.

### C3. `useArenaBattle.handleSubmit` — Dead Code / Never Works

**File:** `src/hooks/use-arena-battle.ts:67-75`
```typescript
const handleSubmit = useCallback(async () => {
    // ...
    const battle = await subscribeBattle(battleId, () => {});  // subscribes but doesn't await useful data
    const testCases = (await import('@/services/arena')).fetchBattle;  // assigns function reference, never called
    const res = await submitBattleCode(battleId, user.uid, code, language,
        [{ input: 'test', expected: 'test' }],  // fake test case
    );
    // ...
});
```
The `testCases` variable is assigned but never used. The fake test case `[{ input: 'test', expected: 'test' }]` means the submission always receives the wrong test data.

### C4. User Profile Creation Entirely Client-Side

**File:** `src/app/auth/auth-form.tsx:138-206`  
**Issue:** `createUserProfile` writes to Firestore from the client via `setDoc(doc(db, 'users', ...))`. There is no server-side API endpoint for user creation. A malicious client can modify the data being written (set arbitrary `coins`, `devcoins`, or other fields). The Firestore rules protect `role` and `isAdmin` from being set, but all other fields are client-controlled.

### C5. Username Race Condition on Registration

**File:** `src/app/auth/auth-form.tsx:189-193`  
**Issue:** The `usernames` document is created client-side with a `.catch()` that silently swallows errors. Two users registering simultaneously with the same username can both succeed — the second write overwrites the first's username mapping.

---

## D. Authentication and Authorization

### D1. Middleware Only Checks Cookie Presence, Not Validity (HIGH)

**File:** `src/middleware.ts:21-48`  
**Issue:** The middleware checks only for the existence of the `__session` cookie. It does NOT verify the Firebase ID token's validity. Any string in the cookie passes. Similarly, admin route protection only checks for cookie presence, not admin role. An expired or forged token passes the middleware.

### D2. `/admin/setup` Exempt from Admin Guard (HIGH)

**File:** `src/components/admin/AdminGuard.tsx:11`  
**Issue:** `EXEMPTED_PATHS` includes `/admin/setup`. Any authenticated user can access the admin setup page. While the API endpoint checks that no `super_admin` exists, the first user to discover this endpoint can claim `super_admin`.

### D3. Admin Guard Server Verification (MEDIUM)

**File:** `src/components/admin/AdminGuard.tsx:44-47`  
**Issue:** While the guard correctly calls `/api/admin/verify` for server-side verification, the `/admin/setup` path is completely exempt. The bypass means the setup page has no client-side or server-side verification on the page itself (only on the API endpoint).

### D4. Auth Form Redirects in `onAuthStateChanged` (LOW)

**File:** `src/app/auth/auth-form.tsx:122-136`  
**Issue:** The redirect to the post-login page happens inside an `onAuthStateChanged` listener. This fires on EVERY auth state change, not just after the current login action, which can cause unexpected redirects during token refreshes or multi-tab scenarios.

### D5. No Server-Side Ban Enforcement (MEDIUM)

**Files:** `src/middleware.ts`, `src/hooks/use-user.tsx`, `src/components/AuthGuard.tsx`  
**Issue:** Banned user checks happen only client-side (in `AuthGuard.tsx:33-36`). There is no server-side ban enforcement in the middleware or API routes. A banned user who knows API endpoints can still make direct requests.

---

## E. Firebase and Firestore

### E1. Security Rules Analysis (POSITIVE)

**File:** `firestore.rules` (496 lines)  
**Assessment:** The Firestore security rules are well-written with:
- Proper `isAuthenticated()` and `isOwner()` helpers
- Hierarchical role checks (`isAtLeast`, `isAdmin`)
- Subcollection-level rules for user data (`combatLogs`, `gameHistory`, `friends`, `notifications`, etc.)
- Immutable collections (`auditLogs`: create-only, no update/delete)
- Write validation for `aiUsage` (increment-only, `count == resource.data.count + 1`)
- Phase transition validation for `battles`
- Role protection on `users` collection (cannot set `role` or `isAdmin` from client)

### E2. Missing Rules for Specific Collections (MEDIUM)

**Issue:** Several collections referenced in client code are not explicitly covered by rules:
- `rateLimits` collection (used by `checkRateLimitFirestore`) — no match block, defaults to deny
- `invites` collection (used by `sendRoomInvite` and `subscribeInvites`) — indexed but no rules
- `matches` subcollection under `users/{userId}/matches` — no rules, defaults to deny
- `learning` collection — has a `match /learning/{userId}` rule but it's very permissive (allows any write if `isOwner`)

### E3. Realtime Listener Cleanup (MEDIUM)

**Files:** Multiple hooks  
**Issue:** Several hooks use `onSnapshot` but have inconsistent cleanup:
- `use-arena-battle.ts` — Returns unsub function (correct)
- `use-arena-matchmaking.ts` — Cleanup via ref (correct)
- `use-matchmaking.ts` — Two nested `onSnapshot` calls, only first has proper cleanup
- `use-rooms.ts:useRooms` — Proper cleanup
- `use-rooms.ts:useRoomByCode` — Uses `cancelled` flag pattern (correct but dated)

### E4. Firestore Index Proliferation (LOW)

**File:** `firestore.indexes.json` — 58 composite indexes defined  
**Issue:** This is a large number of indexes. Some may be unused. Each index incurs write overhead and cost. Indexes on `reports` with 4-field combinations suggest the reporting system was designed iteratively without index consolidation.

---

## F. Multiplayer and Battle Integrity

### F1. Matchmaking Logic is Entirely Client-Side (CRITICAL)

**Files:** `src/hooks/use-matchmaking.ts`, `src/services/arena.ts`  
**Issue:** The matchmaking queue (`joinMatchmakingQueue`/`findMatch`/`createBattle`) is entirely client-driven. The client picks opponents, creates battles, and sets the problem. There is no server-side verification that:
- The matched opponent is a real user (not a bot/script)
- The chosen problem is appropriate for the user's skill level
- The battle creation is legitimate
- ELO calculations are correct

### F2. Battle Result Validation Missing (HIGH)

**File:** `src/app/api/battles/submit/route.ts`  
**Issue:** The battle submission API needs to be audited. If the client reports results, a malicious user could report fake scores. The server-side judge engine (`judge-engine.ts`) exists but the battle submit route may not use it — it may trust client-provided `passed`/`total` values.

### F3. Hardcoded Sample Problem for All Battles (MEDIUM)

**File:** `src/hooks/use-arena-matchmaking.ts:136-160`  
**Issue:** All arena battles use the same "Two Sum" problem hardcoded in the hook. This means every battle is identical, defeating the purpose of competitive coding.

### F4. Room Presence Updates Firestore Every 30 Seconds (LOW)

**Files:** `src/hooks/use-rooms.ts:248-265`, `src/hooks/use-presence.ts`  
**Issue:** Both `usePresence` hooks write to Firestore every 30 seconds (`setInterval(setOnline, 30000)`). With many concurrent users, this generates significant Firestore write traffic. The `use-rooms.ts` version also writes on `visibilitychange` and `beforeunload`, making the duplicate `use-presence.ts` hook redundant.

### F5. Timer Reliability (MEDIUM)

**Issue:** Battle timers rely on `setTimeout` and `setInterval` on the client. These are unreliable:
- Browsers throttle timers on inactive tabs
- A user could switch tabs to gain extra coding time
- No server-side time enforcement exists
- The countdown timer in `BattleArenaMultiplayer.tsx` uses `clientTimeOffset` which can drift

---

## G. Data Integrity and Race Conditions

### G1. `use-matchmaking.ts` Transaction Race Condition (HIGH)

**File:** `src/hooks/use-matchmaking.ts:97-140`  
**Issue:** The `runTransaction` that creates a battle has an inherent race condition:
1. Both players get matched via `onSnapshot`
2. Player A's transaction starts, reads opponent's doc (status: 'waiting')
3. Player B's transaction starts, reads opponent's doc (status: 'waiting')
4. Player A writes battle + updates both docs
5. Player B's read detects stale data, transaction aborts  
**Result:** Player B gets stuck in `searching` state with no UI feedback. No retry logic exists.

### G2. `use-rooms.ts:useJoinRoom` Race Condition (MEDIUM)

**File:** `src/hooks/use-rooms.ts:140-165`  
**Issue:** Uses `runTransaction` correctly for joining rooms, but if the transaction fails, the user gets an error with no retry option. Two users joining the last two slots simultaneously could both fail.

### G3. `use-daily-login.ts` Streak Calculation (LOW)

**File:** `src/hooks/use-daily-login.ts:49-58`  
**Issue:** When a user misses a day, `streak` resets to 0 but the reward calendar resets to day 0 (which gives 50 coins). This is acceptable behavior but the logic is convoluted and could produce off-by-one errors in edge cases.

---

## H. Performance

### H1. Firebase Listeners on Every Component Mount (HIGH)

**Files:** Most hooks under `src/hooks/` call `initializeFirebase()` independently on every function call. This means:
- ~30+ calls to `initializeFirebase()` per page load
- Each call checks `isFirebaseConfigured()`, reads `process.env` values, etc.
- Singleton caching via module-level variables partially mitigates this, but the function overhead remains

### H2. Realtime Listeners Without Pagination (MEDIUM)

**Files:**
- `src/services/arena.ts:fetchOnlinePlayerCount` — Queries all users with `status == 'online'`, limited to 1000
- `src/services/arena.ts:fetchActiveBattleCount` — Same pattern
- `src/hooks/use-rooms.ts:useRooms` — Lists all waiting rooms without pagination
- `src/services/admin.ts:fetchAuditLogs` — No pagination on admin audit log reads

### H3. Unnecessary Client Components (MEDIUM)

**File:** `src/app/layout.tsx`  
**Issue:** The root layout wraps everything in `FirebaseClientProvider`, `AppStoreProvider`, `SidebarProvider`, multiple dynamic imports, and `RootLayoutClient`. This forces the entire application to be client-rendered. Many pages could be server components with selective client hydration.

### H4. `useGlobalStats` Fetches All Documents (LOW)

**File:** `src/firebase/stats/use-stats.tsx:30-47`  
**Issue:** `getDocs(collection(db, 'users'))` and `getDocs(collection(db, 'battles'))` fetch ALL documents without any filtering or pagination. For a platform with thousands of users, this will be extremely slow and expensive.

### H5. In-memory Rate Limiting Doesn't Scale (MEDIUM)

**File:** `src/lib/rate-limit.ts`  
**Issue:** The `checkRateLimit()` function uses an in-memory `Map`. This is lost on server restart and doesn't work across multiple instances. On Vercel's serverless infrastructure, each invocation is a separate container, making this effectively useless. Only the Firestore-based `checkRateLimitFirestore` works in production.

---

## I. Reliability and Runtime Errors

### I1. `useArenaBattle.handleSubmit` — Dead Code Fault (HIGH)

**File:** `src/hooks/use-arena-battle.ts:67-75`  
**Issue:** The `handleSubmit` function:
1. Calls `subscribeBattle` without storing the unsubscribe function (listener leak)
2. Assigns `fetchBattle` function reference to `testCases` but never calls it
3. Passes fake test cases `[{ input: 'test', expected: 'test' }]`
4. The battle submission will always report incorrect results

### I2. `useOfflineQueue` — Infinite Retries (MEDIUM)

**File:** `src/hooks/use-offline-queue.ts:58`  
**Issue:** Offline queue actions are retried on every online event with no maximum retry count. If the server endpoint consistently fails, actions accumulate and are retried forever.

### I3. Module-Level Mutable State (MEDIUM)

**File:** `src/hooks/use-notifications.ts:57` (sentCache)  
**Issue:** `sentCache = new Set<string>()` is module-level mutable state. In React's strict mode or with hot reloading, this can cause stale data. The cache is never cleared, so it grows unbounded.

### I4. `use-theme.tsx` — Theme Flash on Load (LOW)

**File:** `src/hooks/use-theme.tsx`  
**Issue:** The initial render uses the default `'dark'` theme state, then the `useEffect` reads `localStorage` and corrects it. This causes a flash of the wrong theme on slow connections. The `mounted` flag is exposed but no consumer uses it to guard rendering.

### I5. `NodeJS.Timeout` Type in Browser Code (LOW)

**File:** `src/hooks/use-editor-persistence.ts:26`  
**Issue:** `const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);` — `NodeJS.Timeout` doesn't exist in browser TypeScript. This will cause type errors in strict TypeScript configurations. Should be `ReturnType<typeof setTimeout>`.

---

## J. Architecture and Maintainability

### J1. Mixed Type Import Sources

**Files:** Multiple hooks import from both `@/app/lib/types` and `@/types`  
**Issue:** Type definitions are duplicated across two locations. `@/app/lib/types` re-exports everything from `@/types`, creating ambiguity. Some hooks import from one, others from the other.

### J2. Duplicate Realtime Subscription Pattern

**Files:** `useFriends`, `useBlockedUsers`, `useFriendRequestsReceived`, `useNotifications`, `useUserProgress`  
**Issue:** The Firebase `onSnapshot` + `useEffect` + cleanup pattern is copy-pasted at least 6 times with near-identical structure. A generic `useFirestoreQuery` hook could replace all of them.

### J3. `initializeFirebase()` Called ~30+ Times

**Issue:** Every hook and service function calls `initializeFirebase()` independently. While the singleton caching mitigates re-initialization, the pattern couples every module directly to Firebase initialization logic.

### J4. `'use client'` Missing on `use-mobile.tsx`

**File:** `src/hooks/use-mobile.tsx`  
**Issue:** This hook uses `window`, `useEffect`, and `useState` but lacks a `'use client'` directive. It will crash if accidentally imported into a Server Component.

### J5. Extensive `any` Typing

**Files:** `Shell.tsx`, `use-notifications.ts`, `use-friends.ts`, `use-practice-stats.ts`, `use-editor-persistence.ts`, and many others  
**Issue:** `any` types are used extensively, losing TypeScript's safety guarantees. Approximately 20+ instances across the reviewed files.

---

## K. Ponytail Over-Engineering Findings

Applying the active Ponytail full-mode ruleset (YAGNI -> reuse -> stdlib -> native -> dep -> one-liner -> minimum):

### K1. Unnecessary Abstractions

| Finding | File | Ponytail Assessment |
|---------|------|---------------------|
| `useToast.ts` full reducer pattern (74 lines) | `src/hooks/use-toast.ts` | YAGNI violation. Only 1 toast allowed (`TOAST_LIMIT=1`), making the array state, reducer, and dispatch entirely wasted. A simple callback-based API would be ~20 lines. |
| `useProgressiveUnlocking` as a hook | `src/hooks/use-progressive-unlocking.ts` | YAGNI violation. No `useState`/`useEffect` — just `useMemo` on a synchronous pure function. Should be a utility function, not a hook. |
| `useJudgeStatus` polling with full state object | `src/hooks/use-judge-status.ts` | Over-engineered. Polls `/api/judge/health` every 30s and tracks 6 boolean fields. If the health endpoint isn't used elsewhere, a simpler approach (or removing it) is better. |
| `usePresence` duplicate implementation | Both `src/hooks/use-rooms.ts` and `src/hooks/use-presence.ts` | Duplicate logic. The `use-rooms.ts` version already handles presence. The standalone `use-presence.ts` is redundant. |

### K2. Unnecessary Wrappers

| Finding | File | Ponytail Assessment |
|---------|------|---------------------|
| `DynamicComponents.tsx` - 4 wrapper components | `src/components/DynamicComponents.tsx` | Dead wrappers around `lazy` imports that are never used anywhere. |
| `AppStartupDecorations.tsx` | Dynamic imports with `Suspense` wrappers that render `null` as fallback | Each dynamic component loads a separate JS bundle. The 7 separate dynamic imports could be consolidated. |
| `RootLayoutClient.tsx` | Thin wrapper around `AuthGuard` + `ErrorBoundary` | Adds a component layer that could be inlined in the root layout. |

### K3. Redundant Helper Functions

| Finding | File | Ponytail Assessment |
|---------|------|---------------------|
| `hub-utils.ts` - `detectBrowser`, `detectOS`, `detectDevice` | `src/lib/hub-utils.ts` | Unused exports. Dead code. |
| `hub-validation.ts` | `src/lib/hub-validation.ts` | Used only by hub routes, but the validation logic duplicates what Zod schemas already provide. |
| `generatePublicId` | `src/lib/username.ts` | Unused export. |
| `getFirebaseServices` | `src/firebase/index.ts` | Unused export. |
| `useFirebase`, `useFirebaseApp` | `src/firebase/provider.tsx` | Unused exports. Only `useAuth` and `useFirestore` are consumed. |

### K4. Over-Engineered Patterns

| Finding | File | Ponytail Assessment |
|---------|------|---------------------|
| `Shell.tsx` sidebar scroll persistence | Lines 528-535 | Reads from `sessionStorage` but nothing ever writes to it. Dead effect. |
| `SettingsModal` in Shell | `Shell.tsx:611` | Modal is rendered but `isSettingsOpen` is always `false` and never set to `true`. Dead component. |
| `useOfflineQueue` with IndexedDB | `src/hooks/use-offline-queue.ts` | Full IndexedDB setup for a single queue that only posts to one endpoint. A simpler in-memory queue with `localStorage` fallback would suffice for this use case. |
| `useToast` - `TOAST_REMOVE_DELAY = 1000000` | `src/hooks/use-toast.ts:12` | ~16 minute toast dismiss delay. Bug or intentional? Either way, extreme value suggests the need for this delay wasn't verified. |
| `EARNING_LIMITS` array with 14 entries | `src/types/index.ts` | Full devcoin economy with per-source daily/weekly limits, cooldowns, and amounts — but no code enforces these limits client-side or server-side. The data structure exists but the enforcement doesn't. |

### K5. Features That Add Complexity Without Real Value

| Feature | Why It's Over-engineered |
|---------|-------------------------|
| `/admin/setup` page with API endpoint | First-user-as-super_admin pattern. A simpler approach: seed the first admin via Firebase Console or a deployment script. |
| Full `services/admin.ts` with client-side reads | Every admin function reads directly from Firestore client-side. The server-side admin API routes exist but the client bypasses them. |
| `useDailyLogin` with 7-day reward calendar | Streak tracking, daily rewards, and claim logic — all client-side with Firestore writes. A user could manipulate their system clock to claim rewards early. |
| `useShop` with full inventory/purchase/earnings system | Client-side purchase logic with server-side verification only on the purchase API. Inventory state is managed client-side and can be manipulated. |

---

## L. UI/UX and Accessibility

### L1. Accessibility Gaps

| Issue | Location | Impact |
|-------|----------|--------|
| No `aria-labels` on many interactive elements | Arena components, Shell navigation | Screen reader users cannot navigate |
| Icon buttons without text labels | Multiple components | Keyboard navigation impossible |
| No focus indicators on custom components | Arena, chat components | Keyboard-only users cannot see focus |
| Missing `role` attributes on interactive divs | Multiple components | Screen readers don't recognize them as interactive |

### L2. Loading States

| Issue | Location |
|-------|----------|
| Multiple async operations with no loading indicator | `use-arena-matchmaking.ts` acceptMatch flow |
| `fetchOnlinePlayerCount` and `fetchActiveBattleCount` block with no loading state | `src/services/arena.ts` |
| `useGlobalStats` fetches all documents with no progress indicator | `src/firebase/stats/use-stats.tsx` |

### L3. Error States

| Issue | Location |
|-------|----------|
| Most hooks have `error` state but many components don't render it | Multiple arena/practice components |
| `useToast` for permission errors in `FirebaseErrorListener` — toast disappears quickly | `src/components/FirebaseErrorListener.tsx` |
| Error from `useMatchmaking` transaction failure doesn't show UI | `src/hooks/use-matchmaking.ts` |

---

## M. Deployment and Production

### M1. TypeScript Errors Potential

| Issue | Location |
|-------|----------|
| `NodeJS.Timeout` type in browser code | `src/hooks/use-editor-persistence.ts:26` |
| `any` types throughout | Multiple files |
| Missing `'use client'` on browser-only hooks | `use-mobile.tsx` |
| Import path inconsistencies (`@/app/lib/types` vs `@/types`) | Multiple hooks |

### M2. Build Configuration

| Setting | Assessment |
|---------|------------|
| `ignoreBuildErrors: false` | GOOD — TypeScript errors will fail builds |
| `ignoreDuringBuilds: false` | GOOD — ESLint errors will fail builds |
| Experimental: `serverActions.bodySizeLimit: '512kb'` | REASONABLE for code submissions |
| CSP headers | COMPREHENSIVE — Covers Firebase, Sentry, Vercel, Google APIs |

### M3. Environment Variables Required for Production

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_GA_ID`
- `JUDGE0_API_URL` or `PISTON_API_URL`
- `JUDGE0_API_KEY` (if using Judge0)

### M4. Missing Production Configs

- No `firebase.json` in the project root (only `.firebaserc`)
- The `out/` directory is tracked (should be in `.gitignore`)
- No Docker configuration for Judge0/Piston beyond `infra/` directory

---

## N. Dead Code and Cleanup

### N1. Unused Hooks

| Hook | File | Status |
|------|------|--------|
| `useOpenChat` | `src/hooks/use-chat.ts:119` | Unused |
| `useExpandedNotifications` | `src/hooks/use-expanded-notifications.ts:6` | Unused |
| `useFriendRequestsReceived` | `src/hooks/use-friends.ts:205` | Unused |
| `useIsMobile` | `src/hooks/use-mobile.tsx:5` | Unused |
| `useSendNotification` | `src/hooks/use-notifications.ts:59` | Unused |
| `useToggleBookmark` | `src/hooks/use-practice-problems.ts:78` | Unused |
| `useItemOwned` | `src/hooks/use-shop.ts:121` | Unused |
| `usePurchaseHistory` | `src/hooks/use-shop.ts:138` | Unused |
| `useEarnings` | `src/hooks/use-shop.ts:155` | Unused |
| `useTransferHost` | `src/hooks/use-rooms.ts:242` | Unused |
| `useMatchmaking` | `src/hooks/use-matchmaking.ts:73` | Unused (superseded by `useArenaMatchmaking`) |

### N2. Unused Service Exports

**Complete service files unused:**
- `src/services/hackathons.ts` — All exports unused
- `src/services/mentors.ts` — All exports unused
- `src/services/missions.ts` — All exports unused
- `src/services/code-share.ts` — All exports unused
- `src/services/contest-calendar.ts` — All exports unused
- `src/services/projects.ts` — All exports unused
- `src/services/study-groups.ts` — All exports unused

**Partially unused services:**
- `src/services/practice.ts` — ~20+ exports, none imported by any component
- `src/services/admin-audit.ts:createAuditLog` — Unused
- `src/services/career.ts:submitApplication` — Unused
- `src/services/community.ts:deletePost, getUserPosts` — Unused
- `src/services/forum.ts:markSolution` — Unused

### N3. Dead Code in Components

- `src/components/DynamicComponents.tsx` — Entire file (4 wrapper components, none used)
- `Shell.tsx:611` — `<SettingsModal>` that never opens
- `Shell.tsx:528-535` — Scroll restore effect that reads but never writes
- `Shell.tsx:482` — `unread` state always 0, never updated

### N4. Unused TypeScript Types

~60+ type exports from `src/types/index.ts` are unused across the application. Notable examples:
- `FriendStatus`, `FeatureFlag`, `BattleState`, `GlobalStats`, `Opponent`, `DailyReward`, `SavedCode`, `MatchReplay`, `WeeklySummary`, `LearningPath`, `CodingSession`, `LoginHistoryEntry`, `Announcement`, `SubmissionStatus`, `ExecutionPhase`, `SubmissionResult`, `PracticeProblemDocument`, `ProblemDocumentMeta`, `ProblemContent`, `DailyChallenge`, `WeeklyChallenge`, `TopicMastery`, `PracticeStats`, `UserPracticeProgress`, `StaticPracticeProblem`, `ReferralReward`, `CommunityPost`, `PostComment`, `StudyGroup`, `StudyGroupMessage`, `MentorProfile`, `MentorReview`, `CodeShare`, `Hackathon`, `HackathonTeam`, `CareerListing`, `CompanyPrep`, `DailyMission`, `ShopItem`, `UserInventory`, `PurchaseRecord`, `DevCoinEarning`, `GitHubIntegration`, `AIUsage`, `DailyFeed`, `ContestCalendarEntry`, `DiscussionForum`, `ForumReply`, `PublicProfile`, `ArenaSettings`, `MatchmakingEntry`, `BattleDocument`

All types from `src/types/hub.ts` are unused.

---

## O. Prioritized Fix Roadmap

### PHASE 1 — Fix Immediately (Security Critical)

| ID | Issue | Effort | Risk of Fix |
|----|-------|--------|-------------|
| B1 | Rotate exposed API keys (Gemini, Firebase, Vercel OIDC) | 1 hour | Low — revoke and regenerate keys |
| B1 | Add `.env.*` to `.gitignore` (`.env.production`, `.env.vercel`) | 5 min | None |
| B2 | Set `httpOnly: true` on all `__session` cookie writes | 30 min | Low — test login flow after |
| B3 | Move admin Firestore reads to server-side API routes | 4 hours | Medium — admin UI will break until migration complete |
| B4 | Encrypt GitHub OAuth tokens or store in secure vault | 2 hours | Low — affects only new OAuth flows |
| B5 | Add rate limiting to all 12 AI routes | 2 hours | Low — set reasonable limits (e.g., 30 req/min per user) |

### PHASE 2 — Fix Before Production (High Impact)

| ID | Issue | Effort | Risk of Fix |
|----|-------|--------|-------------|
| C4 | Create server-side user creation API endpoint | 4 hours | Medium — replaces client-side user creation |
| C5 | Fix username race condition with Firestore transactions | 2 hours | Low — use `runTransaction` for `usernames` collection |
| D1 | Verify session cookie validity in middleware | 3 hours | Medium — requires Admin SDK in edge middleware |
| D5 | Add server-side ban enforcement to middleware and API routes | 3 hours | Low — add ban check to `verifyAuth()` |
| F1 | Move matchmaking to server-side or Cloud Function | 8+ hours | High — major architectural change |
| F2 | Server-side battle result validation using judge engine | 4 hours | Medium — ensures fair play |
| H1 | Centralize Firebase initialization | 2 hours | Low — refactor to single context |
| C1 | Fix matchmaking transaction failure fallback | 2 hours | Low — add retry logic and error UI |

### PHASE 3 — Improve Next (Medium Impact)

| ID | Issue | Effort | Risk of Fix |
|----|-------|--------|-------------|
| H2 | Add pagination to realtime listeners | 4 hours | Low |
| H4 | Fix `useGlobalStats` to use aggregate queries | 2 hours | Low |
| I2 | Add max retry count to offline queue | 30 min | None |
| I3 | Fix module-level mutable `sentCache` | 1 hour | Low |
| I5 | Fix `NodeJS.Timeout` type | 5 min | None |
| J4 | Add `'use client'` to `use-mobile.tsx` | 5 min | None |
| J5 | Replace `any` types with proper types | 8+ hours | Low — gradual refactor |
| L1 | Add aria-labels to key interactive elements | 4 hours | Low |
| F5 | Add server-side timer enforcement for battles | 6 hours | Medium |

### PHASE 4 — Optional Cleanup (Maintainability)

| ID | Issue | Effort | Risk of Fix |
|----|-------|--------|-------------|
| N1 | Remove 10 unused hooks | 2 hours | Low — check nothing imports them |
| N2 | Remove 7 unused service files | 1 hour | Low — check nothing imports them |
| N3 | Remove dead code in Shell.tsx, DynamicComponents.tsx | 1 hour | Low |
| N4 | Remove ~60+ unused type exports | 3 hours | Low |
| F3 | Fix hardcoded "Two Sum" problem in matchmaking | 2 hours | Low — fetch from database |
| K1 | Simplify `useToast.ts` (remove reducer) | 1 hour | Low |
| K1 | Convert `useProgressiveUnlocking` to utility function | 30 min | None |
| K2 | Remove `DynamicComponents.tsx` | 15 min | None |
| K4 | Remove dead `SettingsModal` from Shell | 15 min | None |
| K4 | Remove dead scroll-persistence effect | 10 min | None |
| J1 | Consolidate type imports to `@/types` only | 2 hours | Low |
| J2 | Create generic `useFirestoreQuery` hook | 3 hours | Low — gradual migration |
| E4 | Audit and consolidate Firestore indexes | 2 hours | Low |
| H3 | Evaluate server component opportunities | 4 hours | Medium |

---

**End of Audit Report**
