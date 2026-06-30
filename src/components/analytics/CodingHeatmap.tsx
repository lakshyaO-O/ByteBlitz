'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CodingHeatmapProps {
  data?: Record<string, number>;
  year?: number;
}

export function CodingHeatmap({ data = {}, year = new Date().getFullYear() }: CodingHeatmapProps) {
  const weeks = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const days: Array<{ date: Date; count: number }> = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: new Date(d),
        count: data[dateStr] || 0,
      });
    }
    return days;
  }, [data, year]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/20';
    if (count <= 2) return 'bg-emerald-900/40';
    if (count <= 5) return 'bg-emerald-700/60';
    if (count <= 10) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
  };

  const totalCodingDays = useMemo(() => weeks.filter(d => d.count > 0).length, [weeks]);
  const maxCount = useMemo(() => Math.max(...weeks.map(d => d.count), 1), [weeks]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].count > 0) streak++;
      else break;
    }
    return streak;
  }, [weeks]);

  const DAY_NAMES = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-headline font-bold">Coding Activity</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{totalCodingDays} days</span>
            <span>{currentStreak} day streak</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pr-2 pt-2">
            {DAY_NAMES.map((day, i) => (
              <div key={i} className="h-3 text-[8px] text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-[3px] min-w-[750px]">
              {Array.from({ length: Math.ceil(weeks.length / 7) }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const dayIndex = weekIdx * 7 + dayIdx;
                    if (dayIndex >= weeks.length) return <div key={dayIdx} className="h-3 w-3" />;
                    const day = weeks[dayIndex];
                    return (
                      <TooltipProvider key={dayIdx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'h-[11px] w-[11px] rounded-sm cursor-pointer transition-colors',
                                getIntensityClass(day.count)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-bold">{day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            <p>{day.count} coding session{day.count !== 1 ? 's' : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 3, 6, 10].map((level) => (
            <div key={level} className={cn('h-3 w-3 rounded-sm', getIntensityClass(level))} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
