'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { firebaseConfig } from '@/firebase/config';

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

  const isDemoMode = firebaseConfig.apiKey === 'demo-key';
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password || !username) {
        throw new Error('Please fill in all fields');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email');
      }

      if (isDemoMode) {
        const mockUser = {
          uid: 'mock-' + username.toLowerCase().replace(/\s+/g, '-'),
          email: email,
          displayName: username,
          photoURL: `https://picsum.photos/seed/${username}/200/200`
        };
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        
        // Save initial stats to mock database
        const storedDb = localStorage.getItem('mock_firestore_db') || '{}';
        const dbState = JSON.parse(storedDb);
        dbState[`users/${mockUser.uid}`] = {
          id: mockUser.uid,
          uid: mockUser.uid,
          username: username,
          email: email,
          rating: 1200,
          highestRating: 1200,
          wins: 0,
          losses: 0,
          draws: 0,
          xp: 0,
          level: 1,
          tier: 'Beginner',
          photoURL: mockUser.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('mock_firestore_db', JSON.stringify(dbState));

        window.dispatchEvent(new Event('mock-auth-change'));
        window.dispatchEvent(new Event('mock-db-change'));
        router.push('/dashboard');
        return;
      }

      if (!auth || !db) {
        throw new Error('Firebase not initialized');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, {
        displayName: username,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        rating: 1200,
        highestRating: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        xp: 0,
        level: 1,
        tier: 'Beginner',
        photoURL: `https://picsum.photos/seed/${username}/200/200`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Redirect to app
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      if (isDemoMode) {
        const mockUsername = email.split('@')[0];
        const mockUser = {
          uid: 'mock-' + mockUsername.toLowerCase().replace(/\s+/g, '-'),
          email: email,
          displayName: mockUsername.charAt(0).toUpperCase() + mockUsername.slice(1),
          photoURL: `https://picsum.photos/seed/${mockUsername}/200/200`
        };
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        window.dispatchEvent(new Event('mock-auth-change'));
        window.dispatchEvent(new Event('mock-db-change'));
        router.push('/dashboard');
        return;
      }

      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-headline font-black tracking-tight">CODEZARENA</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? 'Join the competitive coding arena' : 'Welcome back to the arena'}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center uppercase tracking-tight">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Firebase Setup Warning Banner */}
              {isDemoMode && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm space-y-2">
                  <div className="font-bold flex items-center gap-1.5 uppercase text-xs tracking-wider">
                    ⚠️ Firebase Configuration Required
                  </div>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    This project is configured with dummy demo credentials. Authenticating or creating accounts will fail until you populate your real keys in <code className="bg-amber-950/50 px-1 py-0.5 rounded font-mono">.env.local</code>.
                  </p>
                  <p className="text-xs">
                    Please refer to the <a href="file:///c:/Users/nothing/Downloads/download/ByteBlitz/FIREBASE_SETUP.md" className="underline font-bold text-amber-200 hover:text-amber-100">FIREBASE_SETUP.md</a> guide for credentials instructions.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Username (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Username
                  </label>
                  <Input
                    type="text"
                    placeholder="Choose your battle name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="mt-1 bg-muted/50 border-border"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder={isSignUp ? 'Min 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Confirm Password
                  </label>
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-background hover:bg-primary/90 font-headline font-bold uppercase rounded-none mt-6"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
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
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
          <p>🎮 Compete 1v1 in real-time coding battles</p>
          <p>📊 Climb the ELO ladder</p>
          <p>🏆 Become a legendary architect</p>
        </div>
      </div>
    </div>
  );
}
