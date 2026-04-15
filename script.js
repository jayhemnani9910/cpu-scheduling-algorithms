/**
 * CPU Scheduling Algorithms Simulator
 * Complete rewrite with bug fixes, modular architecture, and modern UI
 */

// ============================================================
// SECTION 1: DATA CLASSES
// ============================================================

class Input {
    constructor() {
        this.processId = [];
        this.priority = [];
        this.arrivalTime = [];
        this.processTime = [];      // [[cpu, io, cpu, ...], ...]
        this.processTimeLength = [];
        this.totalBurstTime = [];
        this.algorithm = "";
        this.algorithmType = "";
        this.timeQuantum = 0;
        this.contextSwitch = 0;
    }
}

class Utility {
    constructor() {
        this.remainingProcessTime = [];
        this.remainingBurstTime = [];
        this.remainingTimeRunning = [];
        this.currentProcessIndex = [];
        this.start = [];
        this.done = [];
        this.returnTime = [];
        this.currentTime = 0;
    }
}

class Output {
    constructor() {
        this.completionTime = [];
        this.turnAroundTime = [];
        this.waitingTime = [];
        this.responseTime = [];
        this.schedule = [];
        this.timeLog = [];
        this.contextSwitches = 0;
        this.averageTimes = []; // [avgCT, avgTAT, avgWT, avgRT]
    }
}

class TimeLog {
    constructor() {
        this.time = -1;
        this.remain = [];
        this.ready = [];
        this.running = [];
        this.block = [];
        this.terminate = [];
        this.move = [];
    }
}

// ============================================================
// SECTION 2: ALGORITHM INFO DATABASE
// ============================================================

const ALGORITHM_INFO = {
    fcfs: {
        name: "First Come First Serve (FCFS)",
        desc: "The simplest scheduling algorithm. Processes are executed in the order they arrive in the ready queue. No preemption occurs — once a process starts, it runs to completion.",
        complexity: "O(n log n)",
        pros: "Simple, fair, no starvation",
        cons: "Convoy effect, high average waiting time"
    },
    sjf: {
        name: "Shortest Job First (SJF)",
        desc: "Selects the process with the smallest total burst time from the ready queue. Non-preemptive — once a process starts, it completes before another is selected.",
        complexity: "O(n log n)",
        pros: "Minimum average waiting time (non-preemptive)",
        cons: "Starvation of long processes, requires burst time prediction"
    },
    srtf: {
        name: "Shortest Remaining Time First (SRTF)",
        desc: "Preemptive version of SJF. If a new process arrives with a shorter remaining burst time than the currently running process, the CPU is preempted.",
        complexity: "O(n² · T)",
        pros: "Optimal average waiting time",
        cons: "High overhead, starvation possible"
    },
    ljf: {
        name: "Longest Job First (LJF)",
        desc: "Opposite of SJF. Selects the process with the longest total burst time. Non-preemptive variant.",
        complexity: "O(n log n)",
        pros: "Large processes get priority",
        cons: "High average waiting time, starvation of short processes"
    },
    lrtf: {
        name: "Longest Remaining Time First (LRTF)",
        desc: "Preemptive version of LJF. The process with the longest remaining burst time is always given the CPU.",
        complexity: "O(n² · T)",
        pros: "Large processes never starve",
        cons: "Very high average waiting time"
    },
    rr: {
        name: "Round Robin (RR)",
        desc: "Each process gets a fixed time quantum. After the quantum expires, the process is preempted and moved to the back of the ready queue. Fair CPU sharing.",
        complexity: "O(n · T/q)",
        pros: "Fair, no starvation, good response time",
        cons: "Performance depends on time quantum, higher context switch overhead"
    },
    pnp: {
        name: "Priority (Non-Preemptive)",
        desc: "Each process is assigned a priority. The process with the highest priority in the ready queue is selected next. Non-preemptive — runs to completion.",
        complexity: "O(n log n)",
        pros: "Important processes handled first",
        cons: "Starvation of low-priority processes"
    },
    pp: {
        name: "Priority (Preemptive)",
        desc: "Preemptive version of priority scheduling. If a higher priority process arrives, it preempts the currently running process immediately.",
        complexity: "O(n² · T)",
        pros: "Most critical processes run first",
        cons: "Starvation, high overhead"
    },
    hrrn: {
        name: "Highest Response Ratio Next (HRRN)",
        desc: "Non-preemptive algorithm that calculates response ratio = (W + S) / S for each process, where W is waiting time and S is burst time. Favors both short and long-waiting processes.",
        complexity: "O(n²)",
        pros: "No starvation, balances short and long jobs",
        cons: "Overhead of computing response ratios"
    }
};

// ============================================================
// SECTION 3: PRESETS
// ============================================================

