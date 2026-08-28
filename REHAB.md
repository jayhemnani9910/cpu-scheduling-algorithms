# Rehab notes

## Safe run command
`node tests.js`

Static site, no build step. The command is pure JavaScript and touches nothing outside
the repo.

Important: `tests.js` does NOT load `script.js`. It carries its own hand-copied duplicate
of the scheduling logic, edited separately and marked in places with "BUGFIX" comments.
So this command exercises the copy inside `tests.js`, not the code the page actually
ships. A green run here is not evidence that `script.js` is correct.

## What success looks like
Exits 0 and prints a pass line per test, ending with
"Total: 19  |  Passed: 19  |  Failed: 0 -- All tests passed!".
Remember that this only covers the duplicate in `tests.js`.

## Test command
`npm test` (which is `node tests.js`)

## Do not run
- `python3 -m http.server 8000` and `open index.html` from the README Quick Start.
  Both block, and neither exercises the algorithms.
- Anything in `.github/workflows/pages.yml`. It deploys to GitHub Pages.
- `npm publish`, `git push`, and any `gh` command that writes.

## Needs credentials
None. The project is a static page and its tests are pure JavaScript.

## Known broken, leave alone
Nothing recorded.
