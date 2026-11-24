import { iconNotice, icons } from './icons.ts'

export const page = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terraform Import Gate</title>
<style>
:root {
  color-scheme: light;
  font: 16px/1.5 -apple-system, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --background: #fff;
  --foreground: #171717;
  --surface: #fff;
  --surface-hover: #f5f5f5;
  --line: #dedede;
  --surface-border: rgb(0 0 0 / 9%);
  --muted: #636363;
  --accent: #2563eb;
  --primary: #171717;
  --primary-hover: #353535;
  --primary-text: #fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --background: #0a0a0a;
    --foreground: #ededed;
    --surface: #0e0e0e;
    --surface-hover: #191919;
    --line: #383838;
    --surface-border: rgb(255 255 255 / 10%);
    --muted: #a3a3a3;
    --accent: #3b82f6;
    --primary: #ededed;
    --primary-hover: #fff;
    --primary-text: #171717;
  }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; background: var(--background); color: var(--foreground); font-size: 15px; }
.frame { width: 100%; max-width: 48rem; margin-inline: auto; padding-inline: clamp(1rem, 4vw, 2rem); }
.masthead .frame { min-height: 4.5rem; }
.masthead .frame, .upload, .actions, .summary-row, .verdict-heading, .brand {
  display: flex;
  align-items: center;
  gap: .65rem;
}
.masthead .frame, .upload, .summary-row { justify-content: space-between; }
.brand { font-size: .9rem; font-weight: 500; }
.icon { flex: 0 0 auto; }
.brand .icon { width: 20px; height: 20px; }
main { padding-block: clamp(1.6rem, 5vw, 3.25rem) 3rem; }
.intro { margin-bottom: 1.5rem; }
h1, h2, p { margin: 0; }
h1 { font-size: 1.75rem; line-height: 1.2; font-weight: 300; letter-spacing: -.035em; }
h2 { font-size: 1rem; line-height: 1.35; font-weight: 500; }
.intro p { margin-top: .45rem; font-weight: 300; }
.muted, .hint { color: var(--muted); }
.hint { font-size: .86rem; }
.panel {
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.25rem);
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
}
#unlock p { margin-top: .45rem; }
.field { margin-top: .9rem; }
.field label, .file-copy label { display: block; font-size: .92rem; font-weight: 500; }
.field label { margin-bottom: .35rem; }
input, textarea, button { font: inherit; color: inherit; }
input[type=password], textarea {
  display: block;
  width: 100%;
  padding: .55rem .7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--background);
  font-size: max(1rem, 16px);
}
textarea { resize: vertical; min-height: 4.5rem; }
button, .file-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  min-height: 2.75rem;
  padding: .45rem .7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-hover);
  color: var(--foreground);
  font-size: .92rem;
  font-weight: 500;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}
