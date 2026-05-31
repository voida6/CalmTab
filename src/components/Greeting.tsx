import { useEffect, useState } from 'react'

function greetingFor(hour: number): string {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

interface Props {
  name: string
  tagline: string
}

export function Greeting({ name, tagline }: Props) {
  const [hour, setHour] = useState(() => new Date().getHours())

  // Re-check the hour each minute so the greeting flips at the boundary.
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(id)
  }, [])

  const text = greetingFor(hour) + (name ? `, ${name}` : '')

  return (
    <>
      <div className="greeting">{text}</div>
      {tagline && <div className="tagline">{tagline}</div>}
    </>
  )
}
