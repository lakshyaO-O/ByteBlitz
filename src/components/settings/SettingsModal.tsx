'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Palette,
  Bell,
  Shield,
  Settings2,
  LogOut,
  Trash2,
  Save,
  Loader2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'account';

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const db = useFirestore();
  const auth = getAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (open && profile) {
      setUsername((profile as any)?.username || user?.displayName || '');
      setEmail((profile as any)?.email || user?.email || '');
    }
  }, [open, profile, user]);

  const handleSaveProfile = async () => {
    if (!user || !db) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: username });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username,
        email,
        updatedAt: serverTimestamp(),
      });
      window.dispatchEvent(new Event('mock-auth-change'));
      window.dispatchEvent(new Event('mock-db-change'));
      toast({ title: 'Profile updated', description: 'Your profile has been saved successfully.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: err.message || 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('mock_user') !== null;
      if (isDemoMode) {
        localStorage.removeItem('mock_user');
        window.dispatchEvent(new Event('mock-auth-change'));
        toast({ title: 'Logged out', description: 'See you next time!' });
        onOpenChange(false);
        setTimeout(() => { window.location.href = '/auth'; }, 300);
        return;
      }
      await auth.signOut();
      toast({ title: 'Logged out', description: 'See you next time!' });
      onOpenChange(false);
      setTimeout(() => { window.location.href = '/auth'; }, 300);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Logout failed', description: err.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to delete your account? This action is irreversible and all your data will be lost.');
    if (!confirmed) return;
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    setDeleting(true);
    try {
      if (auth.currentUser?.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      if (db) {
        await updateDoc(doc(db, 'users', user.uid), { deletedAt: serverTimestamp() });
      }
      await deleteUser(auth.currentUser!);
      toast({ title: 'Account deleted', description: 'Your account has been permanently removed.' });
      onOpenChange(false);
      setTimeout(() => { window.location.href = '/auth'; }, 300);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Deletion failed', description: err.message || 'Could not delete account.' });
    } finally {
      setDeleting(false);
    }
  };

  const copyUID = async () => {
    if (user?.uid) {
      await navigator.clipboard.writeText(user.uid);
      toast({ title: 'Copied', description: 'User ID copied to clipboard.' });
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'appearance' as SettingsTab, label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'account' as SettingsTab, label: 'Account', icon: <Shield className="w-4 h-4" /> },
  ];

  const initials = (username || user?.displayName || user?.email || '??')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Settings</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">Manage your profile, preferences, and account.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-border bg-muted/20">
            <nav className="flex sm:flex-col p-2 gap-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full', activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <ScrollArea className="flex-1 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Public Profile</h3>
                  <p className="text-xs text-muted-foreground">This information will be visible to other players.</p>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/30">
                    <AvatarImage src={user?.photoURL || ''} alt={username} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Profile Avatar</p>
                    <p className="text-xs text-muted-foreground">{user?.photoURL ? 'Avatar loaded from your account' : 'Default avatar based on your name'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-username" className="text-xs font-bold uppercase tracking-widest">Username</Label>
                    <Input id="settings-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your display name" maxLength={20} className="bg-muted/50 border-border" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-email" className="text-xs font-bold uppercase tracking-widest">Email</Label>
                    <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-muted/50 border-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest">User ID</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-md text-xs font-mono text-muted-foreground break-all">{user?.uid || '—'}</code>
                      <Button variant="outline" size="icon" onClick={copyUID} className="shrink-0"><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Theme</h3>
                  <p className="text-xs text-muted-foreground">Customize the look and feel of the arena.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { if (theme !== 'dark') { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); localStorage.setItem('codezarena-theme', 'dark'); window.dispatchEvent(new Event('storage')); } }} className={cn('flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all', theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30')}>
                    <div className="w-full h-20 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center"><Moon className="w-8 h-8 text-primary" /></div>
                    <span className="text-sm font-bold uppercase tracking-wider">Dark</span>
                  </button>
                  <button onClick={() => { if (theme !== 'light') { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); localStorage.setItem('codezarena-theme', 'light'); window.dispatchEvent(new Event('storage')); } }} className={cn('flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all', theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30')}>
                    <div className="w-full h-20 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Sun className="w-8 h-8 text-amber-500" /></div>
                    <span className="text-sm font-bold uppercase tracking-wider">Light</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Notification Preferences</h3>
                  <p className="text-xs text-muted-foreground">Choose what notifications you want to receive.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {notificationsEnabled ? <Bell className="w-4 h-4 text-primary" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <Label className="text-sm font-bold">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive in-app notifications for matches, friend requests, and events.</p>
                      </div>
                    </div>
                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <Label className="text-sm font-bold">Sound Effects</Label>
                        <p className="text-xs text-muted-foreground">Play sounds for incoming matches, messages, and alerts.</p>
                      </div>
                    </div>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Management</h3>
                  <p className="text-xs text-muted-foreground">Manage your account security and data.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Account Status</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Your account is in good standing.</p>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Authentication Provider</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email / Password'}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}><LogOut className="w-4 h-4" />Log Out</Button>
                    <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {deleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
