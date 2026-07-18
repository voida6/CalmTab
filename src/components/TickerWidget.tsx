import { useEffect, useState } from 'react'
import { getItem, setItem } from '../lib/storage'

interface Coin {
  id: string
  price: number
  change: number
}

// CoinGecko's free tier rate-limits aggressively; cache prices so opening new
// tabs doesn't hammer the API.
const CACHE_KEY = 'tickerCache'
const TTL = 5 * 60 * 1000

interface TickerCache {
  coins: Coin[]
  ids: string
  fetchedAt: number
}

// Crypto prices via CoinGecko (free, no key). Symbols are CoinGecko coin ids.
async function fetchPrices(ids: string[]): Promise<Coin[]> {
  if (ids.length === 0) return []
  const url =
    'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&include_24hr_change=true&ids=' +
    encodeURIComponent(ids.join(','))
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>
  return ids
    .filter((id) => data[id])
    .map((id) => ({ id, price: data[id].usd, change: data[id].usd_24h_change }))
}

function fmt(n: number): string {
  return n >= 1 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toPrecision(3)
}

export function TickerWidget({ symbols }: { symbols: string[] }) {
  const [coins, setCoins] = useState<Coin[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const ids = symbols.join(',')

    const load = async (force: boolean) => {
      if (!force) {
        const cached = await getItem<TickerCache | null>(CACHE_KEY, null)
        if (cached && cached.ids === ids && cached.coins.length > 0) {
          if (active) setCoins(cached.coins)
          if (Date.now() - cached.fetchedAt < TTL) return // fresh enough
        }
      }
      const coins = await fetchPrices(symbols)
      if (!active) return
      if (coins.length > 0) {
        setCoins(coins)
        setError(false)
        void setItem(CACHE_KEY, { coins, ids, fetchedAt: Date.now() } satisfies TickerCache)
      } else {
        setError(true)
      }
    }

    load(false).catch(() => active && setError(true))
    const id = setInterval(() => load(true).catch(() => active && setError(true)), TTL)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [symbols.join(',')])

  return (
    <div className="card ticker-card">
      <div className="widget-label">Crypto</div>
      {coins.length === 0 ? (
        <div className="muted">{error ? 'Unavailable' : 'Loading…'}</div>
      ) : (
        coins.map((c) => (
          <div className="ticker-row" key={c.id}>
            <span className="ticker-name">{c.id}</span>
            <span className="ticker-price">${fmt(c.price)}</span>
            <span className={`ticker-change ${c.change >= 0 ? 'up' : 'down'}`}>
              {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
            </span>
          </div>
        ))
      )}
    </div>
  )
}
