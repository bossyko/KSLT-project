import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kg.kslt.app',
  appName: 'KSLT Tennis',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0A'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    backgroundColor: '#0A0A0A',
    allowMixedContent: true
  }
};

export default config;
