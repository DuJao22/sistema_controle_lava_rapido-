
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  console.error("Não foi possível encontrar o elemento root no DOM.");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro ao renderizar a aplicação:", error);
    container.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Erro Crítico</h2>
      <p>Ocorreu um erro ao carregar o sistema. Verifique o console do desenvolvedor.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>`;
  }
}
