// Monochrome brand glyphs (24x24 path data) for the shortcut dock. We render the
// path tinted with the theme color so shortcuts match the Material You palette
// instead of using full-color favicons. Sites without a glyph fall back to a
// letter monogram (handled in LinksDock).
import {
  siYoutube,
  siFacebook,
  siReddit,
  siGithub,
  siGmail,
  siInstagram,
  siWhatsapp,
  siX,
  siGoogle,
  siSpotify,
  siNetflix,
  siGooglemaps,
  siGooglecalendar,
  siGoogledocs,
  siDiscord,
  siTwitch,
  siWikipedia,
  siGooglegemini,
  siClaude,
  siPerplexity,
  siGoogledrive,
  siGooglephotos,
  siGooglemeet,
  siGoogletranslate,
  siGooglesheets,
  siGooglenews,
  siGooglekeep,
} from 'simple-icons'

// LinkedIn & Amazon were removed from simple-icons (brand policy) — hand-provided.
const LINKEDIN =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'

interface Entry {
  match: string[]
  path: string
}

// Order matters: more specific Google hosts before the generic 'google.'.
const ENTRIES: Entry[] = [
  { match: ['youtube.com', 'youtu.be'], path: siYoutube.path },
  { match: ['linkedin.com'], path: LINKEDIN },
  { match: ['facebook.com', 'fb.com'], path: siFacebook.path },
  { match: ['reddit.com'], path: siReddit.path },
  { match: ['github.com'], path: siGithub.path },
  { match: ['mail.google.', 'gmail.com'], path: siGmail.path },
  { match: ['docs.google.'], path: siGoogledocs.path },
  { match: ['maps.google.'], path: siGooglemaps.path },
  { match: ['calendar.google.'], path: siGooglecalendar.path },
  { match: ['instagram.com'], path: siInstagram.path },
  { match: ['whatsapp.com', 'wa.me'], path: siWhatsapp.path },
  { match: ['twitter.com', 'x.com'], path: siX.path },
  { match: ['spotify.com'], path: siSpotify.path },
  { match: ['netflix.com'], path: siNetflix.path },
  { match: ['discord.com', 'discord.gg'], path: siDiscord.path },
  { match: ['twitch.tv'], path: siTwitch.path },
  { match: ['wikipedia.org'], path: siWikipedia.path },
  // AI tools
  { match: ['gemini.google.'], path: siGooglegemini.path },
  { match: ['claude.ai'], path: siClaude.path },
  { match: ['perplexity.ai'], path: siPerplexity.path },
  // Google apps (specific hosts before the generic 'google.')
  { match: ['drive.google.'], path: siGoogledrive.path },
  { match: ['photos.google.'], path: siGooglephotos.path },
  { match: ['meet.google.'], path: siGooglemeet.path },
  { match: ['translate.google.'], path: siGoogletranslate.path },
  { match: ['sheets.google.'], path: siGooglesheets.path },
  { match: ['news.google.'], path: siGooglenews.path },
  { match: ['keep.google.'], path: siGooglekeep.path },
  { match: ['google.'], path: siGoogle.path },
]

export function brandGlyph(url: string): string | null {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    host = url.toLowerCase()
  }
  for (const entry of ENTRIES) {
    if (entry.match.some((m) => host.includes(m))) return entry.path
  }
  return null
}
