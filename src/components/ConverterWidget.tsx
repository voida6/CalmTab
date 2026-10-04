import { useEffect, useState } from 'react'
import { convert, findUnit, formatResult, UNIT_GROUPS } from '../lib/convert'
import { getItem, setItem } from '../lib/storage'

// Currencies need live rates, so they are a group the unit tables can't
// describe. Rates come from a free, key-less endpoint and are cached for a day
// — exchange rates that are a few hours stale are fine for a new-tab widget,
// and it keeps the page off the network on most loads.
const RATES_URL = 'https://api.frankfurter.app/latest?base=EUR'
const RATES_KEY = 'fxRates'
const RATES_TTL = 24 * 60 * 60 * 1000

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'INR', 'CNY']

interface RatesCache {
  rates: Record<string, number> // per 1 EUR
  fetchedAt: number
}

async function loadRates(): Promise<Record<string, number> | null> {
  const cached = await getItem<RatesCache | null>(RATES_KEY, null)
  if (cached && Date.now() - cached.fetchedAt < RATES_TTL) return cached.rates
  try {
    const res = await fetch(RATES_URL)
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as { rates: Record<string, number> }
    const rates = { ...json.rates, EUR: 1 }
    void setItem(RATES_KEY, { rates, fetchedAt: Date.now() } satisfies RatesCache)
    return rates
  } catch {
    // Offline or the API is down: stale rates still beat no converter.
    return cached?.rates ?? null
  }
}

const GROUP_IDS = [...UNIT_GROUPS.map((g) => g.id), 'currency']

export function ConverterWidget() {
  const [group, setGroup] = useState('length')
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('km')
  const [to, setTo] = useState('mi')
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  const isCurrency = group === 'currency'

  useEffect(() => {
    if (!isCurrency || rates) return
    let active = true
    loadRates().then((r) => active && setRates(r))
    return () => {
      active = false
    }
  }, [isCurrency, rates])

  // Switching group invalidates the unit choices, so reset to that group's
  // first two rather than leaving "km → USD" on screen.
  const pickGroup = (id: string) => {
    setGroup(id)
    if (id === 'currency') {
      setFrom('EUR')
      setTo('USD')
    } else {
      const units = UNIT_GROUPS.find((g) => g.id === id)!.units
      setFrom(units[0].id)
      setTo(units[1]?.id ?? units[0].id)
    }
  }

  const options = isCurrency
    ? CURRENCIES.map((c) => ({ id: c, label: c }))
    : (UNIT_GROUPS.find((g) => g.id === group)?.units ?? []).map((u) => ({
        id: u.id,
        label: u.label,
      }))

  const value = Number(amount)
  let result: string
  if (!amount.trim() || Number.isNaN(value)) {
    result = '—'
  } else if (isCurrency) {
    if (!rates) result = '…'
    else if (!rates[from] || !rates[to]) result = '—'
    else result = formatResult((value / rates[from]) * rates[to])
  } else {
    const a = findUnit(group, from)
    const b = findUnit(group, to)
    result = a && b ? formatResult(convert(value, a, b)) : '—'
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="card converter-card">
      <div className="widget-label">Convert</div>

      <div className="seg-row wrap">
        {GROUP_IDS.map((id) => (
          <button
            key={id}
            className={`seg-btn small ${group === id ? 'on' : ''}`}
            onClick={() => pickGroup(id)}
          >
            {id === 'currency' ? 'Currency' : UNIT_GROUPS.find((g) => g.id === id)?.label}
          </button>
        ))}
      </div>

      <div className="row converter-row">
        <input
          className="converter-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount to convert"
        />
        <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Convert from">
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn-ghost" onClick={swap} title="Swap" aria-label="Swap units">
          ⇄
        </button>
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Convert to">
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="converter-result">
        {result}
        <span className="converter-unit">{options.find((o) => o.id === to)?.label}</span>
      </div>
    </div>
  )
}
