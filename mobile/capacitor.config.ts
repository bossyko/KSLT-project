import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kslt.app',
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
  },
  /* ОТДЕЛЬНЫЙ БЛОК, А НЕ ОДИН НА ДВОИХ: у платформ разные умолчания, и
     общий блок ведёт к тому, что правка под одну молча меняет другую.
     `limitsNavigationsToAppBoundDomains` держит переходы внутри
     приложения — без него веб-слой на iOS уводит человека в Safari
     посреди входа, и обратно он не возвращается. */
  ios: {
    backgroundColor: '#0A0A0A',
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