const PRESETS = [
    {
        name: "Textbook FCFS",
        desc: "3 processes, staggered",
        processes: [
            { at: 0, bt: [4], priority: 1 },
            { at: 1, bt: [3], priority: 1 },
            { at: 2, bt: [1], priority: 1 }
        ]
    },
    {
        name: "SJF Classic",
        desc: "4 processes at t=0",
        processes: [
            { at: 0, bt: [6], priority: 1 },
            { at: 0, bt: [8], priority: 1 },
            { at: 0, bt: [7], priority: 1 },
            { at: 0, bt: [3], priority: 1 }
        ]
    },
    {
        name: "SRTF Preemption",
        desc: "Demonstrates preemption",
        processes: [
            { at: 0, bt: [8], priority: 1 },
            { at: 1, bt: [4], priority: 1 },
            { at: 2, bt: [9], priority: 1 },
            { at: 3, bt: [5], priority: 1 }
        ]
    },
    {
        name: "Round Robin Demo",
        desc: "TQ=2, 4 processes",
        processes: [
            { at: 0, bt: [5], priority: 1 },
            { at: 0, bt: [4], priority: 1 },
            { at: 0, bt: [2], priority: 1 },
            { at: 0, bt: [1], priority: 1 }
        ],
        timeQuantum: 2
    },
    {
        name: "Priority Test",
        desc: "3 processes, different priorities",
        processes: [
            { at: 0, bt: [4], priority: 2 },
            { at: 0, bt: [3], priority: 1 },
            { at: 0, bt: [5], priority: 3 }
        ]
    },
    {
        name: "I/O Burst",
        desc: "CPU-IO-CPU pattern",
        processes: [
            { at: 0, bt: [3, 2, 2], priority: 1 },
            { at: 1, bt: [2, 1, 3], priority: 1 },
            { at: 2, bt: [4], priority: 1 }
        ]
    },
    {
        name: "Heavy Load",
        desc: "6 processes, mixed arrivals",
        processes: [
            { at: 0, bt: [5], priority: 3 },
            { at: 1, bt: [3], priority: 1 },
            { at: 2, bt: [8], priority: 2 },
            { at: 3, bt: [2], priority: 4 },
            { at: 4, bt: [4], priority: 2 },
            { at: 5, bt: [6], priority: 1 }
        ]
    },
    {
        name: "Context Switch",
        desc: "CS=1, 3 processes",
        processes: [
            { at: 0, bt: [3], priority: 1 },
            { at: 1, bt: [5], priority: 1 },
            { at: 2, bt: [2], priority: 1 }
        ],
        contextSwitch: 1
    }
];

// ============================================================
// SECTION 4: STATE MANAGEMENT
// ============================================================

let processCount = 0;
let priorityPreference = 1; // 1 = lower number is higher, -1 = higher number is higher

function getSelectedAlgorithm() {
    const checked = document.querySelector('input[name="algo"]:checked');
    return checked ? checked.value : 'fcfs';
}

// ============================================================
// SECTION 5: UI - PROCESS TABLE
// ============================================================

function createProcessRow(pid, arrivalTime = 0, burstTimes = [1], priority = 1) {
    const tr = document.createElement('tr');
    tr.dataset.pid = pid;

    // Build burst cells
    let burstHTML = '';
    burstTimes.forEach((bt, idx) => {
        const type = idx % 2 === 0 ? 'cpu' : 'io';
        const label = idx % 2 === 0 ? 'CPU' : 'IO';
        burstHTML += `
            <div class="burst-cell">
                <span class="burst-label ${type}">${label}</span>
                <input type="number" min="1" step="1" value="${bt}" class="burst-input" data-type="${type}">
            </div>`;
    });

    const algo = getSelectedAlgorithm();
    const showPriority = algo === 'pnp' || algo === 'pp';

    tr.innerHTML = `
        <td class="pid-cell">P${pid}</td>
        <td class="priority-col ${showPriority ? '' : 'hide'}">
            <input type="number" min="1" step="1" value="${priority}" class="priority-input">
        </td>
        <td>
            <input type="number" min="0" step="1" value="${arrivalTime}" class="arrival-input">
        </td>
        <td class="burst-times-cell">
            ${burstHTML}
        </td>
        <td>
            <div class="row-actions">
                <button type="button" class="row-action-btn add-burst-btn" title="Add IO+CPU burst">+</button>
                <button type="button" class="row-action-btn danger remove-burst-btn" title="Remove last burst pair">−</button>
            </div>
        </td>`;

    // Add burst pair
    tr.querySelector('.add-burst-btn').addEventListener('click', () => {
        const cell = tr.querySelector('.burst-times-cell');
        const ioDiv = document.createElement('div');
        ioDiv.className = 'burst-cell';
        ioDiv.innerHTML = `<span class="burst-label io">IO</span><input type="number" min="1" step="1" value="1" class="burst-input" data-type="io">`;
        cell.appendChild(ioDiv);
        const cpuDiv = document.createElement('div');
        cpuDiv.className = 'burst-cell';
        cpuDiv.innerHTML = `<span class="burst-label cpu">CPU</span><input type="number" min="1" step="1" value="1" class="burst-input" data-type="cpu">`;
        cell.appendChild(cpuDiv);
    });

    // Remove burst pair
    tr.querySelector('.remove-burst-btn').addEventListener('click', () => {
        const cell = tr.querySelector('.burst-times-cell');
        const children = cell.querySelectorAll('.burst-cell');
        if (children.length > 1) {
            children[children.length - 1].remove();
            if (cell.querySelectorAll('.burst-cell').length > 1) {
                cell.querySelectorAll('.burst-cell')[cell.querySelectorAll('.burst-cell').length - 1].remove();
            }
        }
    });

    return tr;
}

function addProcess(arrivalTime = 0, burstTimes = [1], priority = 1) {
    processCount++;
    const tbody = document.getElementById('process-table-body');
    tbody.appendChild(createProcessRow(processCount, arrivalTime, burstTimes, priority));
}

