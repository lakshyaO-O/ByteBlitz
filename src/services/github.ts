'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, increment,
} from 'firebase/firestore';
import type { GitHubIntegration } from '@/types';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export async function connectGithub(userId: string, code: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) return;

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

  const integration: GitHubIntegration = {
    connected: true,
    githubUsername: userData.login,
    accessToken,
    repos,
    lastSynced: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', userId, 'github', 'integration'), integration);
}

export async function syncRepos(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const snap = await getDoc(doc(db, 'users', userId, 'github', 'integration'));
  if (!snap.exists()) return;

  const data = snap.data() as GitHubIntegration;
  if (!data.accessToken) return;

  const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });

  if (!reposResponse.ok) return;

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

  await updateDoc(doc(db, 'users', userId, 'github', 'integration'), {
    repos,
    lastSynced: new Date().toISOString(),
  });
}

export async function getRepos(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const snap = await getDoc(doc(db, 'users', userId, 'github', 'integration'));
  if (!snap.exists()) return [];
  return (snap.data() as GitHubIntegration).repos || [];
}

export async function disconnectGithub(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  await deleteDoc(doc(db, 'users', userId, 'github', 'integration'));
}
