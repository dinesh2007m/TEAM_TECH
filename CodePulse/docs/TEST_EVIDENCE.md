# Official test cases and evidence

The fixtures are synthetic and do not describe a real student.

| ID | Scenario | Expected result | Local automated result |
|---|---|---|---|
| TC1 | Public profile shows zero Graphs problems | Graphs is first in the plan | PASS |
| TC2 | Profile is private | Ask for an export; do not guess | PASS |
| TC3 | Same problem appears on two platforms with the same canonical ID | Count once | PASS |
| TC4 | Current and previous solved IDs are unchanged | No false progress claim | PASS |

The test evidence is also available in ../data/official-test-evidence.json and ../data/official-test-evidence.csv.

## Reproduce locally
Use Node.js 18 or later.

    npm test

The local test run for this source package reported 6 passed, 0 failed. The six checks cover the four official cases, stable canonical IDs, and the combined official-scenario assertions.

## Live evidence caveat
Automated fixture results do not prove that a public profile was retrieved. For a live demonstration, select Public Codeforces profile, enter a permitted public handle, run the coach, approve the proposed list, and run verification. If external access fails, show the failure state and use the synthetic fixture only as a clearly labelled logic demonstration.