function removeProcess() {
    const tbody = document.getElementById('process-table-body');
    if (tbody.children.length > 1) {
        tbody.removeChild(tbody.lastElementChild);
        processCount--;
    }
}

function clearProcesses() {
    processCount = 0;
    document.getElementById('process-table-body').innerHTML = '';
}

function loadPreset(preset) {
    clearProcesses();
    preset.processes.forEach(p => {
        addProcess(p.at, p.bt, p.priority || 1);
    });
    if (preset.timeQuantum) {
        document.getElementById('tq').value = preset.timeQuantum;
    }
    if (preset.contextSwitch !== undefined) {
        document.getElementById('context-switch').value = preset.contextSwitch;
    }
    showToast(`Loaded preset: ${preset.name}`, 'success');
}

// ============================================================
// SECTION 6: UI - ALGORITHM PANEL & CONFIG
// ============================================================

function updateAlgoUI() {
    const algo = getSelectedAlgorithm();

    // Time quantum
    const tqField = document.getElementById('tq-field');
    if (algo === 'rr') {
        tqField.classList.remove('hide');
    } else {
        tqField.classList.add('hide');
    }

    // Priority
    const priorityContainer = document.getElementById('priority-container');
    const priorityCols = document.querySelectorAll('.priority-col');
    if (algo === 'pnp' || algo === 'pp') {
        priorityContainer.classList.remove('hide');
        priorityCols.forEach(el => el.classList.remove('hide'));
    } else {
        priorityContainer.classList.add('hide');
        priorityCols.forEach(el => el.classList.add('hide'));
    }

    // Info panel
    const info = ALGORITHM_INFO[algo];
    const panel = document.getElementById('algo-info-panel');
    document.getElementById('algo-info-title').textContent = info.name;
    document.getElementById('algo-info-desc').textContent = info.desc;
    document.getElementById('algo-info-complexity').textContent = `Time: ${info.complexity}`;
    panel.classList.add('visible');
}

function initPresets() {
    const grid = document.getElementById('presets-grid');
    PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerHTML = `<span class="preset-name">${preset.name}</span><span class="preset-desc">${preset.desc}</span>`;
        btn.addEventListener('click', () => loadPreset(preset));
        grid.appendChild(btn);
    });
}

// ============================================================
// SECTION 7: INPUT COLLECTION & VALIDATION
// ============================================================

function setAlgorithmNameType(input, algorithm) {
    input.algorithm = algorithm;
    switch (algorithm) {
        case 'fcfs': case 'sjf': case 'ljf': case 'pnp': case 'hrrn':
            input.algorithmType = "nonpreemptive"; break;
        case 'srtf': case 'lrtf': case 'pp':
            input.algorithmType = "preemptive"; break;
        case 'rr':
            input.algorithmType = "roundrobin"; break;
    }
}

function collectInput() {
    const input = new Input();
    const rows = document.querySelectorAll('#process-table-body tr');
    let valid = true;

    rows.forEach((row, i) => {
        input.processId.push(i);
        const at = Number(row.querySelector('.arrival-input').value);
        const priorityInput = row.querySelector('.priority-input');
        const pr = priorityInput ? Number(priorityInput.value) : 1;

        if (isNaN(at) || at < 0) {
            row.querySelector('.arrival-input').classList.add('invalid');
            valid = false;
        } else {
            row.querySelector('.arrival-input').classList.remove('invalid');
        }

        input.arrivalTime.push(Math.max(0, Math.round(at)));
        input.priority.push(Math.max(1, Math.round(pr)));

        const burstInputs = row.querySelectorAll('.burst-input');
        const pt = [];
        burstInputs.forEach(bi => {
            const val = Number(bi.value);
            if (isNaN(val) || val < 1) {
                bi.classList.add('invalid');
                valid = false;
            } else {
                bi.classList.remove('invalid');
            }
            pt.push(Math.max(1, Math.round(val)));
        });
        input.processTime.push(pt);
        input.processTimeLength.push(pt.length);
    });

    if (!valid) {
        showToast('Please fix invalid input values (highlighted in red)', 'error');
        return null;
    }

    // total burst time
    const n = input.processId.length;
    input.totalBurstTime = new Array(n).fill(0);
    input.processTime.forEach((e1, i) => {
        e1.forEach((e2, j) => {
            if (j % 2 === 0) {
                input.totalBurstTime[i] += e2;
            }
        });
    });

    setAlgorithmNameType(input, getSelectedAlgorithm());
    input.contextSwitch = Math.max(0, Math.round(Number(document.getElementById('context-switch').value)));
    input.timeQuantum = Math.max(1, Math.round(Number(document.getElementById('tq').value)));
    return input;
}

function setUtility(input, utility) {
    const n = input.processId.length;
    // BUGFIX: Deep copy processTime arrays
    utility.remainingProcessTime = input.processTime.map(arr => [...arr]);
    utility.remainingBurstTime = input.totalBurstTime.slice();
    utility.remainingTimeRunning = new Array(n).fill(0);
    utility.currentProcessIndex = new Array(n).fill(0);
    utility.start = new Array(n).fill(false);
    utility.done = new Array(n).fill(false);
    utility.returnTime = input.arrivalTime.slice();
}

// ============================================================
// SECTION 8: CPU SCHEDULER (CORE LOGIC WITH BUG FIXES)
// ============================================================

