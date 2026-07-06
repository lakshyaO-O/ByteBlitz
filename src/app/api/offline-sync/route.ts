import { NextRequest, NextResponse } from 'next/server';

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retries: number;
}

export async function POST(request: NextRequest) {
  try {
    const action: QueuedAction = await request.json();
    const { type, payload } = action;

    switch (type) {
      case 'SUBMIT_CODE': {
        const { battleId, code } = payload;
        if (!battleId || typeof code !== 'string') {
          return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        const res = await fetch(`${request.nextUrl.origin}/api/battles/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ battleId, code }),
        });
        return res;
      }
      default:
        return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Offline Sync] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
