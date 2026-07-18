'use client';

import { useState, useEffect } from 'react';

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  if (!date) return '';
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const [display, setDisplay] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDisplay(getRelativeTime(date));
    const interval = setInterval(() => {
      setDisplay(getRelativeTime(date));
    }, 30000);
    return () => clearInterval(interval);
  }, [date]);

  if (!isClient) return <span className={className}>&nbsp;</span>;

  return (
    <time className={className} dateTime={date} title={new Date(date).toLocaleString()}>
      {display}
    </time>
  );
}
