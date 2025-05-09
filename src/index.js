import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "./socket";
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n';
import { registerServiceWorker } from './serviceWorkerRegistration';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Call service worker registration here
registerServiceWorker();