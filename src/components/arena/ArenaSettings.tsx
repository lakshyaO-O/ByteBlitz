'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useArenaSettings } from '@/hooks/use-arena-settings';
import type { ArenaSettings, CodingLanguage, Difficulty, TimeControlPreset, Region } from '@/types';
import {
  Settings,
  Code2,
  Globe,
  Timer,
  Gamepad2,
  Eye,
  Bell,
  RotateCcw,
  Save,
} from 'lucide-react';

interface ArenaSettingsProps {
  className?: string;
}

const CODING_LANGUAGES: { value: CodingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'arrays', label: 'Arrays' },
  { value: 'strings', label: 'Strings' },
  { value: 'trees', label: 'Trees' },
  { value: 'graphs', label: 'Graphs' },
  { value: 'dp', label: 'Dynamic Programming' },
  { value: 'sorting', label: 'Sorting' },
];

const TIME_CONTROLS: { value: TimeControlPreset; label: string }[] = [
  { value: '1+0', label: 'Bullet (1+0)' },
  { value: '2+1', label: 'Blitz (2+1)' },
  { value: '3+0', label: 'Blitz (3+0)' },
  { value: '5+0', label: 'Rapid (5+0)' },
  { value: '10+0', label: 'Classic (10+0)' },
];

const REGIONS: { value: Region; label: string }[] = [
  { value: 'auto', label: 'Auto (Best Latency)' },
  { value: 'us-east', label: 'US East' },
  { value: 'us-west', label: 'US West' },
  { value: 'eu-west', label: 'EU West' },
  { value: 'eu-central', label: 'EU Central' },
  { value: 'asia-south', label: 'Asia South' },
  { value: 'asia-east', label: 'Asia East' },
  { value: 'asia-southeast', label: 'Asia Southeast' },
  { value: 'oceania', label: 'Oceania' },
];

const EDITOR_THEMES: { value: ArenaSettings['editorTheme']; label: string }[] = [
  { value: 'vs-dark', label: 'Dark (Default)' },
  { value: 'vs-light', label: 'Light' },
  { value: 'hc-black', label: 'High Contrast' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'nord', label: 'Nord' },
];

function SettingRow({ label, description, control, icon }: { label: string; description?: string; control: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        <div className="min-w-0">
          <Label className="text-sm font-medium truncate">{label}</Label>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-9 w-28 rounded-md shrink-0" />
    </div>
  );
}

