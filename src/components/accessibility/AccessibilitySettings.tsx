'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { saveUserPreference, getUserPreference } from '@/hooks/use-editor-persistence';
import { cn } from '@/lib/utils';
import { Eye, Type, Monitor, Accessibility, Contrast } from 'lucide-react';

export function AccessibilitySettings() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.classList.toggle('high-contrast', highContrast);
    saveUserPreference('accessibility', { fontSize, highContrast, reducedMotion });
  }, [fontSize, highContrast, reducedMotion, loaded]);

  const loadPreferences = async () => {
    const prefs = await getUserPreference('accessibility');
    if (prefs) {
      setFontSize(prefs.fontSize || 16);
      setHighContrast(prefs.highContrast || false);
      setReducedMotion(prefs.reducedMotion || false);
    }
    setLoaded(true);
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
          <Accessibility className="w-5 h-5 text-primary" />
          Accessibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Font Size</Label>
                <p className="text-xs text-muted-foreground">Adjust text size across the app</p>
              </div>
            </div>
            <span className="text-sm font-bold w-12 text-right">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={12}
            max={24}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Contrast className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">High Contrast Mode</Label>
              <p className="text-xs text-muted-foreground">Increase contrast for better readability</p>
            </div>
          </div>
          <Switch checked={highContrast} onCheckedChange={setHighContrast} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Reduced Motion</Label>
              <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
            </div>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>
      </CardContent>
    </Card>
  );
}

export function useAccessibility() {
  const [prefs, setPrefs] = useState({ fontSize: 16, highContrast: false, reducedMotion: false });

  useEffect(() => {
    getUserPreference('accessibility').then(p => {
      if (p) {
        setPrefs(p);
        if (p.highContrast) document.documentElement.classList.add('high-contrast');
      }
    });
  }, []);

  const toggleHighContrast = () => {
    setPrefs(prev => {
      const next = { ...prev, highContrast: !prev.highContrast };
      document.documentElement.classList.toggle('high-contrast', next.highContrast);
      saveUserPreference('accessibility', next);
      return next;
    });
  };

  return { ...prefs, toggleHighContrast };
}