button { cursor: pointer; }
button:hover:not(:disabled), .upload:hover .file-action { border-color: var(--muted); }
button:disabled { opacity: .55; cursor: default; }
.primary {
  background: var(--primary);
  color: var(--primary-text);
  border-color: var(--primary);
  padding-inline: .85rem;
}
.primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}
.primary[aria-busy="true"] { opacity: .8; cursor: progress; }
.button-icon { display: grid; place-items: center; width: 16px; height: 16px; }
.button-icon .icon { transition: transform 160ms ease; }
.primary:hover:not(:disabled) .button-icon .icon { transform: translateX(2px); }
.primary[aria-busy="true"] .button-icon .icon { display: none; }
.primary[aria-busy="true"] .button-icon::after {
  content: '';
  width: 13px;
  height: 13px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
#lock { background: transparent; color: var(--muted); }
#lock:hover:not(:disabled) { color: var(--foreground); background: var(--surface-hover); }
.upload {
  position: relative;
  min-height: 4.65rem;
  padding: .65rem .8rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--background);
  transition: background-color 160ms ease, border-color 160ms ease;
}
.upload:hover, .upload.is-dragging { background: var(--surface-hover); }
.upload.is-dragging { border-color: var(--accent); }
.upload > .icon { width: 19px; height: 19px; color: var(--muted); transition: transform 160ms ease; }
.upload.is-dragging > .icon { transform: translateY(-2px); }
.file-copy { flex: 1; min-width: 0; }
.file-copy .hint { margin-top: .12rem; overflow-wrap: anywhere; }
.file-action { min-height: 2.35rem; white-space: nowrap; background: var(--surface); }
.upload:focus-within, :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.upload input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.upload input:disabled { cursor: default; }
.setting-row { margin-top: .4rem; border-bottom: 1px solid var(--surface-border); font-size: .92rem; }
.setting-row summary {
  display: flex;
  align-items: center;
  gap: .55rem;
  min-height: 2.8rem;
  padding-inline: .15rem;
  cursor: pointer;
  list-style: none;
}
.setting-row summary::-webkit-details-marker { display: none; }
.setting-row summary:hover, .setting-row summary .icon { color: var(--muted); }
.setting-row .summary-row { flex: 1; }
.setting-row .chevron { display: inline-flex; transition: transform 160ms ease; }
.setting-row[open] .chevron { transform: rotate(180deg); }
.setting-row p, .setting-row pre, .setting-row textarea { margin: 0 0 .75rem; }
code, #evidence { font-family: ui-monospace, "SF Mono", monospace; font-size: .83rem; }
pre { padding: .65rem; border-radius: 6px; background: var(--background); white-space: pre-wrap; overflow-wrap: anywhere; }
.actions { justify-content: flex-end; margin-top: .9rem; }
.sr-only { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; }
[role=alert] { margin-top: .55rem; overflow-wrap: anywhere; }
#result { margin-top: .9rem; }
#result:not([hidden]) { animation: reveal-result 180ms ease-out; }
@keyframes reveal-result { from { opacity: .65; transform: translateY(4px); } }
.verdict-heading > span { display: none; color: var(--muted); }
.verdict-heading > span .icon { display: block; }
[data-verdict="IMPORT ONLY"] .verdict-passed, [data-verdict="BLOCKED"] .verdict-blocked { display: inline-flex; }
#result p, #result ul { margin-top: .5rem; overflow-wrap: anywhere; }
#result ul { margin-bottom: 0; padding-left: 1.25rem; }
#evidence li + li { margin-top: .25rem; }
@media (max-width: 380px) {
  .upload { flex-wrap: wrap; }
  .file-copy { flex: 1 1 calc(100% - 2rem); }
  .file-action { margin-left: 1.8rem; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::after { animation: none !important; transition: none !important; }
  .primary:hover:not(:disabled) .button-icon .icon,
  .upload.is-dragging > .icon { transform: none; }
}
</style>
</head>
<body>
${iconNotice}
<header class="masthead">
  <div class="frame">
    <span class="brand">${icons.mark} Import Gate</span>
    <button id="lock" type="button" hidden>${icons.lock} Lock review</button>
  </div>
</header>
<main class="frame">
  <header class="intro">
    <h1>Review a Terraform import</h1>
    <p class="muted">See what Terraform would change while importing an existing resource.</p>
  </header>

  <form id="unlock" class="panel">
    <h2>Unlock review</h2>
    <p class="hint" id="key-hint">Enter the access key for this deployment.</p>
    <div class="field">
      <label for="key">Access key</label>
      <input id="key" type="password" autocomplete="off" maxlength="200" required aria-describedby="key-hint">
    </div>
    <div class="actions">
      <button type="submit" class="primary"><span class="button-label">Unlock</span><span class="button-icon" aria-hidden="true">${icons.next}</span></button>
    </div>
    <p id="unlock-error" role="alert" hidden></p>
  </form>

  <form id="review" class="panel" hidden>
    <div id="upload" class="upload">
      ${icons.file}
      <div class="file-copy">
        <label for="summary">Plan summary</label>
        <p class="hint" id="file-name" aria-live="polite">Drop the JSON file exported by the CLI.</p>
      </div>
      <span class="file-action" id="file-action" aria-hidden="true">Choose file</span>
      <input id="summary" type="file" accept=".json,application/json" required aria-describedby="file-name">
    </div>
    <details class="setting-row">
      <summary>
        ${icons.command}
        <span class="summary-row">Export a summary <span class="chevron">${icons.chevron}</span></span>
      </summary>
      <p class="hint">The saved plan stays on your machine. Run this from the Import Gate repo with your Terraform root, saved plan, target address, import ID, and AWS ARN.</p>
      <pre><code>node scripts/cli.ts summary &lt;root&gt; &lt;plan&gt; &lt;address&gt; &lt;id&gt; &lt;arn&gt; &gt; summary.json</code></pre>
    </details>
    <details id="change-note" class="setting-row">
      <summary>
        ${icons.note}
        <span class="summary-row"><span>Change note <span class="muted">(optional)</span></span><span class="chevron">${icons.chevron}</span></span>
      </summary>
      <textarea id="note" aria-label="Change note" maxlength="800" rows="2"></textarea>
    </details>
    <div class="actions">
      <button type="submit" class="primary" disabled><span class="button-label">Review summary</span><span class="button-icon" aria-hidden="true">${icons.next}</span></button>
    </div>
    <p id="status" class="sr-only" role="status"></p>
    <p id="review-error" role="alert" hidden></p>
  </form>

  <section id="result" class="panel" aria-labelledby="verdict" hidden>
    <div class="verdict-heading">
      <span class="verdict-passed">${icons.pass}</span>
      <span class="verdict-blocked">${icons.blocked}</span>
      <h2 id="verdict" tabindex="-1"></h2>
    </div>
    <p id="explanation"></p>
    <ul id="reasons" hidden></ul>
    <ul id="evidence" hidden></ul>
    <p class="hint">Use the local CLI check on the saved plan before applying it.</p>
  </section>
</main>
<script>
const byId = id => document.getElementById(id)
const unlock = byId('unlock')
const review = byId('review')
const keyInput = byId('key')
const summaryInput = byId('summary')
const noteInput = byId('note')
const unlockButton = unlock.querySelector('button[type=submit]')
const reviewButton = review.querySelector('button[type=submit]')
const lockButton = byId('lock')
const resultPanel = byId('result')
const upload = byId('upload')
let accessKey = ''

function showMessage(id, message = '') {
  const element = byId(id)
  element.textContent = message
  element.hidden = !message
}

function lock(message) {
  accessKey = ''
  keyInput.value = ''
  review.reset()
  byId('change-note').open = false
  updateFile()
  review.hidden = true
  lockButton.hidden = true
  unlock.hidden = false
  showMessage('unlock-error', message)
  keyInput.focus()
}

function setSubmitting(button, submitting, label) {
  button.disabled = submitting
  button.setAttribute('aria-busy', String(submitting))
  button.querySelector('.button-label').textContent = label
}

unlock.addEventListener('submit', async event => {
  event.preventDefault()
  if (unlockButton.disabled) return
  const key = keyInput.value.trim()
  if (!key) {
    showMessage('unlock-error', 'Enter your access key.')
    return
  }

  setSubmitting(unlockButton, true, 'Checking key…')
  showMessage('unlock-error')
  try {
    const response = await fetch('/unlock', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key },
      signal: AbortSignal.timeout(10_000),
    })
    if (response.status === 401) {
      showMessage('unlock-error', 'That access key didn’t match. Try again.')
      keyInput.select()
      return
    }
    if (response.status !== 204) throw new Error('Could not unlock. Try again.')
    accessKey = key
    keyInput.value = ''
    unlock.hidden = true
    review.hidden = false
    lockButton.hidden = false
    summaryInput.focus()
  } catch {
    showMessage('unlock-error', 'Could not unlock. Try again.')
  } finally {
    setSubmitting(unlockButton, false, 'Unlock')
  }
})

