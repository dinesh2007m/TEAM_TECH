'use strict';
const $ = (id) => document.getElementById(id);
let lastResult = null, lastTests = [];
const demo = {
  profileHandle: 'demo-student',
  profileUrl: 'https://example.test/public/demo-student',
  sourceUrl: 'synthetic fixture: demo snapshot',
  retrievedAt: '2026-10-22T09:00:00.000Z',
  visibility: 'public',
  mode: 'synthetic-demo',
  solvedProblems: [
    { canonicalId: 'leetcode:1', title: 'Two Sum', topic: 'Hashing', platform: 'LeetCode' },
    { canonicalId: 'leetcode:238', title: 'Product of Array Except Self', topic: 'Arrays', platform: 'LeetCode' },
    { canonicalId: 'leetcode:102', title: 'Binary Tree Level Order Traversal', topic: 'Trees', platform: 'LeetCode' },
    { canonicalId: 'leetcode:70', title: 'Climbing Stairs', topic: 'Dynamic Programming', platform: 'LeetCode' }
  ]
};
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function saveBlob(name, text, type) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function briefing(r) {
  if (r.status === 'needs_export') return r.message;
  const picks = r.plan.items.slice(0, 3).map(p => p.title).join(', ');
  const graph = r.summary.graphPriority ? 'No solved Graphs problems were observed, so Graphs is the first priority. ' : '';
  return 'Your current snapshot contains ' + r.summary.solvedUnique + ' unique solved problems. ' + graph +
    'Next, focus on ' + r.plan.priorityTopics.slice(0, 3).join(', ') + '. Suggested problems include ' + picks +
    '. Your weekly budget is ' + r.plan.weeklyHours + ' hours for ' + (r.plan.companies.join(' and ') || 'your target roles') +
    '. Progress check: ' + r.progress.label + ' Review the links and approve the weekly list before it is saved.';
}
function renderResult(r) {
  lastResult = r; $('result').classList.remove('hidden');
  $('statusPill').textContent = r.status === 'ready' ? 'PLAN READY' : 'EXPORT REQUIRED';
  $('resultMeta').textContent = 'Source: ' + (r.evidence.sourceMode || r.evidence.sourceState || 'unknown') + ' · ' + (r.evidence.retrievedAt || 'no retrieval timestamp');
  $('summary').innerHTML = r.status === 'ready'
    ? [['Unique solved', r.summary.solvedUnique], ['Graph problems', r.summary.graphCount], ['Weekly hours', r.plan.weeklyHours]].map(x => '<div class="stat"><strong>' + esc(x[1]) + '</strong><span>' + esc(x[0]) + '</span></div>').join('')
    : '<div class="stat"><strong>Private</strong><span>Profile state</span></div><div class="stat"><strong>Export</strong><span>Required next step</span></div><div class="stat"><strong>0</strong><span>Guessed facts</span></div>';
  $('briefText').textContent = briefing(r);
  $('planTable').innerHTML = r.plan
    ? '<table><thead><tr><th>Priority</th><th>Problem</th><th>Topic</th><th>Time</th><th>Why</th></tr></thead><tbody>' +
      r.plan.items.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a></td><td>' + esc(p.topic) + '</td><td>' + p.minutes + ' min</td><td>' + esc(p.reason) + '</td></tr>').join('') +
      '</tbody></table>'
    : '<p class="notice warn">No plan was generated. Import an authorised export rather than guessing private-profile data.</p>';
  $('approve').disabled = !r.plan; $('verify').disabled = !r.plan;
  $('actionState').textContent = 'No plan saved yet.'; $('actionState').className = 'notice';
  $('verifyState').textContent = 'Verification has not run.'; $('verifyState').className = 'notice';
  $('evidence').textContent = JSON.stringify({summary:r.summary || null, progress:r.progress, plan:r.plan, evidence:r.evidence, action:r.action}, null, 2);
}
$('coachForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const source = $('source').value, handle = $('handle').value.trim();
  let profile;
  if (source === 'private') {
    profile = { visibility:'private', profileHandle:handle, profileUrl:'https://example.test/profile/' + encodeURIComponent(handle), mode:'private-test' };
  } else if (source === 'codeforces') {
    $('result').classList.remove('hidden'); $('resultMeta').textContent = 'Retrieving public Codeforces submissions…';
    try {
      const response = await fetch('/api/codeforces?handle=' + encodeURIComponent(handle));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Public profile request failed');
      profile = data.profile;
    } catch (error) {
      renderResult({status:'needs_export', message:'Live retrieval failed: ' + error.message + '. Import a permitted export; no data was guessed.',
        progress:{claim:false}, plan:null, evidence:{profileUrl:'https://codeforces.com/profile/' + encodeURIComponent(handle), sourceMode:'live retrieval failed', retrievedAt:null, sourceState:'unavailable'}});
      return;
    }
  } else profile = Object.assign({}, demo, {profileHandle: handle || 'demo-student'});
  const prev = $('previous').value.trim();
  renderResult(CodePulseCore.runCoach({
    profile, weeklyHours:Number($('hours').value),
    targetCompanies:$('companies').value.split(',').map(x => x.trim()).filter(Boolean),
    previousIds:prev ? prev.split(',').map(x => x.trim()).filter(Boolean) : undefined
  }));
});
$('speak').addEventListener('click', () => {
  const text = $('briefText').textContent;
  if (!('speechSynthesis' in window)) { alert(text); return; }
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
});
$('approve').addEventListener('click', () => {
  if (!lastResult || !lastResult.plan) return;
  const label = 'Save ' + lastResult.plan.items.length + ' problems for ' + lastResult.plan.weeklyHours + ' practice hours?';
  if (!confirm(label + '\n\nThis is the required explicit human-approval step.')) return;
  const key = 'codepulse:' + lastResult.evidence.profileUrl + ':' + lastResult.evidence.retrievedAt + ':' + lastResult.plan.items.map(p => p.canonicalId).join(',');
  const saved = JSON.parse(localStorage.getItem('codepulseSavedPlans') || '[]');
  if (saved.some(x => x.key === key)) $('actionState').textContent = 'This exact plan was already saved; duplicate execution was prevented.';
  else {
    saved.push({key, approvedAt:new Date().toISOString(), plan:lastResult.plan, evidence:lastResult.evidence});
    localStorage.setItem('codepulseSavedPlans', JSON.stringify(saved));
    $('actionState').textContent = 'Approved and saved locally at ' + new Date().toLocaleString() + '.';
  }
  $('actionState').className = 'notice ok'; $('verify').disabled = false;
});
$('verify').addEventListener('click', () => {
  if (!lastResult || !lastResult.plan) return;
  const invalid = lastResult.plan.items.filter(p => !/^https:\/\/(leetcode\.com|codeforces\.com)\//i.test(p.url)).map(p => p.url);
  const result = {
    state: lastResult.evidence.sourceMode === 'live-codeforces' ? 'snapshot-checked' : 'snapshot-only',
    note: lastResult.evidence.sourceMode === 'live-codeforces'
      ? 'Links were checked for allowed format. Re-run live retrieval to refresh solved counts.'
      : 'Synthetic snapshot checks are labelled snapshot-only; no live source refresh is claimed.',
    invalidProblemLinks: invalid, checkedAt: new Date().toISOString()
  };
  $('verifyState').textContent = JSON.stringify(result, null, 2);
  $('verifyState').className = 'notice ' + (invalid.length ? 'warn' : 'ok');
});
$('export').addEventListener('click', () => {
  if (!lastResult || !lastResult.plan) return;
  const cells = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['Priority','Title','Topic','Minutes','URL','Reason']].concat(lastResult.plan.items.map((p,i) => [i+1,p.title,p.topic,p.minutes,p.url,p.reason]));
  saveBlob('codepulse-weekly-plan.csv', rows.map(row => row.map(cells).join(',')).join('\n'), 'text/csv');
});
$('runTests').addEventListener('click', () => {
  lastTests = CodePulseCore.officialTests();
  $('tests').innerHTML = lastTests.map(t => '<div class="test"><span class="test-id">' + esc(t.id) +
    '</span><div><strong>' + esc(t.scenario) + '</strong><p>Expected: ' + esc(t.expected) + '<br>Actual: ' + esc(t.actual) +
    '</p><details><summary>Evidence</summary><pre>' + esc(JSON.stringify(t.evidence, null, 2)) + '</pre></details></div><span class="' +
    (t.passed ? 'pass' : 'fail') + '">' + (t.passed ? 'PASS' : 'FAIL') + '</span></div>').join('');
  $('exportTests').classList.remove('hidden');
});
$('exportTests').addEventListener('click', () => saveBlob('codepulse-official-test-evidence.json',
  JSON.stringify({generatedAt:new Date().toISOString(), note:'Automated scenarios using synthetic fixtures.', tests:lastTests}, null, 2), 'application/json'));
