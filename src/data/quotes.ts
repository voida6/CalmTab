export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: 'Be water, my friend.', author: 'Bruce Lee' },
  { text: 'The obstacle is the way.', author: 'Marcus Aurelius' },
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'What we do now echoes in eternity.', author: 'Marcus Aurelius' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Whether you think you can or cannot, you are right.', author: 'Henry Ford' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { text: 'The best way out is always through.', author: 'Robert Frost' },
  { text: 'Do the hard jobs first. The easy jobs will take care of themselves.', author: 'Dale Carnegie' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
]

// Deterministic pick that changes once per day.
export function quoteOfTheDay(date = new Date()): Quote {
  const dayIndex = Math.floor(date.getTime() / 86_400_000)
  return QUOTES[dayIndex % QUOTES.length]
}
