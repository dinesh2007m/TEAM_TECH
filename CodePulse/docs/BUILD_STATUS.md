# Build and publication status

## Source code
The CodePulse application source, Node server, tests, README and deployment configuration are committed to the public TEAM_TECH repository on branch codepulse-agentic-ai-hackathon-2026, under the CodePulse/ folder. The repository main branch has not been changed.

## Local checks
- GitHub Actions workflow added at .github/workflows/codepulse-tests.yml to rerun the Node test suite and syntax checks on CodePulse changes.
- npm test: 6 passed, 0 failed.
- Node syntax checks pass for the server and browser-side JavaScript.
- Four official scenarios are implemented with synthetic fixture evidence.

## Still required before final hackathon submission
1. Deploy the complete Node app to a Node-capable host.
2. Test /api/health and one permitted public Codeforces handle from the deployed URL.
3. Run the four cases in the actual UI and capture the visible evidence.
4. Record and publish a real 2–3 minute demo video.
5. Host the PowerPoint at a reviewer-accessible URL.
6. Upload a real TEAM TECH group photo.
7. Publish a LinkedIn post with the official Ziro.Digital page genuinely tagged and attach the real post URL and screenshot.

Do not claim a public demo is deployed until the host URL has been tested. Network access to external services was not verified by the local test suite.
