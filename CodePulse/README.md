# CodePulse — Coding Practice Progress Coach

**Agentic AI Hackathon 2026 · Ziro.Digital · TEAM TECH**

CodePulse turns a student's coding-practice evidence into a focused weekly plan, a voice briefing, and a traceable plan sheet.

## Features
- Synthetic demo snapshot, live public Codeforces profile connector, and CSV/JSON imports.
- Topic mapping against a target topic mix; Graphs are prioritised when the observed graph count is zero.
- Canonical problem ID deduplication across platforms.
- Private/unreadable profiles trigger an export request instead of guessed data.
- Snapshot comparison avoids false progress claims when solved IDs are unchanged.
- Weekly problem list with links, rationale, and estimated practice time.
- Browser speech briefing and transcript download.
- Human approval before saving a plan, with duplicate-save protection.
- Re-check workflow, evidence ledger, and JSON/CSV exports.
- Four official test cases plus two additional automated tests.

## Run locally
Requires Node.js 18+.

```bash
npm start
```

Open http://localhost:3000. Select **Demo snapshot**, run the coach, review the proposed problems, approve the plan, then run verification. Use **Official test suite** to run the four hackathon scenarios.

Run automated tests:

```bash
npm test
```

## Live public profile retrieval
The connector in this version supports public Codeforces profiles. For other platforms, import a permitted CSV/JSON export. A profile URL is never treated as proof that the source was read successfully. Blocked/private sources return an export-required or unavailable state.

## Optional Gemini briefing
The app works without Gemini using an evidence-based template. To enable the optional server-side narration, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` as environment variables. Never commit API keys. The model may rewrite narration only; deterministic rules control counts, priorities, links, and approval state.

## Deployment
Deploy this folder to a Node-capable host, with build command `npm test` and start command `npm start`. A `render.yaml` is included. The static `public/` folder alone does not provide live Codeforces or Gemini server endpoints.

## Official scenarios
| ID | Scenario | Expected behavior |
|---|---|---|
| TC1 | Profile has zero Graphs problems | Graphs prioritised |
| TC2 | Profile is private | Ask for an export; do not guess |
| TC3 | Same problem solved on two platforms | Count once by canonical ID |
| TC4 | No change this week | No false progress claim |

The automated test suite also verifies CSV parsing and Codeforces accepted-submission deduplication. Test fixture outputs are synthetic; test live retrieval from the deployed host before claiming it as live evidence.

## Project layout
- `public/index.html` — UI
- `public/styles.css` — responsive styling
- `public/agent-core.js` — decision rules, deduplication, planning, official scenarios
- `public/app.js` — UI state, imports/exports, voice, approval, evidence and verification
- `server.js` — web server, Codeforces connector, optional Gemini endpoint
- `tests/` — automated tests
- `data/` — sample inputs and official test evidence
- `docs/` — architecture, workflow, demo and portal submission guide
