import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (id.includes('framer-motion')) {
              return 'motion-vendor'
            }

            if (
              id.includes('@remix-run') ||
              id.includes('react-router') ||
              id.includes('react-helmet-async')
            ) {
              return 'router-vendor'
            }

            if (
              id.includes('/react/') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }

            return undefined
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      restoreMocks: true,
      clearMocks: true,
      unstubEnvs: true,
      include: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'tests/**',
        'backend/**',
        'node_modules/**',
      ],
    },
  }
})
