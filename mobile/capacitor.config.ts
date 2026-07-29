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
      launchAutoHide: false,
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
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    backgroundColor: '#0A0A0A',
    allowMixedContent: false
  }
};

export default config;
