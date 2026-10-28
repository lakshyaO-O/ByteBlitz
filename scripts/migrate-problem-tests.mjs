#!/usr/bin/env node
/**
 * One-time migration: move hidden/expected test cases out of `problemContent`
 * into the server-only `problemSecrets` collection, leaving visible samples in
 * `problemContent` for client reads.
 *
 * Run ONCE after deploying the updated rules, with a Firebase service account:
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-problem-tests.mjs
 *
 * Dry run first (no writes):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json DRY_RUN=1 node scripts/migrate-problem-tests.mjs
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.env.DRY_RUN === '1';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const snap = await db.collection('problemContent').get();
let migrated = 0;
let skipped = 0;
let alreadyClean = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  const testCases = Array.isArray(data.testCases) ? data.testCases : [];

  const hiddenCases = testCases.filter(tc =>
    tc?.isHidden === true || tc?.expected === undefined || tc?.expected === null || tc?.expected === '',
  );

  if (hiddenCases.length === 0) {
    alreadyClean++;
    continue;
  }

  const visibleCases = testCases.filter(tc => !(tc?.isHidden === true));
  const fullCases = testCases;
  const secretsDoc = await db.collection('problemSecrets').doc(doc.id).get();

  if (!DRY_RUN) {
    const update = { testCases: visibleCases, updatedAt: new Date() };
    const batch = db.batch();
    batch.update(doc.ref, update);
    if (secretsDoc.exists) {
      // Merge full cases over any existing secret doc.
      const existing = secretsDoc.data()?.testCases || [];
      if (existing.length < fullCases.length) {
        batch.set(secretsDoc.ref, { testCases: fullCases, updatedAt: new Date() }, { merge: true });
      }
    } else {
      batch.set(secretsDoc.ref, { testCases: fullCases, createdAt: new Date(), updatedAt: new Date() });
    }
    await batch.commit();
  }

  migrated++;
  console.log(`[${DRY_RUN ? 'DRY ' : 'OK  '}] ${doc.id}: ${testCases.length} cases -> ${visibleCases.length} visible, ${hiddenCases.length} hidden`);
}

console.log(`\nDone. migrated=${migrated} alreadyClean=${alreadyClean} skipped=${skipped} dryRun=${DRY_RUN}`);
if (DRY_RUN) console.log('Re-run without DRY_RUN=1 to apply.');
