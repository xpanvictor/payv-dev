import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import circuit tests for console access in development
if (import.meta.env.DEV) {
  import('./utils/circuitTest.ts').then(() => {
    console.log('🔧 Circuit tests loaded. Run window.runCircuitTests() to test.');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

