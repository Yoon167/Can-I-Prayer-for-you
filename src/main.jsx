import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app'; // deep-link event source
import './index.css';
import App from './App.jsx';

// 🔗 Import your verification handler from services/authService.js
import { completePrayerAppEmailConfirmationFromUrl } from './services/authService.js';

// Register PWA SW on the web only (keep your original behavior)
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  registerSW({ immediate: false });
}

/**
 * Deep link handling
 * - appUrlOpen: when the app is already running or resumed by a link (Android/iOS)
 * - cold start: when the app (or web) is launched by a link
 */

// 1) Handle links when app is running / resumed (Capacitor native)
CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
  try {
    const res = await completePrayerAppEmailConfirmationFromUrl(url);
    if (res?.handled) {
      if (res.error) {
        console.warn('[Email Verify]', res.error);
      } else if (res.message) {
        console.info('[Email Verify]', res.message);
      } else {
        console.info('[Email Verify] handled');
      }
    }
  } catch (e) {
    console.error('[appUrlOpen]', e);
  }
});

// 2) Handle cold start (web OR native when app is launched by tapping the link)
(async () => {
  try {
    const res = await completePrayerAppEmailConfirmationFromUrl();
    if (res?.handled) {
      if (res.error) {
        console.warn('[Email Verify]', res.error);
      } else if (res.message) {
        console.info('[Email Verify]', res.message);
      } else {
        console.info('[Email Verify] handled');
      }
    }
  } catch (e) {
    console.error('[cold start handling]', e);
  }
})();

// React render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
