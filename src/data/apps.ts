export interface AppShortcut {
  name: string
  url: string
}

// Common quick-access apps shown in the apps drawer (Mynt-style grid).
export const APPS: AppShortcut[] = [
  { name: 'Gmail', url: 'https://mail.google.com' },
  { name: 'Drive', url: 'https://drive.google.com' },
  { name: 'Calendar', url: 'https://calendar.google.com' },
  { name: 'Maps', url: 'https://maps.google.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'Photos', url: 'https://photos.google.com' },
  { name: 'Meet', url: 'https://meet.google.com' },
  { name: 'Translate', url: 'https://translate.google.com' },
  { name: 'Docs', url: 'https://docs.google.com' },
  { name: 'Sheets', url: 'https://sheets.google.com' },
  { name: 'News', url: 'https://news.google.com' },
  { name: 'Keep', url: 'https://keep.google.com' },
]
