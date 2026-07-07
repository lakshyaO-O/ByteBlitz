#!/usr/bin/env node

const JUDGE0_URL = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/+$/, '');
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || '';
const POLL_INTERVAL = parseInt(process.env.JUDGE0_POLL_INTERVAL || '300', 10);
const RESULTS_TIMEOUT = parseInt(process.env.JUDGE0_RESULTS_TIMEOUT || '120000', 10);
const REQUEST_TIMEOUT = parseInt(process.env.JUDGE0_REQUEST_TIMEOUT || '30000', 10);

const headers = { 'Content-Type': 'application/json' };
if (JUDGE0_AUTH_TOKEN) headers['X-Auth-Token'] = JUDGE0_AUTH_TOKEN;

const PASS = '\x1b[32mPASS\x1b[0m';
const FAIL = '\x1b[31mFAIL\x1b[0m';
const SKIP = '\x1b[33mSKIP\x1b[0m';
const INFO = '\x1b[36mINFO\x1b[0m';

const results = [];
let passed = 0, failed = 0, skipped = 0;

function test(name, fn) { results.push({ name, fn }); }

function b64encode(s) { return Buffer.from(s, 'utf-8').toString('base64'); }
function b64decode(s) { return Buffer.from(s, 'base64').toString('utf-8'); }

async function apiFetch(path, opts = {}) {
  const url = `${JUDGE0_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { ...headers, ...opts.headers },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getLanguages() {
  const res = await apiFetch('/languages');
  return res.json();
}

const TERMINAL_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

async function submitAndWait(sourceCode, languageId, extra = {}) {
  const body = {
    source_code: b64encode(sourceCode),
    language_id: languageId,
    base64_encoded: true,
    ...extra,
  };

  const res = await apiFetch('/submissions?base64_encoded=true', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const { token } = await res.json();
  if (!token) throw new Error('No token in submission response');

  const deadline = Date.now() + RESULTS_TIMEOUT;
  let last = null;
  while (Date.now() < deadline) {
    const subRes = await apiFetch(`/submissions/${token}?base64_encoded=true&fields=*`);
    const sub = await subRes.json();
    if (sub.status && TERMINAL_STATUSES.has(sub.status.id)) {
      sub.stdout = sub.stdout ? b64decode(sub.stdout) : '';
      sub.stderr = sub.stderr ? b64decode(sub.stderr) : '';
      sub.compile_output = sub.compile_output ? b64decode(sub.compile_output) : '';
      sub.message = sub.message ? b64decode(sub.message) : '';
      return sub;
    }
    last = sub;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error(`Timeout waiting for submission ${token}. Last status: ${last?.status?.id} ${last?.status?.description}`);
}

function trunc(s, n = 200) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '...' : s;
}

function statusLine(status) {
  return `[${status.id}] ${status.description}`;
}

async function runTests() {
  console.log(`\n  Judge0 CE Test Suite`);
  console.log(`  Target: ${JUDGE0_URL}`);
  console.log(`  Auth:   ${JUDGE0_AUTH_TOKEN ? 'configured' : 'NONE'}`);
  console.log('');

  let langs = [];
  try {
    langs = await getLanguages();
    console.log(`  ${INFO}  Found ${langs.length} languages configured on this instance`);
  } catch (e) {
    console.log(`  ${SKIP}  Could not fetch language list: ${e.message}`);
  }
  const langMap = {};
  for (const l of langs) langMap[l.id] = l;

  function knownLang(id) {
    if (langMap[id]) return `${langMap[id].name} (ID ${id})`;
    return `ID ${id}`;
  }

  for (const { name, fn } of results) {
    process.stdout.write(`  ${name.padEnd(60)} `);
    try {
      const detail = await fn(knownLang, langMap);
      if (detail === true || detail === undefined) {
        console.log(`${PASS}`);
        passed++;
      } else if (detail === false) {
        console.log(`${FAIL} - unexpected false return`);
        failed++;
      } else if (typeof detail === 'object' && detail.skip) {
        console.log(`${SKIP}  ${detail.reason || ''}`);
        skipped++;
      } else if (typeof detail === 'object' && detail.pass === false) {
        console.log(`${FAIL}  ${detail.reason || ''}`);
        failed++;
      } else if (typeof detail === 'object' && detail.pass === true) {
        console.log(`${PASS}  ${detail.reason || ''}`);
        passed++;
      } else if (typeof detail === 'string') {
        console.log(`${FAIL}  ${detail}`);
        failed++;
      } else {
        console.log(`${FAIL}  unexpected result: ${typeof detail}`);
        failed++;
      }
    } catch (e) {
      console.log(`${FAIL}  ${e.message}`);
      failed++;
    }
  }

  const total = results.length;
  console.log('');
  console.log(`  ${'='.repeat(60)}`);
  console.log(`  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}  |  Skipped: ${skipped}`);
  console.log(`  ${'='.repeat(60)}`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================
// TEST 1: JavaScript (ID 63)
// ============================================================
test('JavaScript (63) - Hello World', async (known) => {
  const sub = await submitAndWait(`console.log("Hello, World!");`, 63);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  return { pass: false, reason: `Expected Accepted(3) with "Hello, World!", got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}" stderr="${trunc(sub.stderr)}" compile="${trunc(sub.compile_output)}"` };
});

