# Solution and agent workflow

CodePulse is a weekly Coding Practice Progress Coach. A student enters a public Codeforces handle (or uses the explicitly labelled synthetic demo), target companies, and weekly hours.

The server retrieves accepted public Codeforces submissions. The browser decision engine deduplicates solved problem records using canonical IDs, counts topics, compares topic gaps, and generates a weekly practice list of specific problems. When the observed Graphs count is zero, Graphs is forced to the first priority. Each suggested problem includes a URL, estimated minutes, and a short reason.

A spoken briefing summarises unique solved count, priority topics, weekly hours, and the progress comparison. The student reviews the proposed list and must confirm an approval dialog before the plan is saved in browser-local storage. The save key is stable for a given profile, week, and problem list, so retrying the same action does not save a duplicate.

A separate verification action checks problem-link formats. For a live Codeforces source, it also calls the profile endpoint again and compares canonical solved-problem IDs, displaying the count difference and any new/removed IDs. When using synthetic data, verification is labelled snapshot-only. If a live refresh fails, the UI shows failure and does not claim that rechecking succeeded.

Private/unreadable profile states do not generate a guessed plan. The agent asks the user to supply a permitted export instead.
