import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { RoboticMascot } from '@/components/RoboticMascot';
import { DynamicBackground } from '@/components/DynamicBackground';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'CodezArena | Competitive Coding Arena',
  description: 'The ultimate esports-inspired competitive coding platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary">
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <DynamicBackground />
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
          <RoboticMascot />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
