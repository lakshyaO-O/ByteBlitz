'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  User, Palette, Bell, Shield, LogOut, Trash2, Save, Loader2, Moon, Sun, Volume2, VolumeX, Accessibility, Code2, CheckCircle2, XCircle,
} from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import { useAuth } from '@/firebase/provider';
import { updateDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTheme, THEME_KEY } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { validateUsername, normalizeUsername } from '@/lib/username';
import { useUsernameAvailability, useClaimUsername } from '@/hooks/use-username';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';
import { SecuritySettings } from '@/components/security/SecuritySettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { EditorTheme, CodingLanguage } from '@/app/lib/types';

export default function SettingsPage() {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [lastUsernameChange, setLastUsernameChange] = useState<number>(0);
  const { available, checking: checkingUsername, checkUsername } = useUsernameAvailability();
  const { claimUsername, loading: claimingUsername } = useClaimUsername();
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('vs-dark');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [preferredLang, setPreferredLang] = useState<CodingLanguage>('javascript');

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setUsername(p.username || user?.displayName || '');
      setEmail(p.email || user?.email || '');
    }
  }, [profile, user]);

  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed.length >= 3 && trimmed !== (profile as any)?.username) {
      checkUsername(trimmed);
    }
  }, [username, profile, checkUsername]);

  const handleSaveProfile = async () => {
    if (!user || !db) return;
    setUsernameError('');
    setUsernameSuccess('');

    const trimmed = normalizeUsername(username.trim());
    const validationError = validateUsername(trimmed);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    if (trimmed === (profile as any)?.username?.toLowerCase()) {
      toast({ title: 'No changes', description: 'Username is the same as before.' });
      return;
    }

    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
    if (lastUsernameChange > 0 && Date.now() - lastUsernameChange < cooldownPeriod) {
      const daysLeft = Math.ceil((cooldownPeriod - (Date.now() - lastUsernameChange)) / (24 * 60 * 60 * 1000));
      setUsernameError(`You can change your username again in ${daysLeft} day(s)`);
      return;
    }

    setSaving(true);
    try {
      const success = await claimUsername(user.uid, trimmed, (profile as any)?.username);
      if (!success) {
        setUsernameError('Username is already taken. Please choose another.');
        setSaving(false);
        return;
      }
      await updateProfile(user, { displayName: trimmed });
      await updateDoc(doc(db, 'users', user.uid), {
        username: trimmed, email, updatedAt: serverTimestamp(), lastUsernameChange: serverTimestamp(),
      });
      setLastUsernameChange(Date.now());
      setUsernameSuccess('Username updated successfully!');
      toast({ title: 'Profile updated', description: 'Your username has been changed.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (auth) await auth.signOut();
    window.location.href = '/';
  };

  const initials = (user?.displayName || user?.email || '??')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            SETTINGS
          </h1>
          <p className="text-muted-foreground">Manage your profile, preferences, and account.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="editor" className="gap-2"><Code2 className="w-4 h-4" /> Editor</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="accessibility" className="gap-2"><Accessibility className="w-4 h-4" /> Accessibility</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><LogOut className="w-4 h-4" /> Account</TabsTrigger>
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
                    <div className="relative mt-1">
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setUsernameError(''); setUsernameSuccess(''); }}
                        maxLength={20}
                        className={cn('bg-muted/50 border-border pr-10', usernameError && 'border-destructive', usernameSuccess && 'border-emerald-500')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : username.length >= 3 && username !== (profile as any)?.username ? (
                          available === true ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : available === false ? (
                            <XCircle className="w-4 h-4 text-destructive" />
                          ) : null
                        ) : null}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">3-20 chars, lowercase letters, numbers, _ and . only.</p>
                    {checkingUsername && <p className="text-[10px] text-muted-foreground mt-1">Checking availability...</p>}
                    {usernameError && <p className="text-[10px] text-destructive mt-1">{usernameError}</p>}
                    {usernameSuccess && <p className="text-[10px] text-emerald-400 mt-1">{usernameSuccess}</p>}
                    {available === true && username !== (profile as any)?.username && (
                      <p className="text-[10px] text-emerald-400 mt-1">Username available!</p>
                    )}
                    {available === false && (
                      <p className="text-[10px] text-destructive mt-1">Username already taken</p>
                    )}
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

          <TabsContent value="editor">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Editor Preferences</h3>
                  <p className="text-xs text-muted-foreground">Customize your coding experience.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest">Editor Theme</Label>
                    <Select value={editorTheme} onValueChange={(v: EditorTheme) => setEditorTheme(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vs-dark">Dark (Default)</SelectItem>
                        <SelectItem value="vs-light">Light</SelectItem>
                        <SelectItem value="monokai">Monokai</SelectItem>
                        <SelectItem value="dracula">Dracula</SelectItem>
                        <SelectItem value="nord">Nord</SelectItem>
                        <SelectItem value="hc-black">High Contrast Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest">Font Size: {editorFontSize}px</Label>
                    <Slider value={[editorFontSize]} onValueChange={([v]) => setEditorFontSize(v)} min={10} max={24} step={1} className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest">Preferred Language</Label>
                    <Select value={preferredLang} onValueChange={(v: CodingLanguage) => setPreferredLang(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

          <TabsContent value="accessibility">
            <AccessibilitySettings />
          </TabsContent>
          <TabsContent value="security">
            <SecuritySettings />
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
    localStorage.setItem(THEME_KEY, value);
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
