import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
