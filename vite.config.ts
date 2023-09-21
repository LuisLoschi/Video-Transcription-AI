import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //Coreeção da integração vite com ffmpeg
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  //=====================
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})