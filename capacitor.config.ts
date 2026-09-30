import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dribble.app",
  appName: "Dribble",
  webDir: "native/www/client",
  bundledWebRuntime: false,
  backgroundColor: "#120c08",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Dribble",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#120c08",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#120C08",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#120C08",
    },
  },
};

export default config;