import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Detect PWA / standalone mode (installed app) and add body class.
// Also honour ?pwa=1 (manifest start_url) so the chrome is hidden even
// when browser-opened for quick preview.
(function detectPwa() {
  try {
    const params = new URLSearchParams(window.location.search);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      params.get('pwa') === '1';
    if (isStandalone) {
      document.body.classList.add('pwa-mode');
    }
  } catch (e) {}
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: enable installable app + offline shell (production builds only)
serviceWorkerRegistration.register();
