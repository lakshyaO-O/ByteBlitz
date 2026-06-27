import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.byteblitz.app',
  appName: 'ByteBlitz',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For production builds, use your hosting URL:
    // url: 'https://your-app.web.app',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#050816',
      showSpinner: false,
    },
  },
};

export default config;
