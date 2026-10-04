// Entry point for launcher.html — the page the Alt+K overlay frames.
//
// Same styles and same components as the new tab, minus the wallpaper
// machinery and the boot script: this page is always small, always sitting on
// top of somebody else's site, and should open instantly.
import React from 'react'
import ReactDOM from 'react-dom/client'
import LauncherApp from './LauncherApp'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/500.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import './theme/material.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LauncherApp />
  </React.StrictMode>,
)
