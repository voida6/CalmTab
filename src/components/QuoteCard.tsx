import { quoteOfTheDay } from '../data/quotes'

export function QuoteCard() {
  const quote = quoteOfTheDay()
  return (
    <div className="card quote">
      <div className="quote-text">&ldquo;{quote.text}&rdquo;</div>
      <div className="quote-author">- {quote.author}</div>
    </div>
  )
}
