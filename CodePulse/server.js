'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, 'public');
const send = (res, status, obj, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, {'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'});
  res.end(typeof obj === 'string' ? obj : JSON.stringify(obj));
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, {ok: true, service: 'CodePulse Coach API', time: new Date().toISOString()});
  }
  if (req.method === 'GET' && url.pathname === '/api/codeforces') {
    const handle = (url.searchParams.get('handle') || '').trim();
    if (!/^[A-Za-z0-9_.-]{1,32}$/.test(handle)) return send(res, 400, {error: 'Enter a valid Codeforces handle.'});
    const sourceUrl = 'https://codeforces.com/api/user.status?handle=' + encodeURIComponent(handle) + '&from=1&count=10000';
    try {
      const upstream = await fetch(sourceUrl, {signal: AbortSignal.timeout(12000), headers: {'User-Agent': 'CodePulse-Hackathon-Demo/1.0'}});
      const data = await upstream.json();
      if (!upstream.ok || data.status !== 'OK') throw new Error(data.comment || ('Codeforces HTTP ' + upstream.status));
      const map = new Map();
      for (const submission of data.result || []) {
        if (submission.verdict !== 'OK' || !submission.problem || !submission.problem.contestId || !submission.problem.index) continue;
        const p = submission.problem, id = 'codeforces:' + p.contestId + ':' + p.index, tags = p.tags || [];
        if (!map.has(id)) {
          const topic = tags.some(t => /graph|dfs|bfs|shortest path/i.test(t)) ? 'Graphs' :
            tags.some(t => /dp/i.test(t)) ? 'Dynamic Programming' : 'Math / Other';
          map.set(id, {canonicalId:id, problemId:String(p.contestId)+p.index, title:p.name||id, topic, platform:'Codeforces',
            url:'https://codeforces.com/problemset/problem/'+p.contestId+'/'+p.index});
        }
      }
      return send(res, 200, {ok:true, profile:{profileHandle:handle,
        profileUrl:'https://codeforces.com/profile/'+encodeURIComponent(handle), sourceUrl,
        retrievedAt:new Date().toISOString(), visibility:'public', mode:'live-codeforces', solvedProblems:Array.from(map.values())}});
    } catch (error) {
      return send(res, 502, {error:'Public profile retrieval failed. Do not guess data; use an export or the synthetic demo.',
        detail:String(error.message||error), sourceUrl});
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, {error:'Method not allowed'});
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, {error:'Invalid URL path'}); }
  if (pathname === '/') pathname = '/index.html';
  const relative = path.normalize(pathname).replace(/^([/\\]*\.\.[/\\])+/, '');
  const target = path.join(ROOT, relative);
  if (!target.startsWith(ROOT + path.sep)) return send(res, 403, {error:'Forbidden'});
  fs.readFile(target, (error, data) => {
    if (error) return send(res, 404, {error:'Not found'});
    const ext = path.extname(target), types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
    res.writeHead(200, {'Content-Type':types[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(data);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log('CodePulse running on port ' + PORT));