export function ArenaSettings({ className }: ArenaSettingsProps) {
  const { settings, loading, error, updateSetting, updateSettings, resetSettings } = useArenaSettings();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Settings className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm font-bold text-destructive">Failed to load settings</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-card/50 border-border', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-lg font-headline font-bold">Arena Settings</span>
          <Badge variant="outline" className="ml-auto text-xs">Battle Config</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="matchmaking" className="w-full">
          <div className="px-6">
            <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0">
              {[
                { value: 'matchmaking', label: 'Matchmaking', icon: <Gamepad2 className="h-3.5 w-3.5" /> },
                { value: 'editor', label: 'Editor', icon: <Code2 className="h-3.5 w-3.5" /> },
                { value: 'appearance', label: 'Appearance', icon: <Eye className="h-3.5 w-3.5" /> },
                { value: 'privacy', label: 'Privacy', icon: <Globe className="h-3.5 w-3.5" /> },
                { value: 'notifications', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Separator className="my-4" />
          <ScrollArea className="h-[480px] px-6 pb-6">
            {loading ? (
              <div className="space-y-1">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : (
              <>
                <TabsContent value="matchmaking" className="mt-0 space-y-1">
                  <div className="space-y-1">
                    <SettingRow
                      label="Preferred Language"
                      description="Default coding language for battles"
                      icon={<Code2 className="h-4 w-4" />}
                      control={
                        <Select
                          value={settings.preferredLanguage}
                          onValueChange={(v) => updateSetting('preferredLanguage', v as CodingLanguage)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CODING_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <SettingRow
                      label="Rated Battle"
                      description="Matches affect your ELO rating"
                      control={
                        <Switch
                          checked={settings.rated}
                          onCheckedChange={(v) => updateSetting('rated', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Difficulty"
                      description="Problem difficulty preference"
                      control={
                        <Select
                          value={settings.difficulty}
                          onValueChange={(v) => updateSetting('difficulty', v as Difficulty)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <SettingRow
                      label="Category"
                      description="Problem topic filter"
                      control={
                        <Select
                          value={settings.category}
                          onValueChange={(v) => updateSetting('category', v)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <SettingRow
                      label="Time Control"
                      description="Match duration and increment"
                      icon={<Timer className="h-4 w-4" />}
                      control={
                        <Select
                          value={settings.timeControl}
                          onValueChange={(v) => updateSetting('timeControl', v as TimeControlPreset)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_CONTROLS.map((tc) => (
                              <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <SettingRow
                      label="Region"
                      description="Server region preference"
                      icon={<Globe className="h-4 w-4" />}
                      control={
                        <Select
                          value={settings.region}
                          onValueChange={(v) => updateSetting('region', v as Region)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <div className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">ELO Range</Label>
                            <p className="text-xs text-muted-foreground">Matchmaking rating spread (±{settings.eloRange})</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold w-12 text-right tabular-nums">{settings.eloRange}</span>
                      </div>
                      <Slider
                        value={[settings.eloRange]}
                        onValueChange={([v]) => updateSetting('eloRange', v)}
                        min={50}
                        max={500}
                        step={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>±50</span>
                        <span>±500</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="editor" className="mt-0 space-y-1">
                  <div className="space-y-1">
                    <SettingRow
                      label="Editor Theme"
                      description="Code editor color scheme"
                      icon={<Code2 className="h-4 w-4" />}
                      control={
                        <Select
                          value={settings.editorTheme}
                          onValueChange={(v) => updateSetting('editorTheme', v as ArenaSettings['editorTheme'])}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EDITOR_THEMES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                    <div className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">Font Size</Label>
                            <p className="text-xs text-muted-foreground">Editor code font size</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold w-12 text-right tabular-nums">{settings.editorFontSize}px</span>
                      </div>
                      <Slider
                        value={[settings.editorFontSize]}
                        onValueChange={([v]) => updateSetting('editorFontSize', v)}
                        min={10}
                        max={24}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>10px</span>
                        <span>24px</span>
                      </div>
                    </div>
                    <SettingRow
                      label="Minimap"
                      description="Show code minimap"
                      control={
                        <Switch
                          checked={settings.editorMinimap}
                          onCheckedChange={(v) => updateSetting('editorMinimap', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Word Wrap"
                      description="Wrap long lines in editor"
                      control={
                        <Switch
                          checked={settings.editorWordWrap}
                          onCheckedChange={(v) => updateSetting('editorWordWrap', v)}
                        />
                      }
                    />
                    <div className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Code2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">Tab Size</Label>
                            <p className="text-xs text-muted-foreground">Indentation width</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold w-12 text-right tabular-nums">{settings.editorTabSize}</span>
                      </div>
                      <Slider
                        value={[settings.editorTabSize]}
                        onValueChange={([v]) => updateSetting('editorTabSize', v)}
                        min={2}
                        max={8}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>2</span>
                        <span>8</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="mt-0 space-y-1">
                  <div className="space-y-1">
                    <SettingRow
                      label="Sound Effects"
                      description="Play sound effects during battles"
                      control={
                        <Switch
                          checked={settings.soundEnabled}
                          onCheckedChange={(v) => updateSetting('soundEnabled', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Music"
                      description="Background music in arena"
                      control={
                        <Switch
                          checked={settings.musicEnabled}
                          onCheckedChange={(v) => updateSetting('musicEnabled', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Show Opponent Progress"
                      description="Display opponent's test case progress"
                      control={
                        <Switch
                          checked={settings.showOpponentProgress}
                          onCheckedChange={(v) => updateSetting('showOpponentProgress', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Auto-Accept Rematch"
                      description="Automatically accept rematch requests"
                      control={
                        <Switch
                          checked={settings.autoAcceptRematch}
                          onCheckedChange={(v) => updateSetting('autoAcceptRematch', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Confirm Before Submit"
                      description="Show confirmation dialog on submit"
                      control={
                        <Switch
                          checked={settings.confirmBeforeSubmit}
                          onCheckedChange={(v) => updateSetting('confirmBeforeSubmit', v)}
                        />
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="privacy" className="mt-0 space-y-1">
                  <div className="space-y-1">
                    <SettingRow
                      label="Show Activity"
                      description="Display your activity status to others"
                      icon={<Globe className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.privacyShowActivity}
                          onCheckedChange={(v) => updateSetting('privacyShowActivity', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Show Rating"
                      description="Display your ELO rating publicly"
                      icon={<Globe className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.privacyShowRating}
                          onCheckedChange={(v) => updateSetting('privacyShowRating', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Show Stats"
                      description="Display your match statistics publicly"
                      icon={<Globe className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.privacyShowStats}
                          onCheckedChange={(v) => updateSetting('privacyShowStats', v)}
                        />
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-0 space-y-1">
                  <div className="space-y-1">
                    <SettingRow
                      label="Match Found"
                      description="Notify when an opponent is found"
                      icon={<Bell className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.notificationsMatchFound}
                          onCheckedChange={(v) => updateSetting('notificationsMatchFound', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Battle Start"
                      description="Notify when a battle begins"
                      icon={<Bell className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.notificationsBattleStart}
                          onCheckedChange={(v) => updateSetting('notificationsBattleStart', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Round End"
                      description="Notify when a round finishes"
                      icon={<Bell className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.notificationsRoundEnd}
                          onCheckedChange={(v) => updateSetting('notificationsRoundEnd', v)}
                        />
                      }
                    />
                    <SettingRow
                      label="Friend Invite"
                      description="Notify when you receive a friend invite"
                      icon={<Bell className="h-4 w-4" />}
                      control={
                        <Switch
                          checked={settings.notificationsFriendInvite}
                          onCheckedChange={(v) => updateSetting('notificationsFriendInvite', v)}
                        />
                      }
                    />
                  </div>
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>

        {!loading && (
          <div className="flex items-center justify-between gap-4 border-t border-border p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
