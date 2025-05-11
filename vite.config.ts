import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte()
  ],
  server: {
    host: true,
    allowedHosts: [
        'localhost',
      'talented-unified-walleye.ngrok-free.app'
    ],
  },
})
