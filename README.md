[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-2ea44f?style=for-the-badge)](https://jayhemnani9910.github.io/cpu-scheduling-algorithms/)
[![CI](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/ci.yml/badge.svg)](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/ci.yml)
[![Pages](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/pages.yml/badge.svg)](https://github.com/jayhemnani9910/cpu-scheduling-algorithms/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# CPU Scheduling Algorithms

## Functionalities
- 9 Algorithms are implemented.
- Each process can have different number of CPU Burst Time and I/O Burst Time.
- Gantt Chart and Timeline Chart for the given Schedule.
- Context Switching Time.
- Animation of the Time Log.
- Comparison for Round Robin Algorithm for all time quantum.
- Comparison between all the algorithms wrt Average Completion Time, Turn Around Time, Waiting Time and Response Time.


### Different Criteria and Algorithms
- The first process arrived in the ready queue is processed first.
  - **First Come First Serve (FCFS)**
    >Non-Preemptive
- The shortest job in the ready queue is processed first.
  - **Shortest Job First (SJF)**
    >Non-Preemptive
  - **Shortest Remaining Job First (SRJF)**
    >Preemptive
- The longest job in the ready queue is processed first.
  - **Longest Job First (LJF)**
    >Non-Preemptive
  - **Longest Remaining Job First (LRJF)**
    >Preemptive
- The highest priority job in the ready queue is processed first.
  - **Priority Non-Preemptive (PNP)**
    >Non-Preemptive
  - **Priority Preemptive(PP)**
    >Preemptive
- The jobs in the ready queue are given a fixed time quantum.
  - **Round Robin (RR)**
    >Preemptive
- The job with the highest response ratio in the ready queue is processed first.
  - **Highest Response Ratio Next (HRRN)**
    >Non-Preemptive
    
**Non-Preemptive:**
  Once a job enters the Running Queue, it will only leave when its required CPU Burst Time is completed or it requires an I/O Job.
  
**Preemptive:**
  A job in the Running Queue can be removed (preeempted) by other process of higher priority or with better criteria satisfaction or the given time quantum is completed.
  
#### Different States in CPU Scheduler
- Remain
  >The processes which are yet to arrive.
- Ready
  >The processes which are ready to be executed.
- Running
  >Current Process Running in the CPU.
- Block
  >The processes which are blocked for I/O Time.
- Terminate
  >The processes which have completed all the CPU and I/O.
  
### Technologies Used
- HTML
- CSS
- Vanilla JS
- Google Charts
- Chart.js

## Demo

Try it live: **https://jayhemnani9910.github.io/cpu-scheduling-algorithms/**

<!-- TODO: add a screenshot or GIF of the visualization at docs/screenshot.png and reference it here -->

## Running Tests

```bash
node tests.js
# or
npm test
```

All 9 algorithms have unit tests covering arrival ordering, preemption, tiebreaks, and edge cases.

## Quick Start

No build step — it's a static site.

```bash
git clone https://github.com/jayhemnani9910/cpu-scheduling-algorithms.git
cd cpu-scheduling-algorithms
# Open directly:
open index.html
# Or serve locally:
python3 -m http.server 8000
```

## Architecture

| File | Purpose |
|------|---------|
| `index.html` | UI layout, form inputs, chart containers |
| `style.css` | Styling |
| `script.js` | All scheduling algorithms, state machine, chart rendering |
| `tests.js` | Algorithm correctness tests |

External dependencies (loaded via CDN in `index.html`):
- [Google Charts](https://developers.google.com/chart) — Gantt and timeline charts
- [Chart.js](https://www.chartjs.org/) — comparison bar charts

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Released under the [MIT License](LICENSE).
