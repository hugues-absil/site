/**
 * Remplace le contenu du dépôt GitHub Pages par le dist/ local uniquement
 * (supprime les vieux assets accumulés qui font timeout le deploy).
 *
 * Prérequis : SSH configuré (Host github.com-hugues) + clé ajoutée sur le compte GitHub.
 * Usage : node scripts/deploy-pages-clean.mjs
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const ENDPOINT = 'http://127.0.0.1:7384/ingest/f2623e45-6f8b-46b5-9649-a816cad71e9e'
const SESSION = 'b2b05b'
const REMOTE = 'git@github.com-hugues:hugues-absil/site.git'

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' })
}

async function agentLog(hypothesisId, location, message, data) {
  // #region agent log
  const payload = {
    sessionId: SESSION,
    runId: 'post-fix',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  }
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
      body: JSON.stringify(payload),
    })
  } catch {
    /* ignore */
  }
  fs.appendFileSync(path.join(root, 'debug-b2b05b.log'), JSON.stringify(payload) + '\n')
  // #endregion
}

function walkSize(dir) {
  let count = 0
  let bytes = 0
  if (!fs.existsSync(dir)) return { count, bytes }
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name)
      const st = fs.statSync(full)
      if (st.isDirectory()) stack.push(full)
      else {
        count++
        bytes += st.size
      }
    }
  }
  return { count, bytes }
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('dist/index.html manquant. Lance d’abord : npm run build')
  process.exit(1)
}

// Garantir .nojekyll
fs.writeFileSync(path.join(distDir, '.nojekyll'), '')

const local = walkSize(distDir)
await agentLog('A', 'deploy-pages-clean.mjs:start', 'Starting clean Pages deploy', {
  localFiles: local.count,
  localMB: +(local.bytes / 1024 / 1024).toFixed(2),
  remote: REMOTE,
})

if (local.bytes > 45 * 1024 * 1024) {
  console.warn(
    `Attention: dist fait ${(local.bytes / 1024 / 1024).toFixed(1)} Mo — risque de timeout Pages. Compresse les images si possible.`,
  )
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'site-pages-clean-'))
console.log('Clone dans', work)

try {
  sh(`git clone --depth 1 ${REMOTE} repo`, work)
  const repo = path.join(work, 'repo')

  // Supprimer tout sauf .git
  for (const name of fs.readdirSync(repo)) {
    if (name === '.git') continue
    fs.rmSync(path.join(repo, name), { recursive: true, force: true })
  }

  // Copier dist → racine du repo
  const copyRecursive = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      const s = path.join(src, name)
      const d = path.join(dest, name)
      if (fs.statSync(s).isDirectory()) copyRecursive(s, d)
      else fs.copyFileSync(s, d)
    }
  }
  copyRecursive(distDir, repo)

  const after = walkSize(repo)
  await agentLog('A', 'deploy-pages-clean.mjs:staged', 'Clean tree staged for commit', {
    files: after.count,
    mb: +(after.bytes / 1024 / 1024).toFixed(2),
  })

  sh('git config user.email "h.absil@hotmail.fr"', repo)
  sh('git config user.name "Hugues Absil"', repo)
  sh('git add -A', repo)
  const status = sh('git status --porcelain', repo).trim()
  if (!status) {
    console.log('Rien à pousser — le remote est déjà identique au dist.')
    await agentLog('A', 'deploy-pages-clean.mjs:noop', 'No changes to push', {})
    process.exit(0)
  }

  sh('git commit -m "chore: clean Pages deploy (remove accumulated assets)"', repo)
  console.log('Push vers origin main…')
  sh('git push origin HEAD:main', repo)

  await agentLog('A', 'deploy-pages-clean.mjs:pushed', 'Clean deploy pushed — watch Actions', {
    files: after.count,
    mb: +(after.bytes / 1024 / 1024).toFixed(2),
    actionsUrl: 'https://github.com/hugues-absil/site/actions',
  })
  console.log('OK. Surveille : https://github.com/hugues-absil/site/actions')
} catch (err) {
  const msg = String(err?.stderr || err?.message || err)
  await agentLog('A', 'deploy-pages-clean.mjs:error', 'Clean deploy failed', { error: msg.slice(0, 800) })
  console.error(msg)
  process.exit(1)
} finally {
  try {
    fs.rmSync(work, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}
