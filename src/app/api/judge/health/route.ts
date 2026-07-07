import { NextRequest, NextResponse } from 'next/server';

interface BackendStatus {
  configured: boolean;
  reachable: boolean;
  version: string | null;
  latencyMs: number | null;
  error: string | null;
}

interface HealthResult {
  judge0: BackendStatus;
  piston: BackendStatus;
  timestamp: string;
}

async function checkJudge0(): Promise<BackendStatus> {
  const url = process.env.JUDGE0_API_URL;
  const key = process.env.JUDGE0_API_KEY;

  if (!url) {
    return { configured: false, reachable: false, version: null, latencyMs: null, error: 'JUDGE0_API_URL not configured' };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['X-Auth-Token'] = key;

    const res = await fetch(`${url}/about`, { headers, signal: controller.signal });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { configured: true, reachable: false, version: null, latencyMs, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json().catch(() => ({}));
    return {
      configured: true,
      reachable: true,
      version: data?.version || null,
      latencyMs,
      error: null,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return { configured: true, reachable: false, version: null, latencyMs, error: err.message || 'Connection failed' };
  }
}

async function checkPiston(): Promise<BackendStatus> {
  const url = process.env.PISTON_API_URL;
  if (!url) {
    return { configured: false, reachable: false, version: null, latencyMs: null, error: 'PISTON_API_URL not configured' };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url.replace('/execute', '/versions'), {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { configured: true, reachable: false, version: null, latencyMs, error: `HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return {
      configured: true,
      reachable: true,
      version: Array.isArray(data) ? `${data.length} runtimes` : null,
      latencyMs,
      error: null,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return { configured: true, reachable: false, version: null, latencyMs, error: err.message || 'Connection failed' };
  }
}

export async function GET(_request: NextRequest) {
  try {
    const [judge0, piston] = await Promise.all([checkJudge0(), checkPiston()]);

    const result: HealthResult = {
      judge0,
      piston,
      timestamp: new Date().toISOString(),
    };

    const allDegraded = (!result.judge0.reachable && result.judge0.configured) &&
                        (!result.piston.reachable && result.piston.configured);
    const noBackend = !result.judge0.configured && !result.piston.configured;

    return NextResponse.json(result, {
      status: noBackend ? 503 : allDegraded ? 503 : 200,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
