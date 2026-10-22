# CodePulse — Coding Practice Progress Coach

**Agentic AI Hackathon 2026 · Ziro.Digital · TEAM TECH**

CodePulse turns coding-practice evidence into a focused weekly plan, a voice briefing, and a traceable problem list. It follows the assigned workflow: assess topic coverage, detect weak areas, require approval before saving a plan, and verify the resulting plan state.

## Features
- Clearly labelled synthetic demo fixture for a safe, repeatable demonstration.
- Live public Codeforces submissions connector. Other platforms are not scraped by this version.
- Explicit private/unreadable-profile state instead of guessing data.
- Topic prioritisation, including Graphs as the first priority when there are zero observed Graphs problems.
- Deduplication by canonical problem ID.
- Prior-snapshot comparison that does not claim progress when the IDs are unchanged.
- Weekly list of specific problem links, topic rationale, and estimated practice time.
- Browser voice briefing using speech synthesis.
- Human approval before saving; stable plan key prevents duplicate local saves on retries.
- Verification panel labels synthetic fixture verification as snapshot-only.
- Four official scenarios and a six-test Node test suite.

## Run locally
Requires Node.js 18+.

    npm test
    npm start

Open http://localhost:3000. Select **Synthetic demo snapshot**, click **Run weekly coach**, review the exact problem list, approve it explicitly, and run verification. The browser speech feature reads the generated briefing aloud.

## Public profile retrieval
Select **Public Codeforces profile** and enter a handle. The server calls the Codeforces user.status endpoint, retains the retrieval time and source URL, and deduplicates accepted problems. It maps problem tags into a limited topic set. If retrieval fails, the app shows an unavailable/export message rather than inventing values. This version does not claim live LeetCode, HackerRank, or company-specific integrations.

## Official tests
| ID | Input scenario | Expected result |
|---|---|---|
| TC1 | Profile shows zero Graphs problems | Graphs prioritised |
| TC2 | Profile is private | Request export instead of guessing |
| TC3 | Same problem solved on two platforms | Count it once by canonical ID |
| TC4 | No change this week | No false progress claim |

Test fixtures are synthetic. Verify live Codeforces retrieval from the deployed host before describing it as live evidence.

## Deployment
Deploy the entire folder to a Node-capable host. Build command: npm test; start command: npm start. A render.yaml is included and uses /api/health for the health check. Static hosting of only public/ does not provide the live Codeforces API route.

## Project structure
- public/index.html — UI and inputs
- public/styles.css — responsive styles
- public/agent-core.js — planning rules, deduplication, progress logic, official scenarios
- public/app.js — UI, speech, approval, verification, and exports
- server.js — web server and live Codeforces connector
- tests/core.test.js — automated tests
