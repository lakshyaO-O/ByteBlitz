'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { isFirebaseConfigured } from '@/firebase/config';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDoc, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertCircle, Chrome, Loader2 } from 'lucide-react';

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
    console.warn('[Auth] Unknown error (no code):', err?.message || err, err?.stack || '');
    return 'An unexpected error occurred. Please try again.';
  }

  const code = err.code;
  const isDev = process.env.NODE_ENV === 'development';

  console.warn(`[Auth] Firebase error: ${code}`, err.message || '', isDev ? err.stack || '' : '');

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
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
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

  const [firebaseAvailable, setFirebaseAvailable] = useState(true);

  useEffect(() => {
    setFirebaseAvailable(isFirebaseConfigured());
  }, []);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsSignUp(false);
    } else if (mode === 'register') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!auth) {
      console.log('[AuthPage] auth is null, skipping auth state listener');
      return;
    }
    console.log('[AuthPage] Setting up onAuthStateChanged listener');
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthPage] Auth state changed: USER SIGNED IN', firebaseUser.uid);
        console.log('[AuthPage] auth.currentUser:', auth.currentUser?.uid);
        const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
        console.log('[AuthPage] Redirecting to:', redirectTo);
        window.location.href = redirectTo;
      } else {
        console.log('[AuthPage] Auth state changed: NO USER');
      }
    });
    return () => unsub();
  }, [auth, searchParams]);

  const createUserProfile = async (userId: string, email: string, displayName: string, photoURL: string, isNewUser: boolean = false) => {
    if (!db) return;

    const userRef = doc(db, 'users', userId);
    const existingProfile = await getDoc(userRef);

    if (existingProfile.exists() && !isNewUser) {
      await updateDoc(userRef, {
        onlineStatus: 'online',
        lastActive: serverTimestamp(),
      });
      return;
    }

    if (existingProfile.exists() && isNewUser) {
      await updateDoc(userRef, {
        email,
        photoURL,
        onlineStatus: 'online',
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    await setDoc(userRef, {
      uid: userId,
      username: displayName,
      email,
      photoURL,
      coins: 0,
      xp: 0,
      level: 1,
      rating: 1200,
      highestRating: 1200,
      highestScore: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGamesPlayed: 0,
      tier: 'Beginner',
      rank: 0,
      lastActive: serverTimestamp(),
      onlineStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'leaderboard', userId), {
      userId,
      username: displayName,
      photoURL,
      rating: 1200,
      wins: 0,
      tier: 'Beginner',
      period: 'all-time',
      periodStart: serverTimestamp(),
      periodEnd: serverTimestamp(),
    }, { merge: true }).catch(() => {});
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

      console.log('[AuthPage] Starting authentication...');
      let user;
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        await updateProfile(user, { displayName: username });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }
      console.log('[AuthPage] Authentication SUCCESS, user:', user.uid);
      console.log('[AuthPage] auth.currentUser after login:', auth.currentUser?.uid);

      const photoURL = user.photoURL || '';
      await createUserProfile(user.uid, user.email || email, user.displayName || email.split('@')[0], photoURL, isSignUp);
      console.log('[AuthPage] User profile created/updated in Firestore');

      const idToken = await user.getIdToken();
      document.cookie = `__session=${idToken};path=/;max-age=3600;samesite=lax`;
      console.log('[AuthPage] __session cookie set, redirecting...');

      const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
      window.location.href = redirectTo;
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
      document.cookie = `__session=${idToken};path=/;max-age=3600;samesite=lax`;

      const redirectTo = sanitizeRedirect(searchParams.get('redirect'));
      window.location.href = redirectTo;
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
        <Card className="max-w-md w-full bg-card/80 border-border backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2 text-primary">
              <Zap className="h-8 w-8 fill-primary" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Reset Password</CardTitle>
            <p className="text-xs text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-background hover:bg-primary/90 font-headline font-bold uppercase rounded-none"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
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
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full bg-card/80 border-border backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2 text-primary">
            <Zap className="h-8 w-8 fill-primary" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">
            {isSignUp ? 'Join CodezArena' : 'Welcome Back'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isSignUp
              ? 'Create your account and enter the arena.'
              : 'Sign in to continue your journey.'}
          </p>
        </CardHeader>
        <CardContent>
          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-4 font-headline font-bold uppercase text-sm border-border hover:bg-muted"
            onClick={handleGoogleSignIn}
            disabled={loading || isGoogleLoading || !firebaseAvailable}
          >
            {!firebaseAvailable ? (
              'Firebase not configured'
            ) : isGoogleLoading ? (
              'Connecting...'
            ) : (
              <>
                <Chrome className="w-5 h-5 mr-2" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</label>
                <Input
                  type="text"
                  placeholder="CoderName"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="mt-1 bg-muted/50 border-border"
                  maxLength={20}
                />
                <p className="text-[10px] text-muted-foreground mt-1">2-20 characters</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1 bg-muted/50 border-border"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
              <Input
                type="password"
                placeholder={isSignUp ? 'Min 6 characters' : ''}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-1 bg-muted/50 border-border"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
            )}

            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              disabled={loading || isGoogleLoading}
              className="w-full h-12 bg-primary text-background hover:bg-primary/90 font-headline font-bold uppercase rounded-none"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
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
              className="text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
            <p> Compete 1v1 in real-time coding battles</p>
            <p> Climb the ELO ladder</p>
            <p> Become a legendary architect</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
