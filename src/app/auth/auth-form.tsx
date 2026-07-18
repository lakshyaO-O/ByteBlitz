'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase/provider';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getAuth,
} from 'firebase/auth';
import { getDoc, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertCircle, Chrome, Loader2 } from 'lucide-react';

async function setSessionCookie(token: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const ALLOWED_REDIRECTS = new Set([
  '/dashboard',
  '/arena',
  '/practice',
  '/profile',
  '/settings',
  '/challenges',
  '/leaderboard',
  '/learning',
  '/friends',
  '/achievements',
  '/admin/setup',
  '/',
]);

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return '/dashboard';
  try {
    const url = new URL(redirect, window.location.origin);
    if (url.origin !== window.location.origin) return '/dashboard';
    const path = url.pathname;
    for (const allowed of ALLOWED_REDIRECTS) {
      if (path === allowed || path.startsWith(allowed + '/')) {
        return path;
      }
    }
  } catch {
    return '/dashboard';
  }
  return '/dashboard';
}

function sanitizeFirebaseError(err: any): string {
  if (!err || !err.code) {
    return 'An unexpected error occurred. Please try again.';
  }

  const code = err.code;
  const isDev = process.env.NODE_ENV === 'development';

  const userMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': '',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site and try again.',
    'auth/unauthorized-domain': 'This domain is not authorized for sign-in. Please contact support.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in providers > Google).',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',
    'auth/requires-recent-login': 'Please log out and log in again to continue.',
    'auth/credential-already-in-use': 'This credential is already linked to another account.',
    'auth/provider-already-linked': 'This account is already linked to this provider.',
    'auth/invalid-action-code': 'The reset link is invalid or expired.',
    'auth/expired-action-code': 'The reset link has expired.',
    'auth/user-mismatch': 'The user credentials do not match. Please try again.',
  };

  const message = userMessages[code];
  if (message !== undefined) return message;

  if (isDev) {
    return `Authentication error (${code}). Please try again.`;
  }

  return 'Authentication failed. Please try again.';
}

function AuthForm() {
  const auth = useAuth();
  const db = useFirestore();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsSignUp(false);
    } else if (mode === 'register') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          await setSessionCookie(token);
        } catch (e: any) {
          console.error('[Auth] Failed to set session cookie:', e?.code || e?.message || e);
        }
        const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
        await new Promise(r => setTimeout(r, 300));
        window.location.href = redirectTo;
      }
    });
    return () => unsub();
  }, [auth, searchParams]);

  const createUserProfile = async (userId: string, email: string, displayName: string, photoURL: string, isNewUser: boolean = false) => {
    if (!db) return;

    const userRef = doc(db, 'users', userId);
    const existingProfile = await getDoc(userRef);

    if (existingProfile.exists()) {
      await updateDoc(userRef, {
        onlineStatus: 'online',
        lastActive: serverTimestamp(),
      });
      return;
    }

    const idToken = await getAuth().currentUser?.getIdToken();
    if (!idToken) return;

    const res = await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ username: displayName, email, photoURL }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create profile');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      if (isSignUp && !username) {
        throw new Error('Please enter a username');
      }
      if (isSignUp && username.trim().length < 2) {
        throw new Error('Username must be at least 2 characters');
      }
      if (isSignUp && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      let user;
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        await updateProfile(user, { displayName: username });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }

      const photoURL = user.photoURL || '';
      await createUserProfile(user.uid, user.email || email, user.displayName || email.split('@')[0], photoURL, isSignUp);

      const idToken = await user.getIdToken();
      await setSessionCookie(idToken);
    } catch (err: any) {
      console.error('[Auth] Sign-in error:', err?.code || '(no code)', err?.message || '', err?.stack || '(no stack)');
      const msg = sanitizeFirebaseError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const isNewGoogleUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      await createUserProfile(user.uid, user.email || '', user.displayName || 'Player', user.photoURL || '', isNewGoogleUser);

      const idToken = await user.getIdToken();
      await setSessionCookie(idToken);
    } catch (err: any) {
      console.error('[Auth] Google sign-in error:', err?.code || '(no code)', err?.message || '', err?.stack || '(no stack)');
      const msg = sanitizeFirebaseError(err);
      if (msg) setError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      await sendPasswordResetEmail(auth, email);
      setError(null);
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error('[Auth] Forgot password error:', err?.code || '(no code)', err?.message || '', err?.stack || '(no stack)');
      const msg = sanitizeFirebaseError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full bg-background/95 border-border">
          <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
              <img src="/logo.svg" alt="DevRann" className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold tracking-tight">Reset Password</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-headline font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <Card className="max-w-md w-full shadow-lg border-border/60">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <img src="/logo.svg" alt="DevRann" className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold tracking-tight">
            {isSignUp ? 'Join DevRann' : 'Welcome Back'}
          </CardTitle>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {isSignUp
              ? 'Create your account and enter the arena.'
              : 'Sign in to continue your journey.'}
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl font-headline font-bold text-sm border-border/70 hover:bg-muted/60"
            onClick={handleGoogleSignIn}
            disabled={loading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5 mr-2" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground/60 font-semibold">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Username</label>
                <Input
                  type="text"
                  placeholder="CoderName"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  maxLength={20}
                />
                <p className="text-[10px] text-muted-foreground/60">2-20 characters</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || isGoogleLoading}
              className="w-full h-12 rounded-xl font-headline font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setEmail('');
                setPassword('');
                setUsername('');
                setConfirmPassword('');
              }}
              className="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground/60">
              <div className="p-2 rounded-lg bg-muted/20">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <span className="text-primary text-[10px] font-bold">1v1</span>
                </div>
                Real-time battles
              </div>
              <div className="p-2 rounded-lg bg-muted/20">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <span className="text-primary text-[10px] font-bold">ELO</span>
                </div>
                Climb the ladder
              </div>
              <div className="p-2 rounded-lg bg-muted/20">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <span className="text-primary text-[10px] font-bold">AI</span>
                </div>
                Smart feedback
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthFormWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
