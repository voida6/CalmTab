// Turns one `vite build` into two loadable extensions.
//
//   node scripts/pack.mjs            -> both targets
//   node scripts/pack.mjs firefox    -> just that one
//
// The two builds share every byte of app code; they differ only in the
// manifest (Chrome wants a service_worker, Gecko wants a background script and
// an add-on id) so the Chrome listing and the Firefox/Zen listing can be
// published and updated independently without either one holding the other up.
//
// Output:
//   release/chrome/    release/CalmTab-chrome-vX.Y.Z.zip
//   release/firefox/   release/CalmTab-firefox-vX.Y.Z.zip

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const releases = join(root, 'release')

const TARGETS = ['chrome', 'firefox']

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))

/** Shallow-merge a target overlay onto the shared base manifest. Top-level
 *  keys only — that is all the two targets actually diverge on, and it keeps
 *  the overlay files readable as "here is the difference". */
function buildManifest(target, version) {
  const base = readJson(join(root, 'manifests', 'base.json'))
  const overlay = readJson(join(root, 'manifests', `${target}.json`))
  return { ...base, ...overlay, version }
}

function zip(dir, outFile) {
  rmSync(outFile, { force: true })
  try {
    if (process.platform === 'win32') {
      // Compress-Archive ships with Windows PowerShell; no toolchain needed.
      execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          `Compress-Archive -Path '${join(dir, '*')}' -DestinationPath '${outFile}' -Force`,
        ],
        { stdio: 'inherit' },
      )
    } else {
      execFileSync('zip', ['-qr', outFile, '.'], { cwd: dir, stdio: 'inherit' })
    }
    return true
  } catch {
    console.warn(`  ! could not create ${outFile} — the unpacked folder is still usable`)
    return false
  }
}

function pack(target, version) {
  const out = join(releases, target)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })

  // 1. the built app, identical for both targets
  cpSync(dist, out, { recursive: true })

  // 2. hand-written extension plumbing (background + overlay content script).
  //    These are plain classic scripts on purpose: no bundling, so they behave
  //    the same under a Chrome service worker and a Gecko background script.
  const plumbing = join(root, 'extension')
  if (existsSync(plumbing)) cpSync(plumbing, out, { recursive: true })

  // 3. the target's manifest
  writeFileSync(
    join(out, 'manifest.json'),
    JSON.stringify(buildManifest(target, version), null, 2) + '\n',
  )

  const zipped = zip(out, join(releases, `CalmTab-${target}-v${version}.zip`))
  console.log(`  ✓ release/${target}/${zipped ? ` + CalmTab-${target}-v${version}.zip` : ''}`)
}

const version = readJson(join(root, 'package.json')).version
const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = requested.length ? requested : TARGETS

for (const t of targets) {
  if (!TARGETS.includes(t)) {
    console.error(`unknown target "${t}" — expected one of ${TARGETS.join(', ')}`)
    process.exit(1)
  }
}
if (!existsSync(dist)) {
  console.error('dist/ is missing — run `npm run build` first')
  process.exit(1)
}

mkdirSync(releases, { recursive: true })
console.log(`CalmTab v${version}`)
for (const t of targets) pack(t, version)