function updateFile() {
  resultPanel.hidden = true
  const file = summaryInput.files[0]
  byId('file-name').textContent = file?.name ?? 'Drop the JSON file exported by the CLI.'
  byId('file-action').textContent = file ? 'Replace file' : 'Choose file'
  const problem = file && (!file.name.toLowerCase().endsWith('.json') || file.size > 60000)
  showMessage('review-error', problem ? 'Choose a JSON summary under 60 KB.' : '')
  reviewButton.disabled = !file || Boolean(problem)
}

summaryInput.addEventListener('change', updateFile)
noteInput.addEventListener('input', () => {
  resultPanel.hidden = true
})
upload.addEventListener('dragover', event => {
  event.preventDefault()
  if (!summaryInput.disabled && event.dataTransfer.types.includes('Files')) {
    upload.classList.add('is-dragging')
  }
})
upload.addEventListener('dragleave', event => {
  if (!upload.contains(event.relatedTarget)) upload.classList.remove('is-dragging')
})
upload.addEventListener('drop', event => {
  event.preventDefault()
  upload.classList.remove('is-dragging')
  if (summaryInput.disabled) return
  if (event.dataTransfer.files.length === 1) {
    summaryInput.files = event.dataTransfer.files
    updateFile()
  } else {
    showMessage('review-error', 'Drop one JSON summary at a time.')
  }
})