function CPUScheduler(input, utility, output) {
    const n = input.processId.length;

    function moveElement(value, from, to) {
        let index = from.indexOf(value);
        if (index !== -1) from.splice(index, 1);
        if (to.indexOf(value) === -1) to.push(value);
    }

    function updateReadyQueue(currentTimeLog) {
        let candidatesRemain = currentTimeLog.remain.filter(e => input.arrivalTime[e] <= currentTimeLog.time);
        let candidatesBlock = currentTimeLog.block.filter(e => utility.returnTime[e] <= currentTimeLog.time);
        if (candidatesRemain.length > 0) currentTimeLog.move.push(0);
        if (candidatesBlock.length > 0) currentTimeLog.move.push(5);
        let candidates = candidatesRemain.concat(candidatesBlock);
        candidates.sort((a, b) => utility.returnTime[a] - utility.returnTime[b]);
        candidates.forEach(element => {
            moveElement(element, currentTimeLog.remain, currentTimeLog.ready);
            moveElement(element, currentTimeLog.block, currentTimeLog.ready);
        });
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
        currentTimeLog.move = [];
    }

    let currentTimeLog = new TimeLog();
    // BUGFIX: Copy processId array instead of referencing
    currentTimeLog.remain = input.processId.slice();
    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    currentTimeLog.move = [];
    currentTimeLog.time++;
    let lastFound = -1;

    // Safety: prevent infinite loop
    let maxIterations = 100000;
    let iter = 0;

    while (utility.done.some(e => e === false)) {
        if (++iter > maxIterations) {
            console.error("Scheduler exceeded maximum iterations — aborting.");
            break;
        }

        updateReadyQueue(currentTimeLog);
        let found = -1;

        if (currentTimeLog.running.length === 1) {
            found = currentTimeLog.running[0];
        } else if (currentTimeLog.ready.length > 0) {
            if (input.algorithm === 'rr') {
                found = currentTimeLog.ready[0];
                utility.remainingTimeRunning[found] = Math.min(
                    utility.remainingProcessTime[found][utility.currentProcessIndex[found]],
                    input.timeQuantum
                );
            } else {
                // BUGFIX: Don't sort the actual ready queue — copy it
                let candidates = [...currentTimeLog.ready];
                candidates.sort((a, b) => a - b); // Tiebreak by PID
                candidates.sort((a, b) => {
                    switch (input.algorithm) {
                        case 'fcfs':
                            return utility.returnTime[a] - utility.returnTime[b];
                        case 'sjf': case 'srtf':
                            return utility.remainingBurstTime[a] - utility.remainingBurstTime[b];
                        case 'ljf': case 'lrtf':
                            return utility.remainingBurstTime[b] - utility.remainingBurstTime[a];
                        case 'pnp': case 'pp':
                            return priorityPreference * (input.priority[a] - input.priority[b]);
                        case 'hrrn': {
                            // BUGFIX: Use total burst time for response ratio
                            const responseRatio = (id) => {
                                let s = input.totalBurstTime[id];
                                let w = currentTimeLog.time - input.arrivalTime[id];
                                return (w + s) / s;
                            };
                            return responseRatio(b) - responseRatio(a);
                        }
                    }
                });
                found = candidates[0];

                // Context switch for preemptive when process changes
                if (input.algorithmType === "preemptive" && found >= 0 && lastFound >= 0 && found !== lastFound) {
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) output.contextSwitches++;
                }
            }

            moveElement(found, currentTimeLog.ready, currentTimeLog.running);
            currentTimeLog.move.push(1);
            output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
            currentTimeLog.move = [];

            if (utility.start[found] === false) {
                utility.start[found] = true;
                output.responseTime[found] = currentTimeLog.time - input.arrivalTime[found];
            }
        }

        currentTimeLog.time++;

        if (found !== -1) {
            output.schedule.push([found + 1, 1]);
            utility.remainingProcessTime[found][utility.currentProcessIndex[found]]--;
            utility.remainingBurstTime[found]--;

            if (input.algorithm === 'rr') {
                utility.remainingTimeRunning[found]--;
                if (utility.remainingTimeRunning[found] === 0) {
                    if (utility.remainingProcessTime[found][utility.currentProcessIndex[found]] === 0) {
                        utility.currentProcessIndex[found]++;
                        if (utility.currentProcessIndex[found] === input.processTimeLength[found]) {
                            utility.done[found] = true;
                            output.completionTime[found] = currentTimeLog.time;
                            moveElement(found, currentTimeLog.running, currentTimeLog.terminate);
                            currentTimeLog.move.push(2);
                        } else {
                            utility.returnTime[found] = currentTimeLog.time + input.processTime[found][utility.currentProcessIndex[found]];
                            utility.currentProcessIndex[found]++;
                            moveElement(found, currentTimeLog.running, currentTimeLog.block);
                            currentTimeLog.move.push(4);
                        }
                        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                        currentTimeLog.move = [];
                        updateReadyQueue(currentTimeLog);
                    } else {
                        updateReadyQueue(currentTimeLog);
                        moveElement(found, currentTimeLog.running, currentTimeLog.ready);
                        currentTimeLog.move.push(3);
                        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                        currentTimeLog.move = [];
                    }
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) output.contextSwitches++;
                }
            } else {
                if (utility.remainingProcessTime[found][utility.currentProcessIndex[found]] === 0) {
                    utility.currentProcessIndex[found]++;
                    if (utility.currentProcessIndex[found] === input.processTimeLength[found]) {
                        utility.done[found] = true;
                        output.completionTime[found] = currentTimeLog.time;
                        moveElement(found, currentTimeLog.running, currentTimeLog.terminate);
                        currentTimeLog.move.push(2);
                    } else {
                        utility.returnTime[found] = currentTimeLog.time + input.processTime[found][utility.currentProcessIndex[found]];
                        utility.currentProcessIndex[found]++;
                        moveElement(found, currentTimeLog.running, currentTimeLog.block);
                        currentTimeLog.move.push(4);
                    }
                    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                    currentTimeLog.move = [];
                    if (currentTimeLog.running.length === 0) {
                        output.schedule.push([-2, input.contextSwitch]);
                        for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                            updateReadyQueue(currentTimeLog);
                        }
                        if (input.contextSwitch > 0) output.contextSwitches++;
                    }
                    lastFound = -1;
                } else if (input.algorithmType === "preemptive") {
                    moveElement(found, currentTimeLog.running, currentTimeLog.ready);
                    currentTimeLog.move.push(3);
                    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                    currentTimeLog.move = [];
                    lastFound = found;
                }
            }
        } else {
            output.schedule.push([-1, 1]);
            lastFound = -1;
        }
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    }
    if (output.schedule.length > 0) output.schedule.pop();
}

