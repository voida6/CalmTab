import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Self-hosted Nunito (bundled into dist by Vite — no network/Google Fonts call).
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/500.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import './theme/material.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
