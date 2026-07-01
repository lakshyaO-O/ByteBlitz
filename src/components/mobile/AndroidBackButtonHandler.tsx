'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

const EXIT_PATHS = new Set(['/', '/arena', '/dashboard', '/learn', '/practice', '/problems', '/leaderboard']);

export function AndroidBackButtonHandler() {
  const pathname = usePathname();
  const pathHistory = useRef<string[]>([]);

  useEffect(() => {
    pathHistory.current.push(pathname);
    if (pathHistory.current.length > 20) {
      pathHistory.current.shift();
    }
  }, [pathname]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    async function setup() {
      try {
        const mod = await import('@capacitor/app');
        const App = mod.App;

        const handler = await App.addListener('backButton', () => {
          const history = pathHistory.current;
          if (history.length <= 1 || EXIT_PATHS.has(pathname)) {
            App.minimizeApp();
          } else {
            window.history.back();
          }
        });

        unlisten = () => { handler.remove(); };
      } catch {
      }
    }

    setup();
    return () => { unlisten?.(); };
  }, [pathname]);

  return null;
}