// ============================================================
// SECTION 9: OUTPUT PROCESSING
// ============================================================

function reduceSchedule(schedule) {
    if (!schedule || schedule.length === 0) return [];
    let newSchedule = [];
    let cur = schedule[0][0], len = schedule[0][1];
    for (let i = 1; i < schedule.length; i++) {
        if (schedule[i][0] === cur) {
            len += schedule[i][1];
        } else {
            newSchedule.push([cur, len]);
            cur = schedule[i][0];
            len = schedule[i][1];
        }
    }
    newSchedule.push([cur, len]);
    return newSchedule;
}

function setOutput(input, output) {
    const n = input.processId.length;
    for (let i = 0; i < n; i++) {
        output.turnAroundTime[i] = output.completionTime[i] - input.arrivalTime[i];
        output.waitingTime[i] = output.turnAroundTime[i] - input.totalBurstTime[i];
    }
    output.schedule = reduceSchedule(output.schedule);

    let avgct = 0, avgtat = 0, avgwt = 0, avgrt = 0;
    output.completionTime.forEach(e => avgct += e);
    output.turnAroundTime.forEach(e => avgtat += e);
    output.waitingTime.forEach(e => avgwt += e);
    output.responseTime.forEach(e => avgrt += e);
    output.averageTimes = [avgct / n, avgtat / n, avgwt / n, avgrt / n];
}

// ============================================================
// SECTION 10: RENDERING - GANTT CHART (Custom HTML/CSS)
// ============================================================

const PROCESS_COLORS = [
    '#6366f1', '#34d399', '#fbbf24', '#f87171', '#38bdf8',
    '#a78bfa', '#fb923c', '#2dd4bf', '#f472b6', '#a3e635'
];

function renderGanttChart(output) {
    const container = document.createElement('div');

    // Gantt blocks
    const ganttChart = document.createElement('div');
    ganttChart.className = 'gantt-chart';
    let time = 0;

    output.schedule.forEach(([proc, dur]) => {
        if (proc === -2 && dur === 0) return; // Skip 0-duration context switches
        const block = document.createElement('div');
        block.className = 'gantt-block';
        block.style.minWidth = Math.max(35, dur * 35) + 'px';

        if (proc === -2) {
            block.classList.add('cs');
            block.innerHTML = `<span class="gantt-label">CS</span>`;
        } else if (proc === -1) {
            block.classList.add('idle');
            block.innerHTML = `<span class="gantt-label">—</span>`;
        } else {
            const pIdx = proc - 1;
            block.classList.add('process', `p${proc}`);
            block.innerHTML = `<span class="gantt-label">P${proc}</span><span class="gantt-time">${dur}u</span>`;
        }

        block.title = `${proc > 0 ? 'P' + proc : (proc === -1 ? 'Idle' : 'Context Switch')}: ${time} → ${time + dur}`;
        ganttChart.appendChild(block);
        time += dur;
    });

    container.appendChild(ganttChart);

    // Time axis
    const timeAxis = document.createElement('div');
    timeAxis.className = 'gantt-time-axis';
    time = 0;
    output.schedule.forEach(([proc, dur]) => {
        if (proc === -2 && dur === 0) return; // Skip 0-duration CS
        const mark = document.createElement('span');
        mark.className = 'gantt-time-mark';
        mark.style.minWidth = Math.max(35, dur * 35) + 'px';
        mark.textContent = time;
        timeAxis.appendChild(mark);
        time += dur;
    });
    // Final mark
    const lastMark = document.createElement('span');
    lastMark.className = 'gantt-time-mark';
    lastMark.textContent = time;
    lastMark.style.minWidth = '20px';
    timeAxis.appendChild(lastMark);
    container.appendChild(timeAxis);

    return container;
}

// ============================================================
// SECTION 11: RENDERING - FINAL TABLE
// ============================================================

