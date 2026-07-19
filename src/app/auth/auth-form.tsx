'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase/provider';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Chrome, Loader2, AlertCircle } from 'lucide-react';

function AuthForm() {
  const auth = useAuth();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  async function finishSignIn(user: any) {
    await createProfile(user.uid, user.email || '', user.displayName || 'Player', user.photoURL || '');
    const token = await user.getIdToken();
    const ok = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (ok.ok) router.push(redirectTo);
  }

  useEffect(() => {
    if (searchParams.get('mode') === 'login') setIsSignUp(false);
    if (searchParams.get('mode') === 'register') setIsSignUp(true);
  }, [searchParams]);

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      await finishSignIn(result.user);
    }).catch((err) => {
      if (err.code !== 'auth/credential-already-in-use') console.error('[Redirect Result]', err);
    });
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) router.push(redirectTo);
    });
    return () => unsub();
  }, [auth, router, redirectTo]);

  const createProfile = async (userId: string, email: string, displayName: string, photoURL: string) => {
    if (!db) return;
    const ref = doc(db, 'users', userId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { onlineStatus: 'online', lastActive: serverTimestamp() });
      return;
    }
    const idToken = await auth?.currentUser?.getIdToken();
    await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ username: displayName, email, photoURL }),
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (!email || !password) throw new Error('Fill in all fields');
      if (isSignUp && (!username || username.length < 2)) throw new Error('Username must be 2+ characters');
      if (isSignUp && password !== confirmPassword) throw new Error('Passwords do not match');
      if (!auth) throw new Error('Auth not initialized');

      const cred = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      if (isSignUp) await updateProfile(cred.user, { displayName: username });
      await finishSignIn(cred.user);
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found'
        : err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use' ? 'Email already in use'
        : err.code === 'auth/weak-password' ? 'Password must be 6+ characters'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts, try later'
        : err.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) { setError('Auth not initialized'); return; }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      if (popupErr.code === 'auth/popup-closed-by-user') return;
      if (popupErr.code === 'auth/popup-blocked') { setError('Popup blocked. Please allow popups for this site or try again.'); return; }
      console.warn('[Google] Popup failed, trying redirect:', popupErr.code);
      setError('Popup sign-in failed. Redirecting to Google...');
      signInWithRedirect(auth, provider);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (!email) throw new Error('Enter your email');
      if (!auth) throw new Error('Auth not initialized');
      await sendPasswordResetEmail(auth, email);
      setShowForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 p-8 rounded-2xl border border-border/60 bg-card shadow-lg">
          <div className="text-center space-y-2">
            <img src="/logo.svg" alt="" className="h-10 w-10 mx-auto" />
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted-foreground">Enter your email for a reset link.</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && <p className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive"><AlertCircle className="w-4 h-4 inline mr-1" />{error}</p>}
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-primary hover:text-primary/80">Back to Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 p-8 rounded-2xl border border-border/60 bg-card shadow-lg">
        <div className="text-center space-y-2">
          <a href="/"><img src="/logo.svg" alt="DevRann" className="h-12 w-12 mx-auto" /></a>
          <h1 className="text-2xl font-bold">{isSignUp ? 'Join DevRann' : 'Welcome Back'}</h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Create your account and enter the arena.' : 'Sign in to continue your journey.'}
          </p>
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading}
          className="w-full h-12 rounded-xl border border-border/70 bg-background font-bold text-sm hover:bg-muted/60 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground/60 font-semibold">or</span></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {error && <p className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive"><AlertCircle className="w-4 h-4 inline mr-1" />{error}</p>}

          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Username</label>
              <input type="text" placeholder="CoderName" value={username} onChange={e => setUsername(e.target.value)} maxLength={20} disabled={loading}
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              {!isSignUp && <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:text-primary/80">Forgot?</button>}
            </div>
            <input type="password" placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'} value={password} onChange={e => setPassword(e.target.value)} disabled={loading}
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
              <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading}
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-lg shadow-primary/20 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 inline animate-spin mr-2" />Processing...</> : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-primary font-semibold hover:text-primary/80">
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
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
