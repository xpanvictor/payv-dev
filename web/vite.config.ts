import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    // Exclude WASM and heavy dependencies from pre-bundling
    exclude: ['@noir-lang/noir_js', '@aztec/bb.js', '@zkpassport/poseidon2'],
  },
  build: {
    target: 'esnext',
  },
  server: {
    proxy: {
      '/rpc': {
        target: 'https://rpc.sepolia.mantle.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc/, ''),
        secure: true,
      },
    },
    headers: {
      // Required for SharedArrayBuffer (needed by WASM)
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  // Ensure WASM files are properly served
  assetsInclude: ['**/*.wasm'],
})