function renderFinalTable(input, output) {
    const n = input.processId.length;
    const table = document.createElement('table');
    table.className = 'final-table';

    // Head
    const thead = table.createTHead();
    const headRow = thead.insertRow();
    ['Process', 'Arrival', 'Burst', 'Completion', 'Turnaround', 'Waiting', 'Response'].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
    });

    // Body
    const tbody = table.createTBody();
    for (let i = 0; i < n; i++) {
        const row = tbody.insertRow();
        [
            `P${i + 1}`,
            input.arrivalTime[i],
            input.totalBurstTime[i],
            output.completionTime[i],
            output.turnAroundTime[i],
            output.waitingTime[i],
            output.responseTime[i]
        ].forEach((val, idx) => {
            const cell = row.insertCell();
            cell.textContent = val;
            if (idx === 0) cell.style.fontWeight = '600';
        });
    }

    // Footer (averages)
    const tfoot = table.createTFoot();
    const footRow = tfoot.insertRow();
    ['Average', '', ''].forEach(val => {
        const cell = footRow.insertCell();
        cell.textContent = val;
    });
    output.averageTimes.forEach(avg => {
        const cell = footRow.insertCell();
        cell.textContent = avg.toFixed(2);
    });

    return table;
}

// ============================================================
// SECTION 12: RENDERING - STATS CARDS
// ============================================================

function renderStatsCards(input, output) {
    const n = input.processId.length;
    const container = document.createElement('div');
    container.className = 'stats-grid';

    // CPU Utilization
    let tbt = 0;
    input.totalBurstTime.forEach(e => tbt += e);
    let lastct = 0;
    output.completionTime.forEach(e => lastct = Math.max(lastct, e));
    const cpuUtil = ((tbt / lastct) * 100).toFixed(1);

    // Throughput
    const throughput = (n / lastct).toFixed(4);

    const stats = [
        { label: 'CPU Utilization', value: cpuUtil, unit: '%' },
        { label: 'Throughput', value: throughput, unit: 'proc/unit' },
        { label: 'Avg Turnaround', value: output.averageTimes[1].toFixed(2), unit: 'units' },
        { label: 'Avg Waiting', value: output.averageTimes[2].toFixed(2), unit: 'units' },
        { label: 'Avg Response', value: output.averageTimes[3].toFixed(2), unit: 'units' },
    ];

    if (input.contextSwitch > 0) {
        stats.push({ label: 'Context Switches', value: Math.max(0, output.contextSwitches - 1), unit: '' });
    }

    stats.forEach(s => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-unit">${s.unit}</div>`;
        container.appendChild(card);
    });

    return container;
}

// ============================================================
// SECTION 13: RENDERING - TIME LOG ANIMATION
// ============================================================

function renderTimeLog(output) {
    const container = document.createElement('div');
    container.className = 'timelog-container';

    // Reduce duplicates: only keep logs where state changed
    const timeLog = [];
    let prevJson = '';
    output.timeLog.forEach(tl => {
        const key = JSON.stringify({ t: tl.time, rm: tl.remain, rd: tl.ready, ru: tl.running, b: tl.block, te: tl.terminate });
        if (key !== prevJson) {
            timeLog.push(tl);
            prevJson = key;
        }
    });

    // Controls
    const controls = document.createElement('div');
    controls.className = 'timelog-controls';
    controls.innerHTML = `
        <button class="btn btn-primary" id="tl-play">▶ Play</button>
        <button class="btn btn-secondary" id="tl-pause" disabled>⏸ Pause</button>
        <button class="btn btn-secondary" id="tl-step" title="Step forward">⏭ Step</button>
        <button class="btn btn-ghost" id="tl-reset">↻</button>
        <span class="timelog-time" id="tl-time">Time: -</span>
        <div class="timelog-speed">
            Speed:
            <select id="tl-speed">
                <option value="1500">0.5x</option>
                <option value="1000" selected>1x</option>
                <option value="500">2x</option>
                <option value="250">4x</option>
            </select>
        </div>`;
    container.appendChild(controls);

    // State display
    const states = document.createElement('div');
    states.className = 'timelog-states';
    ['remain', 'ready', 'running', 'block', 'terminate'].forEach(state => {
        const div = document.createElement('div');
        div.className = 'timelog-state';
        div.innerHTML = `
            <div class="timelog-state-header ${state}">${state.charAt(0).toUpperCase() + state.slice(1)}</div>
            <div class="timelog-state-body" id="tl-${state}"></div>`;
        states.appendChild(div);
    });
    container.appendChild(states);

    // Setup after append
    setTimeout(() => {
        let index = 0;
        let interval = null;

        function renderStep(i) {
            if (i >= timeLog.length) return;
            const tl = timeLog[i];
            document.getElementById('tl-time').textContent = `Time: ${tl.time}`;
            ['remain', 'ready', 'running', 'block', 'terminate'].forEach(state => {
                const el = document.getElementById(`tl-${state}`);
                el.innerHTML = tl[state].map(p =>
                    `<span class="timelog-process-tag${tl.move && tl.move.length > 0 ? ' highlight' : ''}">P${p + 1}</span>`
                ).join('');
            });
        }

        function getSpeed() {
            return parseInt(document.getElementById('tl-speed').value);
        }

        const playBtn = document.getElementById('tl-play');
        const pauseBtn = document.getElementById('tl-pause');
        const stepBtn = document.getElementById('tl-step');
        const resetBtn = document.getElementById('tl-reset');

        playBtn.addEventListener('click', () => {
            if (interval) return;
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            interval = setInterval(() => {
                if (index >= timeLog.length) {
                    clearInterval(interval);
                    interval = null;
                    playBtn.disabled = false;
                    pauseBtn.disabled = true;
                    return;
                }
                renderStep(index++);
            }, getSpeed());
        });

        pauseBtn.addEventListener('click', () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            playBtn.disabled = false;
            pauseBtn.disabled = true;
        });

        stepBtn.addEventListener('click', () => {
            if (index < timeLog.length) renderStep(index++);
        });

        resetBtn.addEventListener('click', () => {
            if (interval) { clearInterval(interval); interval = null; }
            index = 0;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            ['remain', 'ready', 'running', 'block', 'terminate'].forEach(s => {
                document.getElementById(`tl-${s}`).innerHTML = '';
            });
            document.getElementById('tl-time').textContent = 'Time: -';
        });

        renderStep(0);
    }, 100);

    return container;
}

