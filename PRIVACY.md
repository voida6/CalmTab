# CalmTab Privacy Policy

CalmTab does not collect, transmit, sell, or share any personal data. There is no account, no analytics, and no tracking of any kind.

Everything you configure — settings, tasks, habits, notes, wallpaper — is stored locally in your browser (`chrome.storage` and IndexedDB). If your browser has profile sync enabled, small preferences (settings, quick links, widget order) sync through your browser vendor's built-in extension sync; CalmTab itself never sees them.

Network requests the extension makes, and what they contain:

- **Open-Meteo** (`api.open-meteo.com`, `geocoding-api.open-meteo.com`) — the city name you typed, or your coordinates if you explicitly choose "My location", to fetch the weather. Location access is only requested if you select that option.
- **CoinGecko** (`api.coingecko.com`) — the coin ids you configured, if the crypto ticker widget is enabled.
- **Favicon fetches** — if you choose full-color favicons, your browser loads icons from the sites you added as shortcuts.

No other data leaves your device. Questions: open an issue on the GitHub repository.
