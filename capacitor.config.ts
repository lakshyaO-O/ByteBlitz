import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codezarena.app',
  appName: 'CodezArena',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: [],
  },
  android: {
    buildOptions: {
      keystorePath: 'release-keystore.jks',
      keystoreAlias: 'codezarena',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#05070f',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#28f7a5',
    },
  },
};

export default config;
