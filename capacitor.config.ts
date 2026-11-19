// Capacitor Android/iOS Configuration for ROG-TECH Command Center APK
const config = {
  appId: 'com.rogtech.commandcenter',
  appName: 'ROG-TECH',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#070b12',
      showSpinner: true,
      spinnerColor: '#22d3ee'
    }
  }
};

export default config;
