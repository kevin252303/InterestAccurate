import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global Fetch Interceptor: Automatically injects current tenant x-client-id into all API requests
const originalFetch = window.fetch;
window.fetch = async function (input, init = {}) {
  const options = { ...init };
  const headers = new Headers(options.headers || {});

  try {
    const rawSession = localStorage.getItem('ia_session');
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session?.token && !headers.has('authorization')) {
        headers.set('authorization', `Bearer ${session.token}`);
      }
      if (session?.clientId && !headers.has('x-client-id')) {
        headers.set('x-client-id', String(session.clientId));
      }
      if (session?.role === 'SUPER_ADMIN' && session?.masterPin && !headers.has('x-master-pin')) {
        headers.set('x-master-pin', session.masterPin);
      }
    }
  } catch (e) {
    console.error('Fetch interceptor session error:', e);
  }

  options.headers = headers;
  return originalFetch(input, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
