/**
 * Debug: compare local dist vs remote GitHub Pages repo size.
 * Run: node scripts/check-pages-deploy-size.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const ENDPOINT = 'http://127.0.0.1:7384/ingest/f2623e45-6f8b-46b5-9649-a816cad71e9e'
const SESSION = 'b2b05b'
const REPO = 'hugues-absil/site'

function walk(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else {
      const st = fs.statSync(full)
      out.push({ path: path.relative(dir, full).replace(/\\/g, '/'), size: st.size })
    }
  }
  return out
}

async function agentLog(hypothesisId, location, message, data) {
  // #region agent log
  const payload = {
    sessionId: SESSION,
    runId: 'pre-fix',
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
  const logPath = path.join(root, 'debug-b2b05b.log')
  fs.appendFileSync(logPath, JSON.stringify(payload) + '\n')
  // #endregion
}

const local = walk(distDir)
const localBytes = local.reduce((s, f) => s + f.size, 0)
const localIndexJs = local.filter((f) => /^assets\/index-.*\.js$/.test(f.path))

await agentLog('A', 'check-pages-deploy-size.mjs:local', 'Local dist inventory', {
  fileCount: local.length,
  totalBytes: localBytes,
  totalMB: +(localBytes / 1024 / 1024).toFixed(2),
  indexJsCount: localIndexJs.length,
  topFiles: [...local].sort((a, b) => b.size - a.size).slice(0, 8),
})

let remote = { ok: false }
try {
  const treeRes = await fetch(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'deploy-size-check' },
  })
  const tree = await treeRes.json()
  const blobs = (tree.tree || []).filter((t) => t.type === 'blob')
  const indexJs = blobs.filter((b) => /^assets\/index-.*\.js$/.test(b.path))
  const assets = blobs.filter((b) => b.path.startsWith('assets/'))
  const remoteBytes = blobs.reduce((s, b) => s + (b.size || 0), 0)
  remote = {
    ok: true,
    fileCount: blobs.length,
    totalBytes: remoteBytes,
    totalMB: +(remoteBytes / 1024 / 1024).toFixed(2),
    indexJsCount: indexJs.length,
    indexJsBytes: indexJs.reduce((s, b) => s + (b.size || 0), 0),
    assetsCount: assets.length,
    assetsMB: +((assets.reduce((s, b) => s + (b.size || 0), 0) / 1024 / 1024).toFixed(2)),
  }
  await agentLog('A', 'check-pages-deploy-size.mjs:remote', 'Remote repo inventory (accumulated uploads)', remote)

  const bloated = remote.indexJsCount > 3 || remote.totalBytes > 40 * 1024 * 1024
  await agentLog('A', 'check-pages-deploy-size.mjs:verdict-A', 'Hypothesis A: deploy timeout from oversized/accumulated assets', {
    confirmedLikely: bloated,
    reason: bloated
      ? 'Remote has many hashed bundles / size >> clean dist; Pages deploy can timeout'
      : 'Remote size looks reasonable',
    localMB: +(localBytes / 1024 / 1024).toFixed(2),
    remoteMB: remote.totalMB,
    ratio: remote.totalBytes && localBytes ? +(remote.totalBytes / localBytes).toFixed(2) : null,
  })
} catch (err) {
  await agentLog('A', 'check-pages-deploy-size.mjs:remote-error', 'Failed to fetch remote tree', {
    error: String(err?.message || err),
  })
}

try {
  const runsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=3`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'deploy-size-check' },
  })
  const runs = await runsRes.json()
  const latest = (runs.workflow_runs || []).slice(0, 3).map((r) => ({
    id: r.id,
    conclusion: r.conclusion,
    status: r.status,
    created_at: r.created_at,
    html_url: r.html_url,
    name: r.name,
  }))
  await agentLog('B', 'check-pages-deploy-size.mjs:actions', 'Recent Pages workflow runs', { latest })
  const failed = latest.find((r) => r.conclusion === 'failure')
  await agentLog('B', 'check-pages-deploy-size.mjs:verdict-B', 'Hypothesis B: latest deploy failed (timeout vs other)', {
    hasFailure: !!failed,
    failedRun: failed || null,
  })
} catch (err) {
  await agentLog('B', 'check-pages-deploy-size.mjs:actions-error', 'Failed to fetch actions', {
    error: String(err?.message || err),
  })
}

console.log(
  JSON.stringify(
    {
      localMB: +(localBytes / 1024 / 1024).toFixed(2),
      localFiles: local.length,
      remote,
    },
    null,
    2,
  ),
)
