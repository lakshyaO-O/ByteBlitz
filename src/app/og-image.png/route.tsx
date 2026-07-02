import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #05070f 0%, #0d1321 50%, #1a0a2e 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="256" cy="256" r="230" fill="#0d1321" />
            <path d="M120 290C120 90 392 90 392 290Z" fill="#0d1321" stroke="#28f7a5" strokeWidth="18" strokeLinejoin="round" />
            <path d="M144 150C106 84 72 42 86 28" stroke="#28f7a5" strokeWidth="20" strokeLinecap="round" />
            <path d="M368 150C406 84 440 42 426 28" stroke="#28f7a5" strokeWidth="20" strokeLinecap="round" />
            <path d="M158 242L354 242" stroke="#7c5cff" strokeWidth="16" strokeLinecap="round" />
            <path d="M256 242L256 348" stroke="#7c5cff" strokeWidth="14" strokeLinecap="round" />
            <rect x="202" y="256" width="24" height="8" rx="4" fill="#28f7a5" />
            <rect x="286" y="256" width="24" height="8" rx="4" fill="#28f7a5" />
          </svg>
          <span
            style={{
              color: '#ffffff',
              fontSize: '64px',
              fontWeight: 800,
              letterSpacing: '4px',
            }}
          >
            DEVRANN
          </span>
        </div>
        <span
          style={{
            color: '#7c5cff',
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '8px',
            marginBottom: '32px',
          }}
        >
          COMPETITIVE CODING
        </span>
        <span
          style={{
            color: '#94a3b8',
            fontSize: '22px',
            fontWeight: 400,
            maxWidth: '700px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Learn coding, practice DSA, compete in live arenas, and build your developer profile with AI-powered tools.
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