// ============================================================
// SECTION 14: RENDERING - COMPARISON CHARTS (Chart.js v4)
// ============================================================

function renderAlgorithmChart(outputDiv) {
    const algoArray = ["fcfs", "sjf", "srtf", "ljf", "lrtf", "rr", "hrrn", "pnp", "pp"];
    const algoNames = ["FCFS", "SJF", "SRTF", "LJF", "LRTF", "RR", "HRRN", "PNP", "PP"];
    const chartData = [[], [], [], []];

    algoArray.forEach(algo => {
        const inp = collectInput();
        if (!inp) return;
        setAlgorithmNameType(inp, algo);
        const util = new Utility();
        setUtility(inp, util);
        const out = new Output();
        CPUScheduler(inp, util, out);
        setOutput(inp, out);
        for (let i = 0; i < 4; i++) chartData[i].push(out.averageTimes[i]);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-container';
    const canvas = document.createElement('canvas');
    canvas.id = 'algo-comparison-chart';
    wrapper.appendChild(canvas);
    outputDiv.appendChild(wrapper);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: algoNames,
            datasets: [
                { label: 'Avg Completion', backgroundColor: '#6366f1', data: chartData[0] },
                { label: 'Avg Turnaround', backgroundColor: '#f87171', data: chartData[1] },
                { label: 'Avg Waiting', backgroundColor: '#fbbf24', data: chartData[2] },
                { label: 'Avg Response', backgroundColor: '#34d399', data: chartData[3] },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Algorithm Comparison (Lower is Better)', color: '#e8e8f0', font: { size: 14, weight: 600 } },
                legend: { labels: { color: '#8888aa', font: { size: 11 } } }
            },
            scales: {
                x: { ticks: { color: '#8888aa' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { beginAtZero: true, ticks: { color: '#8888aa' }, grid: { color: 'rgba(255,255,255,0.04)' } }
            }
        }
    });
}

function renderRoundRobinChart(outputDiv) {
    const inp = collectInput();
    if (!inp) return;

    let maxTQ = 0;
    inp.processTime.forEach(pt => {
        pt.forEach((t, i) => { if (i % 2 === 0) maxTQ = Math.max(maxTQ, t); });
    });
    if (maxTQ < 1) maxTQ = 1;

    const tqArray = [];
    const chartData = [[], [], [], [], []];

    for (let tq = 1; tq <= maxTQ; tq++) {
        tqArray.push(tq);
        const rrInp = collectInput();
        if (!rrInp) return;
        setAlgorithmNameType(rrInp, 'rr');
        rrInp.timeQuantum = tq;
        const util = new Utility();
        setUtility(rrInp, util);
        const out = new Output();
        CPUScheduler(rrInp, util, out);
        setOutput(rrInp, out);
        for (let i = 0; i < 4; i++) chartData[i].push(out.averageTimes[i]);
        chartData[4].push(out.contextSwitches);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-container';
    const canvas = document.createElement('canvas');
    canvas.id = 'rr-comparison-chart';
    wrapper.appendChild(canvas);
    outputDiv.appendChild(wrapper);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: tqArray,
            datasets: [
                { label: 'Avg Completion', borderColor: '#6366f1', data: chartData[0], tension: 0.3, fill: false },
                { label: 'Avg Turnaround', borderColor: '#f87171', data: chartData[1], tension: 0.3, fill: false },
                { label: 'Avg Waiting', borderColor: '#fbbf24', data: chartData[2], tension: 0.3, fill: false },
                { label: 'Avg Response', borderColor: '#34d399', data: chartData[3], tension: 0.3, fill: false },
                { label: 'Context Switches', borderColor: '#a78bfa', data: chartData[4], tension: 0.3, fill: false },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Round Robin — Time Quantum Analysis', color: '#e8e8f0', font: { size: 14, weight: 600 } },
                legend: { labels: { color: '#8888aa', font: { size: 11 } } }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Time Quantum', color: '#8888aa' },
                    ticks: { color: '#8888aa' },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8888aa' },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                }
            }
        }
    });
}

// ============================================================
// SECTION 15: RENDERING - EXPORT
// ============================================================

