import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    "process.env": process.env,
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/components/ui", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@models": fileURLToPath(new URL("./src/models", import.meta.url)),
      "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@constant": fileURLToPath(new URL("./src/constant", import.meta.url)),
      "@context": fileURLToPath(new URL("./src/context", import.meta.url)),
      "@routes": fileURLToPath(new URL("./src/routers", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      // State management (sẽ thay redux bằng zustand)
      // "@redux": fileURLToPath(new URL("./src/redux", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@user": fileURLToPath(new URL("./src/pages/User", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
    },
    
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

  server: {
    port: 3000,
    open: true, 
    host: true,
  },
  build: {
    sourcemap: true, 
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor chunks cho performance
          vendor: ['react', 'react-dom'],
          ui: ['class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },


  envPrefix: ['VITE_', 'REACT_APP_'],
})