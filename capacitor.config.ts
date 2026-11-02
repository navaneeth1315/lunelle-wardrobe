import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The app is server-rendered (TanStack Start), so the native shell loads the
 * hosted published app instead of bundling static files. Regenerate the
 * native project with `bun run cap:add:android`, then `bun run cap:sync`.
 */
const config: CapacitorConfig = {
  appId: "com.lunelle.app",
  appName: "Lunelle",
  webDir: "dist",
  android: {
    backgroundColor: "#FAF9F6",
    allowMixedContent: false,
  },
  server: {
    // Hosted app served in the native WebView; update if the primary domain changes.
    url: "https://lunelle-wardrobe.lovable.app",
    androidScheme: "https",
  },
};

export default config;
