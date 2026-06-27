'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getDoc, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertCircle, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';
import { firebaseConfig, isDemoMode } from '@/firebase/config';

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const demo = isDemoMode();

  const createUserProfile = async (userId: string, email: string, displayName: string, photoURL: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    const existingProfile = await getDoc(userRef);
    if (existingProfile.exists()) {
      await updateDoc(userRef, {
        username: displayName,
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
    }, { merge: true });
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

      if (demo) {
        const normalizedName = username || email.split('@')[0];
        const mockUser = {
          uid: 'mock-' + normalizedName.toLowerCase().replace(/\s+/g, '-'),
          email,
          displayName: normalizedName,
          photoURL: `https://picsum.photos/seed/${encodeURIComponent(normalizedName)}/200/200`,
        };
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        const storedDb = localStorage.getItem('mock_firestore_db') || '{}';
        const dbState = JSON.parse(storedDb);
        dbState[`users/${mockUser.uid}`] = {
          ...dbState[`users/${mockUser.uid}`],
          id: mockUser.uid,
          uid: mockUser.uid,
          username: normalizedName,
          email,
          rating: 1200,
          highestRating: 1200,
          wins: 0,
          losses: 0,
          draws: 0,
          xp: 0,
          level: 1,
          tier: 'Beginner',
          photoURL: mockUser.photoURL,
          coins: 0,
          onlineStatus: 'online',
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('mock_firestore_db', JSON.stringify(dbState));
        window.dispatchEvent(new Event('mock-auth-change'));
        window.dispatchEvent(new Event('mock-db-change'));
        router.push('/dashboard');
        return;
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

      const photoURL =
        user.photoURL || `https://picsum.photos/seed/${encodeURIComponent(user.displayName || user.email || 'user')}/200/200`;
      await createUserProfile(user.uid, user.email || email, user.displayName || email.split('@')[0], photoURL);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
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

      if (demo) {
        const normalizedName = 'Player' + Math.floor(Math.random() * 1000);
        const mockUser = {
          uid: 'mock-google-' + Date.now(),
          email: normalizedName + '@demo.local',
          displayName: normalizedName,
          photoURL: `https://picsum.photos/seed/${encodeURIComponent(normalizedName)}/200/200`,
        };
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        const storedDb = localStorage.getItem('mock_firestore_db') || '{}';
        const dbState = JSON.parse(storedDb);
        dbState[`users/${mockUser.uid}`] = {
          ...dbState[`users/${mockUser.uid}`],
          id: mockUser.uid,
          uid: mockUser.uid,
          username: mockUser.displayName,
          email: mockUser.email,
          rating: 1200,
          highestRating: 1200,
          wins: 0,
          losses: 0,
          draws: 0,
          xp: 0,
          level: 1,
          tier: 'Beginner',
          photoURL: mockUser.photoURL,
          coins: 0,
          onlineStatus: 'online',
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('mock_firestore_db', JSON.stringify(dbState));
        window.dispatchEvent(new Event('mock-auth-change'));
        window.dispatchEvent(new Event('mock-db-change'));
        router.push('/dashboard');
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await createUserProfile(user.uid, user.email || '', user.displayName || 'Player', user.photoURL || '');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
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

      if (demo) {
        setError('Demo mode: password reset is simulated. In production, a reset email would be sent.');
        return;
      }

      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      await sendPasswordResetEmail(auth, email);
      setError(null);
      alert('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
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
              Enter your email and we'll send you a reset link.
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
            disabled={loading || isGoogleLoading}
          >
            {isGoogleLoading ? (
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
