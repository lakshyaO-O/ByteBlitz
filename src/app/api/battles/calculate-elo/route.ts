import { NextRequest, NextResponse } from 'next/server';

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerRating, opponentRating, result } = body;

    if (typeof playerRating !== 'number' || typeof opponentRating !== 'number') {
      return NextResponse.json({ error: 'Invalid ratings' }, { status: 400 });
    }

    const K = 32;
    const expected = expectedScore(playerRating, opponentRating);

    let score: number;
    if (result === 'WIN') score = 1;
    else if (result === 'LOSS') score = 0;
    else if (result === 'DRAW') score = 0.5;
    else {
      return NextResponse.json({ error: 'Invalid result. Use WIN, LOSS, or DRAW' }, { status: 400 });
    }

    const newRating = Math.round(playerRating + K * (score - expected));

    return NextResponse.json({
      newRating,
      ratingChange: newRating - playerRating,
      expectedScore: Math.round(expected * 100) / 100,
    });
  } catch (err: any) {
    console.error('[ELO Calculate] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
