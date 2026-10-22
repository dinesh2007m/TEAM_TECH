# CodePulse architecture

## Components
- Browser UI: public/index.html and public/styles.css.
- Decision engine: public/agent-core.js.
- Browser controller: public/app.js.
- Node.js server: server.js.
- Automated checks: tests/core.test.js.

## Agent flow
1. Collect the profile handle, target companies, and weekly practice hours.
2. Obtain a clearly labelled synthetic sample or retrieve accepted submissions from the public Codeforces API.
3. Normalise solved records and deduplicate by canonical problem ID.
4. Compare topic counts with the target mix and prioritise Graphs when its observed count is zero.
5. Create a weekly problem list with links, estimated time, and an evidence-based reason.
6. Produce the briefing text and read it aloud using browser speech synthesis when available.
7. Show the exact plan and require explicit human approval before saving it locally.
8. Verify the proposed problem link formats and refresh the Codeforces profile again when the source was live. If refresh fails, show a failed state rather than a success claim.

## Safety and limits
- Private or unreadable profile data is not guessed; the app asks for an authorised export.
- The synthetic demo is not real student evidence.
- Live source retrieval in this version is limited to Codeforces. It does not scrape LeetCode or other coding sites.
- The link check validates HTTPS host and URL format. It does not claim that every external problem page is currently reachable.
- The approved list is stored in the current browser using localStorage, not in a multi-user database.
- Target companies inform the briefing context only; the app does not claim access to private hiring rubrics.
- Gemini narration and CSV/JSON imports are not included in this compact GitHub branch.
