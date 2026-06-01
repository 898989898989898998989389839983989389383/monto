import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

window.setTimeout(() => {
  document.getElementById('app-splash')?.classList.add('app-splash--hidden');
}, 450);

const isNativeCapacitor = Boolean((window as Window & {
  Capacitor?: { isNativePlatform?: () => boolean };
}).Capacitor?.isNativePlatform?.());

if ('serviceWorker' in navigator && isNativeCapacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});

    if ('caches' in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith('monto-app-')).map((key) => caches.delete(key))))
        .catch(() => {});
    }
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
