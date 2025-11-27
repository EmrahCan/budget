import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Unregister service workers in dev to avoid cache / reload loops
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => {});
}

// Clear redirect guard when on auth pages so future logins can proceed normally
if (window.location.pathname === '/login' || window.location.pathname === '/register') {
  try { sessionStorage.removeItem('app_redirect_to_login'); } catch (e) {}
}