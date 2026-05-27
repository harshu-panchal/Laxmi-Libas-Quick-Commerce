import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/anti-flash.css'

// Set background immediately to prevent flash
if (document.documentElement) {
  document.documentElement.style.backgroundColor = '#ffffff';
}

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.backgroundColor = '#ffffff';
}

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Verify live deploy: console should show order-sound-v5
console.info('[LaxMart] frontend build:', __APP_BUILD_TAG__);

// After deploy: refresh service worker so live users get new JS (not stale cached app)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.update().catch(() => {})
    })
  })
}

