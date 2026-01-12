
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro ao renderizar:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Erro Crítico: ${error}</div>`;
  }
}
