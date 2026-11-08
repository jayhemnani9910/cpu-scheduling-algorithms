# Changelog

All notable changes to this project are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- SRTF context-switch test: shorter job preempts with CS=1 (issue #10).
- Demo GIF at the top of the README.
- CHANGELOG.

### Changed

- README rewritten: usage, algorithm table, tie rules, what the tests cover.
- CONTRIBUTING lists the CI checks, PR rules and what to put in a bug report.
- `.gitignore` ignores every `.env*` file except `.env.example`.

## 2026-10-07

### Changed

- Context switches are counted even when the switch time is 0.
- Setup rows wrap on phones.
- The page explains how ties and context switches are handled.

## 2026-10-05

### Changed

- New card layout with light and dark themes that works at phone width. The time log has play, pause, step and a scrubber.
- Scheduling engine and test runner simplified. `script.js` simplified.

### Fixed

- Round Robin no longer adds a context switch when the preempted process is the only one ready.
- Round Robin chart no longer shows -1 context switches when the switch time is 0.
- The time log start button disables after the first click.
- The burst column span uses the widest row.

## 2026-09-11

### Changed

- The scheduling engine moved out of `script.js` into `scheduler.js`, with no DOM code. The tests now run against it instead of their own copy.
- Repo files reorganized. Dependabot watches the npm dev dependencies.

### Fixed

- The ready queue keeps its FIFO order across ticks.
- The Calculate handler is no longer bound again from the time log.
- Process times are deep-copied, so a second run starts from the same input.
- Charts are attached to the page before Google Charts draws them.
- The Jekyll Pages workflow is back and the broken one is gone.

## 2026-08-29

### Fixed

- HRRN ranks by total burst time, so it picks correctly after IO.
- Time log snapshots are compared by value, not by reference.
- The time log cancel handler is bound before the first tick.
- An unclosed list in the priority settings.
- ESLint 9 flat config, so `npm run lint` actually lints.
- HTML lint failures fail the build.

### Changed

- The algorithms are named SRTF and LRTF, as in the app.

## 2026-04-15

### Added

- Tests for the scheduling algorithms, CI, issue and PR templates, CONTRIBUTING and SECURITY.

## 2025-12-18

### Added

- First version: 9 scheduling algorithms, multiple CPU and IO bursts per process, Gantt and timeline charts, context switch time, an animated time log, a Round Robin comparison across time quanta and a comparison of all algorithms.
- GitHub Pages deployment.
