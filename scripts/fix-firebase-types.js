const fs = require('fs');
const path = require('path');

const firestoreTypesDir = path.join(process.cwd(), 'node_modules', '@firebase', 'firestore', 'dist');
const indexPath = path.join(firestoreTypesDir, 'index.d.ts');

if (!fs.existsSync(indexPath)) {
  const apiPath = path.join(firestoreTypesDir, 'firestore', 'src', 'api.d.ts');
  if (fs.existsSync(apiPath)) {
    fs.writeFileSync(indexPath, "export * from './firestore/src/api';\n", 'utf-8');
    console.log('[fix-firebase-types] Created missing @firebase/firestore/dist/index.d.ts');
  } else {
    console.warn('[fix-firebase-types] @firebase/firestore API types not found at expected path');
  }
}
