const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// --- @firebase/firestore: missing dist/index.d.ts ---
(function fixFirestore() {
  const dir = path.join(ROOT, 'node_modules', '@firebase', 'firestore', 'dist');
  const indexPath = path.join(dir, 'index.d.ts');
  if (!fs.existsSync(indexPath)) {
    const apiPath = path.join(dir, 'firestore', 'src', 'api.d.ts');
    if (fs.existsSync(apiPath)) {
      fs.writeFileSync(indexPath, "export * from './firestore/src/api';\n", 'utf-8');
      console.log('[fix-package-types] Created @firebase/firestore/dist/index.d.ts');
    }
  }
})();

// --- recharts: missing types/index.d.ts ---
(function fixRecharts() {
  const dir = path.join(ROOT, 'node_modules', 'recharts', 'types');
  const indexPath = path.join(dir, 'index.d.ts');
  if (fs.existsSync(indexPath)) return;

  const es6Index = path.join(ROOT, 'node_modules', 'recharts', 'es6', 'index.js');
  if (!fs.existsSync(es6Index)) {
    console.warn('[fix-package-types] recharts es6/index.js not found');
    return;
  }

  const content = fs.readFileSync(es6Index, 'utf-8');
  const output = [];

  // Known missing recharts types the project imports
  // Stubbed as minimal React components
  const missingTypes = {
    './cartesian/XAxis': true,
    './cartesian/YAxis': true,
    './component/Tooltip': true,
    './component/ResponsiveContainer': true,
    './chart/LineChart': true,
    './cartesian/Line': true,
    './chart/PieChart': true,
    './polar/Pie': true,
    './component/Legend': true,
  };

  for (const line of content.split('\n')) {
    const m = line.match(/^export\s+\{([^}]+)\}\s+from\s+'([^']+)'/);
    if (m) {
      const names = m[1].split(',').map(s => s.trim());
      const fromPath = m[2];
      const resolved = path.join(dir, fromPath + '.d.ts');
      if (fs.existsSync(resolved)) {
        output.push('export * from ' + JSON.stringify(fromPath) + ';');
      } else if (missingTypes[fromPath]) {
        for (const name of names) {
          output.push('export const ' + name + ': React.FC<any>;');
        }
      }
    }
  }

  fs.writeFileSync(indexPath, output.join('\n') + '\n', 'utf-8');
  console.log('[fix-package-types] Created recharts/types/index.d.ts (' + output.length + ' lines)');
})();
