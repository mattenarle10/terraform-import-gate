export const page = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terraform Import Gate</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;color:#e9eceb;background:#151a1a}
*{box-sizing:border-box} body{margin:0}
header{border-bottom:1px solid #364540;padding:1rem max(1rem,calc((100% - 62rem)/2));font-weight:650}
main{max-width:64rem;margin:0 auto;padding:2.75rem 1rem}
h1{font-size:clamp(1.8rem,5vw,2.8rem);margin:0 0 .55rem;letter-spacing:-.035em}
p{line-height:1.55} .muted{color:#b3c3bc} .grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.6rem}
section,form{padding:1.2rem;background:#1d2523;border:1px solid #364540;border-radius:.65rem;min-width:0}
label{display:block;font-size:.9rem;font-weight:650;margin:1rem 0 .4rem}
label:first-child{margin-top:0}
input,textarea{display:block;width:100%;padding:.65rem;background:#151a1a;border:1px solid #596861;border-radius:.35rem;color:inherit;font:inherit}
textarea{resize:vertical} button{margin-top:1.1rem;background:#abefc0;border:0;color:#0f2018;padding:.7rem 1.05rem;border-radius:.35rem;font:inherit;font-weight:700;cursor:pointer}
button:disabled{opacity:.65;cursor:wait} :focus-visible{outline:2px solid #abefc0;outline-offset:3px}
h2{font-size:1.05rem;margin:0 0 .65rem} #verdict{font-size:1.45rem;font-weight:750;margin:.35rem 0}
.pass{color:#abefc0} .block{color:#ffbd99}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#151a1a;padding:.65rem;border-radius:.35rem;font-size:.82rem}
#explanation{white-space:pre-wrap;overflow-wrap:anywhere} #error{color:#ffbd99}
@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding-top:1.75rem}}
</style>
</head>
<body>
<header>Terraform Import Gate</header>
<main>
<h1>Check an import plan</h1>
<p class="muted">Find out whether your plan adopts one existing resource as-is.</p>
<div class="grid">
<form id="review">
<label for="summary">Plan summary</label>
<input id="summary" type="file" accept=".json,application/json" required>
<pre>node scripts/cli.ts summary &lt;root&gt; &lt;plan&gt; &lt;address&gt; &lt;id&gt; &lt;aws-arn&gt; &gt; summary.json</pre>
<label for="token">Access token</label>
<input id="token" type="password" autocomplete="off" required>
<label for="note">Change note (optional)</label>
<textarea id="note" maxlength="800" rows="3" placeholder="What are you trying to import?"></textarea>
<button type="submit">Review plan</button>
<p id="error" role="alert" hidden></p>
</form>
<section aria-live="polite">
<h2>Summary review</h2>
<p class="muted">Use the CLI check to verify the saved Terraform plan before apply.</p>
<p id="verdict" class="muted">Choose a plan summary.</p>
<ul id="reasons" hidden></ul>
<pre id="evidence" hidden></pre>
<div id="agent" hidden>
<h2>Agent explanation</h2>
<p id="explanation" class="muted"></p>
</div>
</section>
</div>
</main>
<script>
const get = id => document.getElementById(id)
const form = get('review')
const button = form.querySelector('button')
form.addEventListener('submit', async event => {
  event.preventDefault()
  button.disabled = true
  get('error').hidden = true
  get('verdict').className = 'muted'
  get('verdict').textContent = 'Reviewing plan…'
  for (const id of ['reasons', 'evidence', 'agent']) get(id).hidden = true
  try {
    const file = get('summary').files[0]
    if (file.size > 60000) throw new Error('Choose a summary under 60 KB.')
    let summary
    try { summary = JSON.parse(await file.text()) }
    catch { throw new Error('Choose a valid JSON summary.') }
    if (summary?.version !== 1 || !Array.isArray(summary?.changes)) {
      throw new Error('Export a summary with the CLI before uploading.')
    }
    const response = await fetch('/review', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + get('token').value.trim()},
      body: JSON.stringify({summary, note: get('note').value}),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Review failed.')
    get('verdict').textContent = result.verdict
    get('verdict').className = result.verdict === 'IMPORT ONLY' ? 'pass' : 'block'
    const reasons = result.reasons.map(reason => {
      const li = document.createElement('li')
      li.textContent = reason
      return li
    })
    get('reasons').replaceChildren(...reasons)
    get('reasons').hidden = reasons.length === 0
    get('evidence').textContent = result.evidence.map(change => {
      const fields = change.fields.length ? ' (' + change.fields.join(', ') + ')' : ''
      return change.type + ' | ' + change.actions.join(', ') + fields
    }).join('\n')
    get('evidence').hidden = result.evidence.length === 0
    get('agent').hidden = false
    get('explanation').textContent = result.agent.explanation || (
      result.agent.status === 'note_blocked'
        ? 'Bedrock Guardrails blocked the change note.'
        : 'An agent explanation is unavailable for this request.'
    )
  } catch (error) {
    get('verdict').textContent = 'Review unavailable.'
    get('error').textContent = error.message
    get('error').hidden = false
  } finally {
    button.disabled = false
  }
})
</script>
</body>
</html>`
