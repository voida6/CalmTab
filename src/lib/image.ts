// Image scaling helpers. Wallpapers are capped so stored sizes stay sane while
// still looking crisp full-screen; the tiny thumbnail is cached in localStorage
// for the pre-paint boot script (a full data URL can exceed the 5MB quota).

function scaleImage(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

// Read an uploaded image file and return a downscaled JPEG data URL.
export async function fileToScaledDataUrl(file: File, maxEdge = 2560, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return scaleImage(img, maxEdge, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Tiny placeholder (~2-4KB) shown blurred by boot.js on first paint.
export async function thumbFromDataUrl(dataUrl: string, maxEdge = 96, quality = 0.5): Promise<string> {
  const img = await loadImage(dataUrl)
  return scaleImage(img, maxEdge, quality)
}

// First frame of a GIF (or any image file) as a scaled JPEG data URL.
export async function fileFrameDataUrl(file: Blob, maxEdge = 2560, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return scaleImage(img, maxEdge, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Capture a representative frame from a video file as a scaled JPEG data URL.
export function videoFrameDataUrl(file: Blob, maxEdge = 2560, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    const fail = (msg: string) => {
      URL.revokeObjectURL(url)
      reject(new Error(msg))
    }
    video.onloadeddata = () => {
      // Seek a little way in — frame 0 is often black.
      video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1)
    }
    video.onseeked = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) return fail('Canvas not supported')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch {
        fail('Could not read video frame')
      }
    }
    video.onerror = () => fail('Could not load video')
    video.src = url
  })
}

// Render a linear-gradient preset to a JPEG data URL (built-in gallery).
export function gradientDataUrl(stops: string[], angleDeg = 135, w = 1920, h = 1080): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const cx = w / 2
  const cy = h / 2
  const len = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
  const g = ctx.createLinearGradient(
    cx - (Math.cos(rad) * len) / 2,
    cy - (Math.sin(rad) * len) / 2,
    cx + (Math.cos(rad) * len) / 2,
    cy + (Math.sin(rad) * len) / 2,
  )
  stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // Subtle grain so large gradients don't band.
  const noise = ctx.getImageData(0, 0, w, h)
  const d = noise.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 6
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(noise, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.9)
}
