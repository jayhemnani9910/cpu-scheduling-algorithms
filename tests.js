/**
 * CPU Scheduling Algorithms - Test Suite
 * Run with: node tests.js
 *
 * This file contains the core scheduling logic extracted from the browser
 * environment plus comprehensive tests for all 9 algorithms.
 */

// ==================== CORE CLASSES ====================

class Input {
    constructor() {
        this.processId = [];
        this.priority = [];
        this.arrivalTime = [];
        this.processTime = [];
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
        this.averageTimes = [];
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

// ==================== HELPER FUNCTIONS ====================

function setAlgorithmNameType(input, algorithm) {
    input.algorithm = algorithm;
    switch (algorithm) {
        case 'fcfs':
        case 'sjf':
        case 'ljf':
        case 'pnp':
        case 'hrrn':
            input.algorithmType = "nonpreemptive";
            break;
        case 'srtf':
        case 'lrtf':
        case 'pp':
            input.algorithmType = "preemptive";
            break;
        case 'rr':
            input.algorithmType = "roundrobin";
            break;
    }
}

function createInput(processes, algorithm, options = {}) {
    const input = new Input();
    const n = processes.length;
    for (let i = 0; i < n; i++) {
        input.processId.push(i);
        input.arrivalTime.push(processes[i].at);
        input.priority.push(processes[i].priority || 1);
        // processTime is an array: [cpu1, io1, cpu2, io2, ...]
        const pt = processes[i].bt ? [processes[i].bt] : (processes[i].processTime || [1]);
        input.processTime.push(pt);
        input.processTimeLength.push(pt.length);
    }
    // total burst time
    input.totalBurstTime = new Array(n).fill(0);
    input.processTime.forEach((e1, i) => {
        e1.forEach((e2, j) => {
            if (j % 2 === 0) {
                input.totalBurstTime[i] += e2;
            }
        });
    });
    setAlgorithmNameType(input, algorithm);
    input.contextSwitch = options.contextSwitch || 0;
    input.timeQuantum = options.timeQuantum || 1;
    return input;
}

function setUtility(input, utility) {
    const n = input.processId.length;
    // BUGFIX: Deep copy processTime arrays to avoid mutation
    utility.remainingProcessTime = input.processTime.map(arr => [...arr]);
    utility.remainingBurstTime = input.totalBurstTime.slice();
    utility.remainingTimeRunning = new Array(n).fill(0);
    utility.currentProcessIndex = new Array(n).fill(0);
    utility.start = new Array(n).fill(false);
    utility.done = new Array(n).fill(false);
    utility.returnTime = input.arrivalTime.slice();
}

function reduceSchedule(schedule) {
    if (!schedule || schedule.length === 0) return [];
    let newSchedule = [];
    let currentScheduleElement = schedule[0][0];
    let currentScheduleLength = schedule[0][1];
    for (let i = 1; i < schedule.length; i++) {
        if (schedule[i][0] === currentScheduleElement) {
            currentScheduleLength += schedule[i][1];
        } else {
            newSchedule.push([currentScheduleElement, currentScheduleLength]);
            currentScheduleElement = schedule[i][0];
            currentScheduleLength = schedule[i][1];
        }
    }
    newSchedule.push([currentScheduleElement, currentScheduleLength]);
    return newSchedule;
}

function outputAverageTimes(output, n) {
    let avgct = 0, avgtat = 0, avgwt = 0, avgrt = 0;
    output.completionTime.forEach(e => avgct += e);
    output.turnAroundTime.forEach(e => avgtat += e);
    output.waitingTime.forEach(e => avgwt += e);
    output.responseTime.forEach(e => avgrt += e);
    return [avgct / n, avgtat / n, avgwt / n, avgrt / n];
}

function setOutput(input, output) {
    const n = input.processId.length;
    for (let i = 0; i < n; i++) {
        output.turnAroundTime[i] = output.completionTime[i] - input.arrivalTime[i];
        output.waitingTime[i] = output.turnAroundTime[i] - input.totalBurstTime[i];
    }
    output.schedule = reduceSchedule(output.schedule);
    output.averageTimes = outputAverageTimes(output, n);
}

// ==================== CPU SCHEDULER (with bug fixes) ====================

function CPUScheduler(input, utility, output, priorityPreference = 1) {
    const n = input.processId.length;

    function moveElement(value, from, to) {
        let index = from.indexOf(value);
        if (index !== -1) {
            from.splice(index, 1);
        }
        if (to.indexOf(value) === -1) {
            to.push(value);
        }
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
    currentTimeLog.remain = input.processId.slice(); // BUGFIX: copy, don't reference
    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    currentTimeLog.move = [];
    currentTimeLog.time++;
    let lastFound = -1;

    while (utility.done.some(e => e === false)) {
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
                let candidates = [...currentTimeLog.ready]; // BUGFIX: don't sort ready queue in place
                candidates.sort((a, b) => a - b);
                candidates.sort((a, b) => {
                    switch (input.algorithm) {
                        case 'fcfs':
                            return utility.returnTime[a] - utility.returnTime[b];
                        case 'sjf':
                        case 'srtf':
                            return utility.remainingBurstTime[a] - utility.remainingBurstTime[b];
                        case 'ljf':
                        case 'lrtf':
                            return utility.remainingBurstTime[b] - utility.remainingBurstTime[a];
                        case 'pnp':
                        case 'pp':
                            return priorityPreference * (input.priority[a] - input.priority[b]);
                        case 'hrrn': {
                            // BUGFIX: HRRN uses total burst time (not remaining) for non-preemptive
                            function responseRatio(id) {
                                let s = input.totalBurstTime[id];
                                let w = currentTimeLog.time - input.arrivalTime[id];
                                return (w + s) / s;
                            }
                            return responseRatio(b) - responseRatio(a);
                        }
                    }
                });
                found = candidates[0];

                if (input.algorithmType === "preemptive" && found >= 0 && lastFound >= 0 && found !== lastFound) {
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) {
                        output.contextSwitches++;
                    }
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
                    if (input.contextSwitch > 0) {
                        output.contextSwitches++;
                    }
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
                        if (input.contextSwitch > 0) {
                            output.contextSwitches++;
                        }
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
    output.schedule.pop();
}

// ==================== TEST FRAMEWORK ====================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, processes, algorithm, expected, options = {}) {
    totalTests++;
    const input = createInput(processes, algorithm, options);
    const utility = new Utility();
    setUtility(input, utility);
    const output = new Output();
    CPUScheduler(input, utility, output, options.priorityPreference || 1);
    setOutput(input, output);

    let pass = true;
    const errors = [];

    if (expected.ct) {
        for (let i = 0; i < expected.ct.length; i++) {
            if (output.completionTime[i] !== expected.ct[i]) {
                pass = false;
                errors.push(`  CT[P${i+1}]: expected ${expected.ct[i]}, got ${output.completionTime[i]}`);
            }
        }
    }
    if (expected.tat) {
        for (let i = 0; i < expected.tat.length; i++) {
            if (output.turnAroundTime[i] !== expected.tat[i]) {
                pass = false;
                errors.push(`  TAT[P${i+1}]: expected ${expected.tat[i]}, got ${output.turnAroundTime[i]}`);
            }
        }
    }
    if (expected.wt) {
        for (let i = 0; i < expected.wt.length; i++) {
            if (output.waitingTime[i] !== expected.wt[i]) {
                pass = false;
                errors.push(`  WT[P${i+1}]: expected ${expected.wt[i]}, got ${output.waitingTime[i]}`);
            }
        }
    }
    if (expected.rt) {
        for (let i = 0; i < expected.rt.length; i++) {
            if (output.responseTime[i] !== expected.rt[i]) {
                pass = false;
                errors.push(`  RT[P${i+1}]: expected ${expected.rt[i]}, got ${output.responseTime[i]}`);
            }
        }
    }

    if (pass) {
        passedTests++;
        console.log(`  ✅ ${name}`);
    } else {
        failedTests++;
        console.log(`  ❌ ${name}`);
        errors.forEach(e => console.log(`     ${e}`));
    }
}

// ==================== TEST CASES ====================

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║     CPU Scheduling Algorithms - Test Suite      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// ---- FCFS ----
console.log("── FCFS (First Come First Serve) ──");
runTest("Basic: 3 processes, staggered arrival", [
    { at: 0, bt: 4 },
    { at: 1, bt: 3 },
    { at: 2, bt: 1 },
], 'fcfs', {
    ct: [4, 7, 8],
    tat: [4, 6, 6],
    wt: [0, 3, 5],
    rt: [0, 3, 5],
});

runTest("All arrive at time 0", [
    { at: 0, bt: 6 },
    { at: 0, bt: 8 },
    { at: 0, bt: 7 },
    { at: 0, bt: 3 },
], 'fcfs', {
    ct: [6, 14, 21, 24],
    tat: [6, 14, 21, 24],
    wt: [0, 6, 14, 21],
    rt: [0, 6, 14, 21],
});

runTest("Single process", [
    { at: 0, bt: 5 },
], 'fcfs', {
    ct: [5],
    tat: [5],
    wt: [0],
    rt: [0],
});

runTest("Processes with gap (idle CPU)", [
    { at: 0, bt: 2 },
    { at: 5, bt: 3 },
], 'fcfs', {
    ct: [2, 8],
    tat: [2, 3],
    wt: [0, 0],
    rt: [0, 0],
});

// ---- SJF ----
console.log("\n── SJF (Shortest Job First) ──");
runTest("Basic: 4 processes", [
    { at: 0, bt: 6 },
    { at: 0, bt: 8 },
    { at: 0, bt: 7 },
    { at: 0, bt: 3 },
], 'sjf', {
    ct: [9, 24, 16, 3],
    tat: [9, 24, 16, 3],
    wt: [3, 16, 9, 0],
    rt: [3, 16, 9, 0],
});

runTest("Staggered arrivals", [
    { at: 0, bt: 7 },
    { at: 2, bt: 4 },
    { at: 4, bt: 1 },
    { at: 5, bt: 4 },
], 'sjf', {
    ct: [7, 12, 8, 16],
    tat: [7, 10, 4, 11],
    wt: [0, 6, 3, 7],
    rt: [0, 6, 3, 7],
});

// ---- LJF ----
console.log("\n── LJF (Longest Job First) ──");
runTest("Basic: 4 processes all at t=0", [
    { at: 0, bt: 6 },
    { at: 0, bt: 8 },
    { at: 0, bt: 7 },
    { at: 0, bt: 3 },
], 'ljf', {
    ct: [21, 8, 15, 24],
    tat: [21, 8, 15, 24],
    wt: [15, 0, 8, 21],
    rt: [15, 0, 8, 21],
});

// ---- SRTF ----
console.log("\n── SRTF (Shortest Remaining Time First) ──");
runTest("Basic preemption test", [
    { at: 0, bt: 8 },
    { at: 1, bt: 4 },
    { at: 2, bt: 9 },
    { at: 3, bt: 5 },
], 'srtf', {
    ct: [17, 5, 26, 10],
    tat: [17, 4, 24, 7],
    wt: [9, 0, 15, 2],
    rt: [0, 0, 15, 2],
});

runTest("No preemption needed (already shortest)", [
    { at: 0, bt: 3 },
    { at: 2, bt: 6 },
    { at: 4, bt: 4 },
], 'srtf', {
    ct: [3, 13, 8],
    tat: [3, 11, 4],
    wt: [0, 5, 0],
    rt: [0, 1, 0],
});

// ---- LRTF ----
console.log("\n── LRTF (Longest Remaining Time First) ──");
runTest("Basic: 3 processes", [
    { at: 0, bt: 2 },
    { at: 0, bt: 4 },
    { at: 0, bt: 3 },
], 'lrtf', {
    ct: [7, 8, 9],
    tat: [7, 8, 9],
    wt: [5, 4, 6],
    rt: [3, 0, 2],
});

// ---- Round Robin ----
console.log("\n── RR (Round Robin) ──");
runTest("TQ=2, 4 processes at t=0", [
    { at: 0, bt: 5 },
    { at: 0, bt: 4 },
    { at: 0, bt: 2 },
    { at: 0, bt: 1 },
], 'rr', {
    ct: [12, 11, 6, 7],
    tat: [12, 11, 6, 7],
    wt: [7, 7, 4, 6],
    rt: [0, 2, 4, 6],
}, { timeQuantum: 2 });

runTest("TQ=3, staggered", [
    { at: 0, bt: 4 },
    { at: 1, bt: 5 },
    { at: 2, bt: 2 },
    { at: 3, bt: 1 },
], 'rr', {
    ct: [10, 12, 8, 9],
    tat: [10, 11, 6, 6],
    wt: [6, 6, 4, 5],
    rt: [0, 2, 4, 5],
}, { timeQuantum: 3 });

// ---- Priority Non-Preemptive ----
console.log("\n── PNP (Priority Non-Preemptive) ──");
runTest("Basic: lower number = higher priority", [
    { at: 0, bt: 4, priority: 2 },
    { at: 0, bt: 3, priority: 1 },
    { at: 0, bt: 5, priority: 3 },
], 'pnp', {
    ct: [7, 3, 12],
    tat: [7, 3, 12],
    wt: [3, 0, 7],
    rt: [3, 0, 7],
});

runTest("Same priority - tiebreak by PID", [
    { at: 0, bt: 3, priority: 1 },
    { at: 0, bt: 4, priority: 1 },
    { at: 0, bt: 2, priority: 1 },
], 'pnp', {
    ct: [3, 7, 9],
    tat: [3, 7, 9],
    wt: [0, 3, 7],
    rt: [0, 3, 7],
});

// ---- Priority Preemptive ----
console.log("\n── PP (Priority Preemptive) ──");
runTest("Preemption on higher priority arrival", [
    { at: 0, bt: 4, priority: 2 },
    { at: 1, bt: 3, priority: 1 },
    { at: 2, bt: 5, priority: 3 },
], 'pp', {
    ct: [7, 4, 12],
    tat: [7, 3, 10],
    wt: [3, 0, 5],
    rt: [0, 0, 5],
});

// ---- HRRN ----
console.log("\n── HRRN (Highest Response Ratio Next) ──");
runTest("Basic: 4 processes", [
    { at: 0, bt: 3 },
    { at: 2, bt: 6 },
    { at: 4, bt: 4 },
    { at: 6, bt: 5 },
], 'hrrn', {
    ct: [3, 9, 13, 18],
    tat: [3, 7, 9, 12],
    wt: [0, 1, 5, 7],
    rt: [0, 1, 5, 7],
});

// ---- Edge Cases ----
console.log("\n── Edge Cases ──");
runTest("All processes same burst time (FCFS fallback)", [
    { at: 0, bt: 3 },
    { at: 0, bt: 3 },
    { at: 0, bt: 3 },
], 'sjf', {
    ct: [3, 6, 9],
    tat: [3, 6, 9],
    wt: [0, 3, 6],
    rt: [0, 3, 6],
});

runTest("Large burst time single process", [
    { at: 0, bt: 100 },
], 'fcfs', {
    ct: [100],
    tat: [100],
    wt: [0],
    rt: [0],
});

runTest("RR with TQ=1 (heavy context switching)", [
    { at: 0, bt: 3 },
    { at: 0, bt: 3 },
], 'rr', {
    ct: [5, 6],
    tat: [5, 6],
    wt: [2, 3],
    rt: [0, 1],
}, { timeQuantum: 1 });

// ==================== SUMMARY ====================

console.log("\n══════════════════════════════════════════════════");
console.log(`  Total: ${totalTests}  |  ✅ Passed: ${passedTests}  |  ❌ Failed: ${failedTests}`);
console.log("══════════════════════════════════════════════════\n");

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log("  All tests passed! 🎉\n");
    process.exit(0);
}
