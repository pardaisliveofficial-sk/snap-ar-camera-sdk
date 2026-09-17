import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and silence known benign WebAssembly / TensorFlow Lite info logs in browser console
if (typeof window !== "undefined") {
  const isIgnored = (arg: any) => {
    if (!arg) return false;
    const s = typeof arg === "string" ? arg : (arg && arg.message ? String(arg.message) : String(arg));
    return s.includes("XNNPACK delegate") ||
           s.includes("Created TensorFlow Lite") ||
           s.includes("TensorFlow Lite XNNPACK");
  };

  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = function (...args: any[]) {
    if (args.some(isIgnored)) return;
    origLog.apply(console, args);
  };

  console.info = function (...args: any[]) {
    if (args.some(isIgnored)) return;
    origInfo.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    if (args.some(isIgnored)) return;
    origWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    if (args.some(isIgnored)) return;
    origError.apply(console, args);
  };
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
