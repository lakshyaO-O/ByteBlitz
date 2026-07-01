'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const OfflineStatusBar = dynamic(() => import('@/components/offline/OfflineStatusBar').then((mod) => mod.OfflineStatusBar), {
  ssr: false,
  loading: () => null,
});

const AndroidBackButtonHandler = dynamic(() => import('@/components/mobile/AndroidBackButtonHandler').then((mod) => mod.AndroidBackButtonHandler), {
  ssr: false,
  loading: () => null,
});

const FirebaseErrorListener = dynamic(() => import('@/components/FirebaseErrorListener').then((mod) => mod.FirebaseErrorListener), {
  ssr: false,
  loading: () => null,
});

const DynamicBackground = dynamic(() => import('@/components/DynamicBackground').then((mod) => mod.DynamicBackground), {
  ssr: false,
  loading: () => null,
});

const RoboticMascot = dynamic(() => import('@/components/RoboticMascot').then((mod) => mod.RoboticMascot), {
  ssr: false,
  loading: () => null,
});

const CelebrationOverlay = dynamic(() => import('@/components/gamification/CelebrationOverlay').then((mod) => mod.CelebrationOverlay), {
  ssr: false,
  loading: () => null,
});

const Toaster = dynamic(() => import('@/components/ui/toaster').then((mod) => mod.Toaster), {
  ssr: false,
  loading: () => null,
});

export function AppStartupDecorations() {
  return (
    <>
      <Suspense fallback={null}>
        <OfflineStatusBar />
      </Suspense>
      <Suspense fallback={null}>
        <AndroidBackButtonHandler />
      </Suspense>
      <Suspense fallback={null}>
        <FirebaseErrorListener />
      </Suspense>
      <Suspense fallback={null}>
        <DynamicBackground />
      </Suspense>
      <Suspense fallback={null}>
        <RoboticMascot />
      </Suspense>
      <Suspense fallback={null}>
        <CelebrationOverlay />
      </Suspense>
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </>
  );
}
