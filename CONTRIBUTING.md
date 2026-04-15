# Contributing

Thanks for your interest in contributing! This is an educational project visualizing CPU scheduling algorithms.

## Ways to contribute

- **Bug reports** — open an issue using the bug report template.
- **Feature requests** — open an issue using the feature request template.
- **Pull requests** — small, focused PRs are easiest to review.

## Development setup

This is a static site — no build step required.

```bash
git clone https://github.com/jayhemnani9910/cpu-scheduling-algorithms.git
cd cpu-scheduling-algorithms
# Open index.html in a browser, or serve locally:
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Code style

- Match the existing style in `script.js` and `style.css`.
- Use 4-space indentation in JS, 2-space in HTML/CSS to match current files.
- Keep algorithm logic readable — this is a learning tool.

## Pull request checklist

- [ ] Change is focused on a single issue/feature
- [ ] Tested manually in a browser
- [ ] `tests.js` updated if algorithm logic changed
- [ ] README updated if user-facing behavior changed

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
