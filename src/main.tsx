import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { brand } from './config/brand';
import './index.css';

document.title = brand.name;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