lockButton.addEventListener('click', () => lock())

function showList(id, entries) {
  const list = byId(id)
  list.replaceChildren(...entries.map(entry => {
    const item = document.createElement('li')
    item.textContent = entry
    return item
  }))
  list.hidden = !entries.length
}

review.addEventListener('submit', async event => {
  event.preventDefault()
  if (!accessKey || reviewButton.disabled) return
  resultPanel.hidden = true
  showMessage('review-error')
  byId('status').textContent = 'Reviewing summary.'
  setSubmitting(reviewButton, true, 'Reviewing…')
  summaryInput.disabled = true
  noteInput.disabled = true
  lockButton.disabled = true

  try {
    const file = summaryInput.files[0]
    if (!file || file.size > 60000) throw new Error('Choose a JSON summary under 60 KB.')
    let summary
    try { summary = JSON.parse(await file.text()) }
    catch { throw new Error('Choose a valid JSON summary.') }
    if (summary?.version !== 1 || !Array.isArray(summary?.changes)) {
      throw new Error('Use the JSON summary exported by Import Gate.')
    }
    const response = await fetch('/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessKey },
      body: JSON.stringify({ summary, note: noteInput.value }),
      signal: AbortSignal.timeout(30_000),
    })
    if (response.status === 401) {
      lock('Unlock again to continue your review.')
      return
    }
    if (response.status === 429) throw new Error('Too many requests. Wait a moment and try again.')
    if (response.status >= 500) throw new Error('Review is unavailable. Try again.')
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not review this summary.')

    resultPanel.dataset.verdict = result.verdict
    byId('verdict').textContent = result.verdict
    byId('explanation').textContent = result.agent.explanation || (
      result.agent.status === 'note_blocked'
        ? 'Bedrock Guardrails blocked the change note.'
        : 'The agent explanation is unavailable.'
    )
    showList('reasons', result.agent.explanation ? [] : result.reasons)
    showList('evidence', result.evidence.map(change => {
      const actions = change.moved ? ['move', ...change.actions.filter(action => action !== 'no-op')] : change.actions
      const fields = change.fields.length ? ' (' + change.fields.join(', ') + ')' : ''
      return change.type + ' · ' + actions.join(', ') + fields
    }))
    resultPanel.hidden = false
    byId('verdict').focus()
  } catch (error) {
    let message = error.message
    if (error.name === 'TimeoutError') message = 'The review timed out. Try again.'
    else if (error instanceof TypeError) message = 'Could not reach the app. Try again.'
    showMessage('review-error', message)
  } finally {
    byId('status').textContent = ''
    setSubmitting(reviewButton, false, 'Review summary')
    reviewButton.disabled = !summaryInput.files.length
    summaryInput.disabled = false
    noteInput.disabled = false
    lockButton.disabled = false
  }
})
</script>
</body>
</html>`
