'use client';

import dynamic from 'next/dynamic';

const DynamicBackground = dynamic(() => import('@/components/DynamicBackground').then(m => ({ default: m.DynamicBackground })), { ssr: false });
const RoboticMascot = dynamic(() => import('@/components/RoboticMascot').then(m => ({ default: m.RoboticMascot })), { ssr: false });
const CelebrationOverlay = dynamic(() => import('@/components/gamification/CelebrationOverlay').then(m => ({ default: m.CelebrationOverlay })), { ssr: false });
const OfflineStatusBar = dynamic(() => import('@/components/offline/OfflineStatusBar').then(m => ({ default: m.OfflineStatusBar })), { ssr: false });

export function DynamicBackgroundWrapper() {
  return <DynamicBackground />;
}

export function RoboticMascotWrapper() {
  return <RoboticMascot />;
}

export function CelebrationOverlayWrapper() {
  return <CelebrationOverlay />;
}

export function OfflineStatusBarWrapper() {
  return <OfflineStatusBar />;
}