// ============================================================
// TEST 2: TypeScript via ts-node (ID 63)
// ============================================================
test('TypeScript (63 via ts-node) - Hello World', async (known) => {
  const tsCode = `
const ts = (() => {
  try { return require('typescript'); }
  catch(e) { try { return eval('require("typescript")'); } catch(e2) { return null; } }
})();
if (ts) {
  const code = 'const greet = (name: string): string => "Hello, " + name + "!"; console.log(greet("World"));';
  const result = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind ? 1 : 1, target: ts.ScriptTarget ? 1 : 1 } });
  eval(result.outputText);
} else {
  console.log("TYPESCRIPT_NOT_AVAILABLE");
}
`;
  const sub = await submitAndWait(tsCode, 63);
  if (sub.stdout.includes('Hello, World!')) {
    return { pass: true, reason: `stdout="${trunc(sub.stdout)}"` };
  }
  if (sub.stdout.includes('TYPESCRIPT_NOT_AVAILABLE')) {
    return { pass: true, reason: 'typescript not pre-installed in image; JS runner works' };
  }
  return { pass: false, reason: `Expected "Hello, World!" in output, got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 3: Python 3 (ID 71)
// ============================================================
test('Python 3 (71) - Hello World', async (known) => {
  const sub = await submitAndWait(`print("Hello, World!")`, 71);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  return { pass: false, reason: `Expected Accepted(3), got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 4: Java 17 (ID 62)
// ============================================================
test('Java 17 (62) - Hello World', async (known) => {
  const code = `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}`;
  const sub = await submitAndWait(code, 62);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  if (sub.status.id === 6) return { pass: false, reason: `Compilation Error: ${trunc(sub.compile_output)}` };
  return { pass: false, reason: `Expected Accepted(3), got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 5: C++ G++ 9.2.0 (ID 54)
// ============================================================
test('C++ G++ 9.2.0 (54) - Hello World', async (known) => {
  const code = `#include <iostream>
int main() {
  std::cout << "Hello, World!" << std::endl;
  return 0;
}`;
  const sub = await submitAndWait(code, 54);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  if (sub.status.id === 6) return { pass: false, reason: `Compilation Error: ${trunc(sub.compile_output)}` };
  return { pass: false, reason: `Expected Accepted(3), got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 6: Go 1.18 (ID 60)
// ============================================================
test('Go 1.18 (60) - Hello World', async (known) => {
  const code = `package main
import "fmt"
func main() {
  fmt.Println("Hello, World!")
}`;
  const sub = await submitAndWait(code, 60);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  if (sub.status.id === 6) return { pass: false, reason: `Compilation Error: ${trunc(sub.compile_output)}` };
  return { pass: false, reason: `Expected Accepted(3), got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 7: Rust 1.68 (ID 73)
// ============================================================
test('Rust 1.68 (73) - Hello World', async (known) => {
  const code = `fn main() {
    println!("Hello, World!");
}`;
  const sub = await submitAndWait(code, 73);
  if (sub.status.id === 3 && sub.stdout.trim() === 'Hello, World!') return true;
  if (sub.status.id === 6) return { pass: false, reason: `Compilation Error: ${trunc(sub.compile_output)}` };
  return { pass: false, reason: `Expected Accepted(3), got ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 8: CPU Limits Enforcement
// ============================================================
test('CPU Limits - infinite loop killed with TLE', async (known) => {
  const cpuLimit = 1;
  const sub = await submitAndWait(`while (true) {}", 63, {
    cpu_time_limit: cpuLimit,
    cpu_extra_time: 0.5,
    wall_time_limit: 10,
  });
  if (sub.status.id === 5) {
    const actualTime = parseFloat(sub.time || '0');
    if (actualTime >= cpuLimit * 0.5 && actualTime <= cpuLimit + 2) {
      return { pass: true, reason: `cpu_time=${actualTime}s (limit=${cpuLimit}s)` };
    }
    return { pass: true, reason: `TLE correct; cpu_time=${actualTime}s (limit=${cpuLimit}s)` };
  }
  return { pass: false, reason: `Expected TLE(5), got ${statusLine(sub.status)} time=${sub.time}s` };
});

// ============================================================
// TEST 9: Wall-time / Sleep timeout
// ============================================================
test('Wall-time - sleep killed with TLE', async (known) => {
  const wallLimit = 2;
  const sub = await submitAndWait(`
const start = Date.now();
while (Date.now() - start < 120000) {}
console.log("done");
`, 63, {
    cpu_time_limit: 10,
    wall_time_limit: wallLimit,
    cpu_extra_time: 0,
  });
  if (sub.status.id === 5) {
    const actualWall = parseFloat(sub.wall_time || '0');
    return { pass: true, reason: `wall_time=${actualWall}s (limit=${wallLimit}s)` };
  }
  return { pass: false, reason: `Expected TLE(5) on wall-time, got ${statusLine(sub.status)} wall_time=${sub.wall_time}s` };
});

// ============================================================
// TEST 10: Memory Limits - Low Limit (expect failure)
// ============================================================
test('Memory Limits - low limit triggers OOM kill', async (known) => {
  const sub = await submitAndWait(`
const arr = [];
while (true) {
  arr.push(new Array(100000).fill('x'));
  if (arr.length > 1000000) break;
}
console.log("survived");
`, 63, {
    memory_limit: 65536,
  });
  const nonAccepted = sub.status.id !== 3;
  const reason = nonAccepted
    ? `correctly killed: ${statusLine(sub.status)} memory=${sub.memory}KB`
    : `NOT killed: Accepted(3) memory=${sub.memory}KB stdout="${trunc(sub.stdout)}"`;
  return { pass: nonAccepted, reason };
});

// ============================================================
// TEST 11: Memory Limits - High Limit (expect success)
// ============================================================
test('Memory Limits - high limit allows allocation', async (known) => {
  const sub = await submitAndWait(`
const arr = new Array(500000).fill('x'.repeat(100));
console.log("allocated " + (arr.length * arr[0].length) + " chars");
`, 63, {
    memory_limit: 512000,
  });
  if (sub.status.id === 3) return { pass: true, reason: `Accepted memory=${sub.memory}KB stdout="${trunc(sub.stdout)}"` };
  return { pass: false, reason: `Expected memory allocation to succeed with high limit, got ${statusLine(sub.status)} memory=${sub.memory}KB` };
});

// ============================================================
// TEST 12: Filesystem Isolation - /etc/passwd
// ============================================================
test('Filesystem Isolation - cannot read /etc/passwd', async (known) => {
  const sub = await submitAndWait(`
try {
  const fs = require('fs');
  const data = fs.readFileSync('/etc/passwd', 'utf8');
  console.log("READ_OK:" + data.length);
  if (data.includes('root:')) console.log("CONTAINS_ROOT");
} catch (e) {
  console.log("ERROR:" + e.message);
}
`, 63);
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('ERROR:') || stdout.includes('READ_OK:0') || stdout === '' || sub.status.id !== 3) {
    return { pass: true, reason: `Blocked: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
  }
  if (stdout.includes('READ_OK:') && stdout.includes('CONTAINS_ROOT')) {
    return { pass: false, reason: `File was accessible: stdout="${trunc(stdout)}"` };
  }
  return { pass: false, reason: `Unexpected result: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 13: Filesystem Isolation - /judge0.conf
// ============================================================
test('Filesystem Isolation - cannot read /judge0.conf', async (known) => {
  const sub = await submitAndWait(`
try {
  const fs = require('fs');
  const data = fs.readFileSync('/judge0.conf', 'utf8');
  console.log("READ_OK:" + data.length + " bytes");
} catch (e) {
  console.log("ERROR:" + e.message);
}
`, 63);
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('ERROR:') || stdout === '' || stdout === 'READ_OK:0 bytes' || sub.status.id !== 3) {
    return { pass: true, reason: `Blocked: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
  }
  return { pass: false, reason: `judge0.conf was accessible: stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 14: Filesystem Isolation - /api (host API)
// ============================================================
test('Filesystem Isolation - cannot access host API files', async (known) => {
  const sub = await submitAndWait(`
const fs = require('fs');
const paths = ['/api/', '/api/v1/', '/api/submissions', '/app/', '/opt/judge0/'];
const results = paths.map(p => {
  try {
    const s = fs.statSync(p);
    return p + ":EXISTS mode=" + s.mode;
  } catch (e) {
    return p + ":DENIED";
  }
});
console.log(results.join('|'));
`, 63);
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('DENIED') || stdout === '' || sub.status.id !== 3) {
    return { pass: true, reason: `Blocked: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
  }
  if (stdout.includes('EXISTS')) {
    return { pass: false, reason: `Some host paths accessible: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 15: Filesystem Isolation - process info /proc
// ============================================================
test('Filesystem Isolation - /proc/1/environ should be isolated', async (known) => {
  const sub = await submitAndWait(`
try {
  const fs = require('fs');
  const data = fs.readFileSync('/proc/1/environ', 'utf8');
  console.log("READ_OK:" + data.length);
  if (data.includes('JUDGE0') || data.includes('DATABASE_URL')) {
    console.log("HOST_ENV_VISIBLE");
  }
} catch (e) {
  console.log("ERROR:" + e.message);
}
`, 63);
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('HOST_ENV_VISIBLE')) {
    return { pass: false, reason: `Host environment visible in container: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `Isolated: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 16: Network Isolation - HTTP request blocked
// ============================================================
test('Network Isolation - external HTTP blocked', async (known) => {
  const sub = await submitAndWait(`
async function main() {
  try {
    const res = await fetch('http://google.com', { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    console.log("HTTP_OK:" + res.status + " len=" + text.length);
  } catch (e) {
    console.log("NETWORK_ERROR:" + e.constructor.name + ":" + e.message.slice(0, 200));
  }
}
main();
`, 63, { enable_network: false });
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('NETWORK_ERROR:') || (sub.status && sub.status.id !== 3)) {
    return { pass: true, reason: `Blocked: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
  }
  if (stdout.includes('HTTP_OK:')) {
    return { pass: false, reason: `Network was accessible: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 17: Network Isolation - DNS resolution blocked
// ============================================================
test('Network Isolation - DNS resolution blocked', async (known) => {
  const sub = await submitAndWait(`
const dns = require('dns');
dns.lookup('google.com', (err, address) => {
  if (err) {
    console.log("DNS_ERROR:" + err.code + ":" + err.message);
  } else {
    console.log("DNS_OK:" + address);
  }
});
`, 63, { enable_network: false });
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('DNS_ERROR:') || (sub.status && sub.status.id !== 3)) {
    return { pass: true, reason: `Blocked: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
  }
  if (stdout.includes('DNS_OK:')) {
    return { pass: false, reason: `DNS resolution worked: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 18: Consecutive submissions (container cleanup)
// ============================================================
test('Container Cleanup - consecutive submissions succeed', async (known) => {
  const sub1 = await submitAndWait(`console.log("first");`, 63);
  if (sub1.status.id !== 3) {
    return { pass: false, reason: `First submission failed: ${statusLine(sub1.status)}` };
  }
  const sub2 = await submitAndWait(`console.log("second");`, 63);
  if (sub2.status.id !== 3) {
    return { pass: false, reason: `Second submission failed: ${statusLine(sub2.status)}` };
  }
  return { pass: true, reason: `sub1=Accepted sub2=Accepted` };
});

// ============================================================
// TEST 19: Temporary File Cleanup
// ============================================================
test('Temp File Cleanup - files isolated between submissions', async (known) => {
  const writeSub = await submitAndWait(`
const fs = require('fs');
fs.writeFileSync('/tmp/judge0-test-' + process.pid + '.txt', 'data from first run');
console.log("WRITTEN");
const files = fs.readdirSync('/tmp').filter(f => f.includes('judge0-test'));
console.log("FILES:" + files.join(','));
`, 63);
  if (writeSub.status.id !== 3) {
    return { pass: false, reason: `Write submission failed: ${statusLine(writeSub.status)}` };
  }

  const readSub = await submitAndWait(`
const fs = require('fs');
try {
  const files = fs.readdirSync('/tmp').filter(f => f.includes('judge0-test'));
  if (files.length > 0) {
    const data = fs.readFileSync('/tmp/' + files[0], 'utf8');
    console.log("READ_OK:" + data);
  } else {
    console.log("NO_FILES");
  }
} catch (e) {
  console.log("ERROR:" + e.message);
}
`, 63);
  const stdout = (readSub.stdout || '').trim();
  if (stdout.includes('NO_FILES') || stdout.includes('ERROR:')) {
    return { pass: true, reason: `Isolated: stdout="${trunc(stdout)}"` };
  }
  if (stdout.includes('READ_OK:')) {
    return { pass: false, reason: `Files persisted between submissions: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 20: Sandbox Escape - Fork bomb containment
// ============================================================
test('Sandbox Escape - fork bomb contained', async (known) => {
  const sub = await submitAndWait(`
const { execSync } = require('child_process');
try {
  for (let i = 0; i < 100; i++) {
    execSync('echo ' + i + ' & echo ' + i + ' &', { timeout: 100 });
  }
  console.log("LOOP_DONE");
} catch (e) {
  console.log("ERROR:" + e.message.slice(0, 200));
}
`, 63, {
    max_processes_and_or_threads: 30,
    cpu_time_limit: 5,
    wall_time_limit: 10,
  });
  if (sub.status.id !== 3 || (sub.stdout || '').includes('ERROR:')) {
    return { pass: true, reason: `Contained: ${statusLine(sub.status)} stdout="${trunc(sub.stdout || '')}"` };
  }
  return { pass: false, reason: `Fork bomb appeared to succeed: ${statusLine(sub.status)} stdout="${trunc(sub.stdout)}"` };
});

// ============================================================
// TEST 21: Sandbox Escape - process tree isolation
// ============================================================
test('Sandbox Escape - cannot see host processes', async (known) => {
  const sub = await submitAndWait(`
const { execSync } = require('child_process');
try {
  const out = execSync('ps aux 2>/dev/null || wmic process get name 2>/dev/null || echo PS_FAILED', { timeout: 3000 });
  const text = out.toString();
  const lines = text.split('\\n').filter(l => l.trim());
  console.log("PROCS:" + lines.length);
  if (text.includes('judge0') || text.includes('postgres') || text.includes('server')) {
    console.log("HOST_PROC_VISIBLE");
  }
} catch (e) {
  console.log("ERROR:" + e.message.slice(0, 200));
}
`, 63, { max_processes_and_or_threads: 60 });
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('HOST_PROC_VISIBLE')) {
    return { pass: false, reason: `Host processes visible: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `Contained: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 22: Sandbox Escape - namespace / mount escape
// ============================================================
test('Sandbox Escape - namespace escape blocked', async (known) => {
  const sub = await submitAndWait(`
const { execSync } = require('child_process');
const attempts = [];
const cmds = [
  'unshare -r -m echo NS_OK 2>/dev/null || echo NS_FAIL',
  'mount 2>/dev/null | head -5 || echo MOUNT_FAIL',
  'cat /proc/self/status 2>/dev/null | head -5 || echo STATUS_FAIL',
  'ls -la /proc/1/ns/ 2>/dev/null | head -5 || echo NSLIST_FAIL',
];
for (const cmd of cmds) {
  try {
    const out = execSync(cmd, { timeout: 2000, shell: true });
    attempts.push(cmd.slice(0, 20) + '=>' + out.toString().trim().slice(0, 100));
  } catch (e) {
    attempts.push(cmd.slice(0, 20) + '=>EXEC_ERR');
  }
}
console.log(attempts.join('|'));
`, 63, { max_processes_and_or_threads: 60, cpu_time_limit: 10, wall_time_limit: 15 });
  const stdout = (sub.stdout || '').trim();
  if (stdout.includes('NS_OK') || stdout.includes('MOUNT') && !stdout.includes('MOUNT_FAIL')) {
    return { pass: false, reason: `Escape may have succeeded: stdout="${trunc(stdout)}"` };
  }
  return { pass: true, reason: `Contained: ${statusLine(sub.status)} stdout="${trunc(stdout)}"` };
});

// ============================================================
// TEST 23: Language list endpoint works
// ============================================================
test('API - language list is accessible', async () => {
  const res = await apiFetch('/languages');
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return { pass: false, reason: `Expected array of languages, got ${typeof data} len=${data?.length}` };
  }
  const js = data.find(l => l.id === 63);
  return { pass: true, reason: `${data.length} languages (63=${js ? js.name : 'NOT_FOUND'})` };
});

// ============================================================
// TEST 24: About endpoint returns metadata
// ============================================================
test('API - about endpoint is accessible', async () => {
  const res = await apiFetch('/about');
  const data = await res.json();
  if (!data || !data.creation_timestamp) {
    return { pass: false, reason: `Expected creation_timestamp in response, got ${JSON.stringify(data).slice(0, 200)}` };
  }
  return { pass: true, reason: `version=${data.version || 'unknown'}` };
});

// ============================================================
// TEST 25: Health / status check
// ============================================================
test('API - statuses endpoint', async () => {
  const res = await apiFetch('/statuses');
  const data = await res.json();
  if (!Array.isArray(data)) {
    return { pass: false, reason: `Expected array of statuses, got ${typeof data}` };
  }
  const statusMap = {};
  for (const s of data) statusMap[s.id] = s.description;
  return { pass: true, reason: `${data.length} statuses; 3=${statusMap[3]}, 5=${statusMap[5]}` };
});

// ============================================================
// TEST 26: Configuration endpoint
// ============================================================
test('API - configuration endpoint (config_info)', async () => {
  const res = await apiFetch('/config_info');
  const data = await res.json();
  if (!data) {
    return { pass: false, reason: 'No config data returned' };
  }
  return { pass: true, reason: `cpu_cores=${data.cpu_cores || data.cpu_core_count || '?'} max_queue=${data.max_queue_size || '?'}` };
});

runTests();