function exportCSV(input, output) {
    const n = input.processId.length;
    let csv = 'Process,Arrival,Burst,Completion,Turnaround,Waiting,Response\n';
    for (let i = 0; i < n; i++) {
        csv += `P${i+1},${input.arrivalTime[i]},${input.totalBurstTime[i]},${output.completionTime[i]},${output.turnAroundTime[i]},${output.waitingTime[i]},${output.responseTime[i]}\n`;
    }
    csv += `Average,,,${output.averageTimes[0].toFixed(2)},${output.averageTimes[1].toFixed(2)},${output.averageTimes[2].toFixed(2)},${output.averageTimes[3].toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduling_${getSelectedAlgorithm()}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
}

// ============================================================
// SECTION 16: MAIN OUTPUT ASSEMBLY
// ============================================================

function showOutput(input, output) {
    const outputSection = document.getElementById('output-section');
    outputSection.innerHTML = '';

    // Tabs
    const tabContainer = document.createElement('div');

    // Tab navigation
    const tabs = document.createElement('div');
    tabs.className = 'output-tabs';
    const tabDefs = [
        { id: 'gantt', label: '📊 Gantt Chart' },
        { id: 'table', label: '📋 Results Table' },
        { id: 'timelog', label: '⏱ Time Log' },
        { id: 'comparison', label: '📈 Comparison' },
    ];

    tabDefs.forEach((tab, idx) => {
        const btn = document.createElement('button');
        btn.className = 'output-tab' + (idx === 0 ? ' active' : '');
        btn.textContent = tab.label;
        btn.dataset.tab = tab.id;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${tab.id}`).classList.add('active');
        });
        tabs.appendChild(btn);
    });

    // Card wrapper
    const card = document.createElement('section');
    card.className = 'glass-card output-card';
    card.appendChild(tabs);

    // Panel 1: Gantt Chart
    const ganttPanel = document.createElement('div');
    ganttPanel.className = 'tab-panel active';
    ganttPanel.id = 'panel-gantt';
    const ganttContainer = document.createElement('div');
    ganttContainer.className = 'gantt-container';
    ganttContainer.appendChild(renderGanttChart(output));
    ganttPanel.appendChild(ganttContainer);
    card.appendChild(ganttPanel);

    // Panel 2: Results Table
    const tablePanel = document.createElement('div');
    tablePanel.className = 'tab-panel';
    tablePanel.id = 'panel-table';
    tablePanel.appendChild(renderFinalTable(input, output));
    tablePanel.appendChild(renderStatsCards(input, output));

    // Export button
    const exportGroup = document.createElement('div');
    exportGroup.className = 'export-group';
    const csvBtn = document.createElement('button');
    csvBtn.className = 'btn btn-secondary';
    csvBtn.textContent = '📥 Export CSV';
    csvBtn.addEventListener('click', () => exportCSV(input, output));
    exportGroup.appendChild(csvBtn);
    tablePanel.appendChild(exportGroup);
    card.appendChild(tablePanel);

    // Panel 3: Time Log
    const timelogPanel = document.createElement('div');
    timelogPanel.className = 'tab-panel';
    timelogPanel.id = 'panel-timelog';
    timelogPanel.appendChild(renderTimeLog(output));
    card.appendChild(timelogPanel);

    // Panel 4: Comparison Charts
    const compPanel = document.createElement('div');
    compPanel.className = 'tab-panel';
    compPanel.id = 'panel-comparison';
    card.appendChild(compPanel);

    outputSection.appendChild(card);

    // Render comparison charts lazily when tab is clicked (Chart.js needs visible canvas)
    let compChartsRendered = false;
    const compTabBtn = tabs.querySelector('[data-tab="comparison"]');
    compTabBtn.addEventListener('click', () => {
        if (!compChartsRendered) {
            compChartsRendered = true;
            setTimeout(() => {
                if (getSelectedAlgorithm() === 'rr') {
                    renderRoundRobinChart(compPanel);
                }
                renderAlgorithmChart(compPanel);
            }, 50);
        }
    });

    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// SECTION 17: MAIN CALCULATION ENTRY POINT
// ============================================================

function calculateOutput() {
    const input = collectInput();
    if (!input) return;

    const utility = new Utility();
    setUtility(input, utility);
    const output = new Output();

    try {
        CPUScheduler(input, utility, output);
        setOutput(input, output);
        showOutput(input, output);
    } catch (err) {
        console.error('Scheduler error:', err);
        showToast('Error during calculation. Check console for details.', 'error');
    }
}

// ============================================================
// SECTION 18: TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '✗'}</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// SECTION 19: EVENT LISTENERS & INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize presets
    initPresets();

    // Add default processes
    addProcess(0, [4], 1);
    addProcess(1, [3], 1);
    addProcess(2, [1], 1);

    // Algorithm selector
    document.querySelectorAll('input[name="algo"]').forEach(radio => {
        radio.addEventListener('change', updateAlgoUI);
    });
    updateAlgoUI();

    // Priority toggle
    document.getElementById('priority-toggle-btn').addEventListener('click', () => {
        priorityPreference *= -1;
        const el = document.getElementById('priority-preference');
        el.textContent = priorityPreference === 1 ? 'High' : 'Low';
    });

    // Add/Remove process
    document.getElementById('add-process-btn').addEventListener('click', () => addProcess());
    document.getElementById('remove-process-btn').addEventListener('click', removeProcess);

    // Calculate
    document.getElementById('calculate-btn').addEventListener('click', calculateOutput);

    // Reset
    document.getElementById('reset-btn').addEventListener('click', () => {
        clearProcesses();
        addProcess(0, [4], 1);
        addProcess(1, [3], 1);
        addProcess(2, [1], 1);
        document.getElementById('context-switch').value = 0;
        document.getElementById('tq').value = 2;
        document.getElementById('output-section').innerHTML = '';
        document.getElementById('algo-fcfs').checked = true;
        updateAlgoUI();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.target.matches('input')) {
            calculateOutput();
        }
    });
});