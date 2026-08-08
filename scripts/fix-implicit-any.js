// fix-implicit-any.js - batch fix TS7006 errors
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Read each file, fix patterns, write back
const fixes = [
  // [file, importTypes, [ [search, replace], ... ]]
  // services
  ['src/services/arena.ts', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot, DocumentSnapshot, Transaction', [
    ["ref, (snap) =>", "ref, (snap: DocumentSnapshot<DocumentData>) =>"],
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.docs.filter(d =>", "snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["runTransaction(db, async (tx) =>", "runTransaction(db, async (tx: Transaction) =>"],
  ]],
  ['src/services/practice.ts', 'QueryDocumentSnapshot, DocumentData, Transaction', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.forEach(d =>", "snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["runTransaction(db, async (tx) =>", "runTransaction(db, async (tx: Transaction) =>"],
  ]],
  ['src/services/chat.ts', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot', [
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.forEach(d =>", "snap.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/shop.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["dailyEarnings.forEach(d =>", "dailyEarnings.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["weeklyEarnings.forEach(d =>", "weeklyEarnings.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.forEach(d =>", "snap.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/forum.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/community.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/career.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/code-share.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/contest-calendar.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/feed.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/hackathons.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/mentors.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/missions.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/projects.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/study-groups.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["docs.map(d =>", "docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/admin.ts', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/services/ai-usage.ts', 'Transaction', [
    ["runTransaction(db, async (tx) =>", "runTransaction(db, async (tx: Transaction) =>"],
  ]],
  // hooks
  ['src/hooks/use-friends.ts', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot, Transaction', [
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.filter(d =>", "snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["runTransaction(db, async (tx) =>", "runTransaction(db, async (tx: Transaction) =>"],
  ]],
  ['src/hooks/use-notifications.ts', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot', [
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["catch((err) =>", "catch((err: Error) =>"],
  ]],
  ['src/hooks/use-practice-problems.ts', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot', [
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["snap.docs.forEach(d =>", "snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/hooks/use-rooms.ts', 'QueryDocumentSnapshot, DocumentData, Transaction', [
    ["roomRef, (snap) =>", "roomRef, (snap: QuerySnapshot<DocumentData>) =>"],
    ["q, (snap) =>", "q, (snap: QuerySnapshot<DocumentData>) =>"],
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["runTransaction(db, async (tx) =>", "runTransaction(db, async (tx: Transaction) =>"],
    ["catch((err) =>", "catch((err: Error) =>"],
  ]],
  ['src/hooks/use-arena-matchmaking.ts', 'DocumentSnapshot, DocumentData', [
    ["then((snap) =>", "then((snap: DocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/hooks/use-username.ts', 'Transaction', [
    ["runTransaction(db, async (transaction) =>", "runTransaction(db, async (transaction: Transaction) =>"],
  ]],
  // app pages
  ['src/app/analytics/page.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["sessionsSnap.docs.forEach(d =>", "sessionsSnap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/app/forum/[id]/page.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/app/study-groups/[id]/page.tsx', 'QueryDocumentSnapshot, DocumentData, DocumentSnapshot, QuerySnapshot', [
    ["then(snap =>", "then((snap: DocumentSnapshot<DocumentData>) =>"],
    ["q, (snapshot) =>", "q, (snapshot: QuerySnapshot<DocumentData>) =>"],
    ["snapshot.docs.map(d =>", "snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/app/study-groups/page-client.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.map(d =>", "snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  // components
  ['src/components/admin/AnalyticsDashboard.tsx', null, [
    ["tickFormatter={h =>", "tickFormatter={(h: number) =>"],
    ["labelFormatter={h =>", "labelFormatter={(h: string) =>"],
  ]],
  ['src/components/arena/FriendInviteDialog.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["snap.docs.find((d) =>", "snap.docs.find((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/components/gamification/MilestoneCelebration.tsx', 'QueryDocumentSnapshot, DocumentData, QuerySnapshot', [
    ["q, (snapshot) =>", "q, (snapshot: QuerySnapshot<DocumentData>) =>"],
    ["snapshot.docs.map(d =>", "snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/components/layout/Shell.tsx', 'DocumentSnapshot, DocumentData', [
    ["then((snap) =>", "then((snap: DocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/components/security/SecuritySettings.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["historySnap.docs.map(d =>", "historySnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["sessionsSnap.docs.map(d =>", "sessionsSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/components/social/PublicProfile.tsx', 'QueryDocumentSnapshot, DocumentData', [
    ["friendsSnap.docs.map(d =>", "friendsSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["activitySnap.docs.map(d =>", "activitySnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["matchSnap.docs.map(d =>", "matchSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) =>"],
    ["myFriendsSnap.docs.some(d =>", "myFriendsSnap.docs.some((d: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
  ['src/firebase/firestore/use-collection.tsx', null, [
    ["snapshot.docs.map(doc =>", "snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>"],
    ["async (err) =>", "async (err: FirestoreError) =>"],
  ]],
  ['src/firebase/firestore/use-doc.tsx', null, [
    ["async (err) =>", "async (err: FirestoreError) =>"],
  ]],
  ['src/firebase/stats/use-stats.tsx', null, [
    ["battlesSnapshot.forEach(doc =>", "battlesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) =>"],
  ]],
];

for (const item of fixes) {
  const filePath = item[0];
  const addImport = item[1];
  const patterns = item[2];
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn('File not found:', filePath);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;
  if (addImport) {
    const idx = content.indexOf("from 'firebase/firestore'");
    if (idx > -1) {
      const afterIdx = content.indexOf(';', idx) + 1;
      const before = content.slice(0, afterIdx);
      const after = content.slice(afterIdx);
      const needed = addImport.split(', ').filter(function(t) { return before.indexOf(t) === -1; });
      if (needed.length > 0) {
        content = before + '\nimport type { ' + needed.join(', ') + " } from 'firebase/firestore';" + after;
        changed = true;
      }
    }
  }
  for (var p = 0; p < patterns.length; p++) {
    var search = patterns[p][0];
    var replace = patterns[p][1];
    while (content.indexOf(search) > -1) {
      content = content.replace(search, replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log('Fixed:', filePath);
  }
}
console.log('Done');
