import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || 'unknown';
  // eslint-disable-next-line no-console
  console.error('[Google popup] rejected:', code);
  return NextResponse.json({ ok: true });
}