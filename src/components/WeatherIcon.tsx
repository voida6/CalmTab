// Monochrome line weather icons (stroke = currentColor) so they match the theme
// palette instead of a multicolor emoji. Mapped from WMO weather codes.
interface Props {
  code: number
  size?: number
}

type Kind = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'thunder'

function kindFor(code: number): Kind {
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloud'
}

const CLOUD = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'
const CLOUD_UP = 'M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25'

export function WeatherIcon({ code, size = 40 }: Props) {
  const kind = kindFor(code)
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (kind) {
    case 'sun':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      )
    case 'partly':
      return (
        <svg {...p}>
          <circle cx="8" cy="7" r="3" />
          <path d="M8 1v1.5M3.5 7H2M4.6 3.6l-.9-.9M12.4 3.6l.9-.9" />
          <path d={CLOUD} />
        </svg>
      )
    case 'cloud':
      return (
        <svg {...p}>
          <path d={CLOUD} />
        </svg>
      )
    case 'fog':
      return (
        <svg {...p}>
          <path d={CLOUD_UP} />
          <path d="M5 19h14M7 22h12" />
        </svg>
      )
    case 'rain':
      return (
        <svg {...p}>
          <path d={CLOUD_UP} />
          <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
        </svg>
      )
    case 'snow':
      return (
        <svg {...p}>
          <path d={CLOUD_UP} />
          <path d="M8 19h.01M12 20h.01M16 19h.01M10 22h.01M14 22h.01" />
        </svg>
      )
    case 'thunder':
      return (
        <svg {...p}>
          <path d={CLOUD_UP} />
          <path d="M13 17l-3 4h4l-3 4" />
        </svg>
      )
  }
}
