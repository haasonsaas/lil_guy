import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Render app immediately for fast initial load
createRoot(document.getElementById('root')!).render(<App />)

// Progressive loading strategy - defer non-critical services
const initializeServices = () => {
  // Stage 1: Critical UI rendering (already done above)

  // Stage 2: Service worker (after 500ms)
  setTimeout(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('Service worker registered successfully:', registration)
        })
        .catch((error) => {
          console.warn('Service worker registration failed:', error)
        })
    }
  }, 500)

  // Stage 3: Performance monitoring and analytics (after 3 seconds)
  const initAnalytics = () => {
    Promise.all([
      import('./utils/performance').then(({ initPerformanceMonitoring }) =>
        initPerformanceMonitoring()
      ),
      import('./utils/analytics').then(({ default: analytics }) =>
        analytics.init()
      ),
    ]).catch((error) => {
      console.warn('Analytics initialization failed:', error)
    })
  }

  // Wait for initial render to complete
  const startAnalytics = () => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(initAnalytics, { timeout: 3000 })
    } else {
      setTimeout(initAnalytics, 3000)
    }
  }

  // Start analytics after initial load
  if (document.readyState === 'complete') {
    setTimeout(startAnalytics, 2000)
  } else {
    window.addEventListener('load', () => setTimeout(startAnalytics, 2000))
  }
}

initializeServices()
