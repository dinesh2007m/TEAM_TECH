# Hackathon submission field draft

**Project name:** CodePulse — Coding Practice Progress Coach

**Tools used:** Node.js, JavaScript, HTML, CSS, Codeforces public API, browser Speech Synthesis, GitHub Actions.

**GitHub / public source link:** https://github.com/dinesh2007m/TEAM_TECH/tree/codepulse-agentic-ai-hackathon-2026/CodePulse

**Demo URL:** Add the actual public deployment URL after deploying the full Node.js app and testing /api/health. Do not use localhost as a public demo URL.

**2–3 minute demo video URL:** Add the actual uploaded video URL after recording and publishing the demo.

**Presentation URL:** Upload the PowerPoint to a reviewer-accessible link, then paste that link.

**Agent architecture:** Browser UI → Node.js server → public Codeforces submissions API (or labelled synthetic fixture) → canonical ID deduplication → topic-gap and Graphs-zero decision policy → specific weekly problem plan and voice briefing → human approval → local plan save → separate verification and evidence output.

**Solution and agent workflow:** The student provides a public coding profile handle, target companies, and weekly hours. CodePulse collects available public Codeforces solved-problem evidence, records the source URL and retrieval time, normalises and deduplicates accepted problems, ranks topic gaps, and prioritises Graphs when none are observed. It creates a weekly list of specific problems with links and estimated time, then provides a spoken briefing. The user must approve the exact list before saving. A separate verification step refreshes live Codeforces IDs when possible and compares counts; synthetic data is labelled snapshot-only. Private/unreadable profiles trigger an export request rather than a guessed result.

**Test cases / proof:** The repository contains a six-test Node suite and the four required scenarios (TC1–TC4), plus JSON/CSV test evidence. Results from synthetic fixtures must be labelled synthetic. For the final review, also show the test run inside the deployed UI and keep a real demo screen recording.

**Not yet provided by this source commit:** deployed demo URL, actual video URL, hosted slide link, team group photo, LinkedIn post URL and screenshot. These require publishing the app and creating genuine evidence; do not enter placeholder links.
