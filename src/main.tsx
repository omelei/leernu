import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { brand } from './config/brand';
import { applyFontSetting, getSetting, SETTING_FONT } from './store/profile';
import './index.css';

document.title = brand.name;

// Applied before the first paint, so a child who turned the reading font on does
// not see a flash of the one they turned off.
void getSetting(SETTING_FONT).then((font) => {
  if (font) applyFontSetting(font);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
