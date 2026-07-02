import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get GitHub access token' }, { status: 400 });
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();

    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const reposData = await reposResponse.json();

    const repos = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || '',
      url: repo.html_url,
      language: repo.language || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
    }));

    const db = getAdminFirestore();
    await db.collection('users').doc(uid).collection('github').doc('integration').set({
      connected: true,
      githubUsername: userData.login,
      accessToken,
      repos,
      lastSynced: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      githubUsername: userData.login,
      repos,
    });
  } catch (err: any) {
    console.error('[GitHub Connect] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
