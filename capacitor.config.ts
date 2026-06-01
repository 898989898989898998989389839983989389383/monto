/// <reference types="@capacitor/local-notifications" />
/// <reference types="@capacitor/push-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monto.app',
  appName: 'Monto',
  webDir: 'dist',
  server: {
    url: 'https://monto.vercel.app',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#FFFFFF',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_rbs',
      iconColor: '#0047AB',
      sound: 'rbs_wow_tone.wav'
    }
  }
};

export default config;
