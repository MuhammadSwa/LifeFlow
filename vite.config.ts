import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from '@tailwindcss/vite'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;


const env = loadEnv('development', process.cwd(), ''); // Load all env variables
// console.log('VITE_APP_TITLE from .env:', env.VITE_PUBLIC_ZERO_SERVER);

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid(), tailwindcss(),],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    // allowedHosts: [env.VITE_PUBLIC_ZERO_SERVER.slice(8)],
    https: {
      key: `${process.env.HOME}/localhost+2-key.pem`,
      cert: `${process.env.HOME}/localhost+2.pem`
    },
    port: 1420,
    host: '0.0.0.0', // This makes the server accessible on your local network
    strictPort: true,
    //host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
