# CPU Scheduling Algorithms

![Entering four processes, running Round Robin, then the time log and the algorithm comparison](docs/demo.gif)

Enter processes and watch 9 CPU scheduling algorithms run them step by step, in the browser.

```bash
git clone https://github.com/jayhemnani9910/cpu-scheduling-algorithms.git && cd cpu-scheduling-algorithms && python3 -m http.server 8000
```

Then open http://localhost:8000. Or use the live page: https://jayhemnani9910.github.io/cpu-scheduling-algorithms/

[![CI](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Usage

1. Pick an algorithm. Set the time quantum for Round Robin, or the priority order for the priority algorithms.
2. Set a context switch time if you want one. It defaults to 0.
3. Add processes. Each one has an arrival time and a list of bursts: CPU, then IO, then CPU, and so on. Use `+ IO` to add an IO burst and a CPU burst.
4. Press Calculate.

You get:

- Averages for turnaround, waiting, response and completion time, plus CPU utilization and throughput.
- A Gantt chart, with context switches (CS) and idle time marked.
- A timeline of when each process held the CPU.
- A table of per-process times.
- A time log you can play or step through. It shows each process moving between Not arrived, Ready, Running, Blocked (IO) and Done.
- Round Robin averages for every time quantum up to the longest CPU burst.
- The same processes run under all 9 algorithms, side by side.

## Algorithms

| Algorithm                            | Picks                            | Preemptive |
| ------------------------------------ | -------------------------------- | ---------- |
| First Come First Serve (FCFS)        | earliest arrival                 | no         |
| Shortest Job First (SJF)             | shortest burst                   | no         |
| Shortest Remaining Time First (SRTF) | shortest remaining burst         | yes        |
| Longest Job First (LJF)              | longest burst                    | no         |
| Longest Remaining Time First (LRTF)  | longest remaining burst          | yes        |
| Priority Non-Preemptive (PNP)        | highest priority                 | no         |
| Priority Preemptive (PP)             | highest priority                 | yes        |
| Round Robin (RR)                     | next in queue, for a fixed slice | yes        |
| Highest Response Ratio Next (HRRN)   | highest response ratio           | no         |

A non-preemptive process keeps the CPU until its CPU burst ends or it goes to IO. A preemptive one can be pushed off by a better candidate, or by the end of its time quantum.

Rules the engine follows:

- Ties go to the lower process ID. In preemptive mode a tie preempts the running process.
- Burst-based algorithms compare the total CPU burst time.
- Waiting time is turnaround minus CPU time, so time spent in IO counts as waiting.
- In preemptive mode the next process is chosen before the context switch starts.
- No context switch is counted at the very start or the end.

## How it works

It's a static page with no build step. `scheduler.js` is the engine: all 9 algorithms and the state machine, with no DOM code. It steps time one unit at a time and records the schedule and a time log. `script.js` reads the form, runs the engine, and draws the results with Google Charts (Gantt and timeline) and Chart.js (the comparison charts). Both chart libraries load from a CDN.

| File                      | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `index.html`              | Layout, form inputs, chart containers                     |
| `style.css`               | Styling                                                   |
| `scheduler.js`            | Scheduling engine                                         |
| `script.js`               | UI: form, tables, charts, time log                        |
| `tests/scheduler.test.js` | Algorithm tests, run against `scheduler.js`               |
| `browse.json`             | Click steps for a headless browser smoke test of the page |

## Tests

```bash
npm install
npm test
```

There are 24 tests. They load `scheduler.js`, the same file the page ships, and check completion, turnaround, waiting and response times, plus the context switch count in some cases. They cover all 9 algorithms, arrival order, preemption, ties and context switch time. No test uses an IO burst yet, and `script.js` has no unit tests.

`npm run lint`, `npm run format:check` and `npx htmlhint index.html` run in CI next to the tests.

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) and the [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
