'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Trash2,
  Save,
  Loader2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const db = useFirestore();
  const auth = getAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [username, setUsername] = useState((profile as any)?.username || user?.displayName || '');
  const [email, setEmail] = useState((profile as any)?.email || user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !db) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: username });
      await updateDoc(doc(db, 'users', user.uid), { username, email, updatedAt: serverTimestamp() });
      toast({ title: 'Profile updated', description: 'Your profile has been saved successfully.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('mock_user') !== null;
    if (isDemo) {
      localStorage.removeItem('mock_user');
      window.dispatchEvent(new Event('mock-auth-change'));
    } else {
      await auth.signOut();
    }
    window.location.href = '/auth';
  };

  const initials = (user?.displayName || user?.email || '??')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            SETTINGS
          </h1>
          <p className="text-muted-foreground">Manage your profile, preferences, and account.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><Shield className="w-4 h-4" /> Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/30">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Profile Avatar</p>
                    <p className="text-xs text-muted-foreground">Managed through your Google account</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} className="bg-muted/50 border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50 border-border mt-1" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Theme</h3>
                  <p className="text-xs text-muted-foreground">Customize the look and feel of the arena.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <ThemeOption current={theme} value="dark" icon={<Moon className="w-8 h-8 text-primary" />} label="Dark" />
                  <ThemeOption current={theme} value="light" icon={<Sun className="w-8 h-8 text-amber-500" />} label="Light" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 space-y-6">
                <SettingRow
                  icon={notificationsEnabled ? <Bell className="w-4 h-4 text-primary" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
                  label="Push Notifications"
                  description="Receive in-app notifications for matches, friend requests, and events."
                  checked={notificationsEnabled}
                  onToggle={setNotificationsEnabled}
                />
                <SettingRow
                  icon={soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  label="Sound Effects"
                  description="Play sounds for incoming matches, messages, and alerts."
                  checked={soundEnabled}
                  onToggle={setSoundEnabled}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 space-y-6">
                <div className="p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Account Status</p>
                    <p className="text-xs text-muted-foreground">Your account is in good standing.</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Active</span>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-sm font-bold mb-1">Authentication Provider</p>
                  <p className="text-xs text-muted-foreground">{user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email / Password'}</p>
                </div>
                <Separator />
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" /> Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function ThemeOption({ current, value, icon, label }: { current: string; value: string; icon: React.ReactNode; label: string }) {
  const setTheme = () => {
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('codezarena-theme', value);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <button
      onClick={setTheme}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
        current === value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
      )}
    >
      <div className="w-full h-20 rounded-lg bg-background border border-border flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SettingRow({ icon, label, description, checked, onToggle }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <Label className="text-sm font-bold">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
