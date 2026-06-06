import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quad.campus",
  appName: "Quad",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
