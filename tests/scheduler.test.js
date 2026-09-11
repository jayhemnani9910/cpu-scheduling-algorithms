/**
 * CPU Scheduling Algorithms - Test Suite
 * Run with: npm test
 *
 * The scheduling engine lives in scheduler.js, the same file the page loads,
 * so these tests exercise the shipped code rather than a copy of it.
 */

const {
    Input,
    Utility,
    Output,
    setAlgorithmNameType,
    setUtility,
    setOutput,
    CPUScheduler,
} = require("../scheduler.js");

// ==================== HELPER FUNCTIONS ====================

function createInput(processes, algorithm, options = {}) {
    const input = new Input();
    const n = processes.length;
    for (let i = 0; i < n; i++) {
        input.processId.push(i);
        input.arrivalTime.push(processes[i].at);
        input.priority.push(processes[i].priority || 1);
        // processTime is an array: [cpu1, io1, cpu2, io2, ...]
        const pt = processes[i].bt ? [processes[i].bt] : processes[i].processTime || [1];
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
                errors.push(
                    `  CT[P${i + 1}]: expected ${expected.ct[i]}, got ${output.completionTime[i]}`
                );
            }
        }
    }
    if (expected.tat) {
        for (let i = 0; i < expected.tat.length; i++) {
            if (output.turnAroundTime[i] !== expected.tat[i]) {
                pass = false;
                errors.push(
                    `  TAT[P${i + 1}]: expected ${expected.tat[i]}, got ${output.turnAroundTime[i]}`
                );
            }
        }
    }
    if (expected.wt) {
        for (let i = 0; i < expected.wt.length; i++) {
            if (output.waitingTime[i] !== expected.wt[i]) {
                pass = false;
                errors.push(
                    `  WT[P${i + 1}]: expected ${expected.wt[i]}, got ${output.waitingTime[i]}`
                );
            }
        }
    }
    if (expected.rt) {
        for (let i = 0; i < expected.rt.length; i++) {
            if (output.responseTime[i] !== expected.rt[i]) {
                pass = false;
                errors.push(
                    `  RT[P${i + 1}]: expected ${expected.rt[i]}, got ${output.responseTime[i]}`
                );
            }
        }
    }

    if (pass) {
        passedTests++;
        console.log(`  ✅ ${name}`);
    } else {
        failedTests++;
        console.log(`  ❌ ${name}`);
        errors.forEach((e) => console.log(`     ${e}`));
    }
}

// ==================== TEST CASES ====================

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║     CPU Scheduling Algorithms - Test Suite      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// ---- FCFS ----
console.log("── FCFS (First Come First Serve) ──");
runTest(
    "Basic: 3 processes, staggered arrival",
    [
        { at: 0, bt: 4 },
        { at: 1, bt: 3 },
        { at: 2, bt: 1 },
    ],
    "fcfs",
    {
        ct: [4, 7, 8],
        tat: [4, 6, 6],
        wt: [0, 3, 5],
        rt: [0, 3, 5],
    }
);

runTest(
    "All arrive at time 0",
    [
        { at: 0, bt: 6 },
        { at: 0, bt: 8 },
        { at: 0, bt: 7 },
        { at: 0, bt: 3 },
    ],
    "fcfs",
    {
        ct: [6, 14, 21, 24],
        tat: [6, 14, 21, 24],
        wt: [0, 6, 14, 21],
        rt: [0, 6, 14, 21],
    }
);

runTest("Single process", [{ at: 0, bt: 5 }], "fcfs", {
    ct: [5],
    tat: [5],
    wt: [0],
    rt: [0],
});

runTest(
    "Processes with gap (idle CPU)",
    [
        { at: 0, bt: 2 },
        { at: 5, bt: 3 },
    ],
    "fcfs",
    {
        ct: [2, 8],
        tat: [2, 3],
        wt: [0, 0],
        rt: [0, 0],
    }
);

// ---- SJF ----
console.log("\n── SJF (Shortest Job First) ──");
runTest(
    "Basic: 4 processes",
    [
        { at: 0, bt: 6 },
        { at: 0, bt: 8 },
        { at: 0, bt: 7 },
        { at: 0, bt: 3 },
    ],
    "sjf",
    {
        ct: [9, 24, 16, 3],
        tat: [9, 24, 16, 3],
        wt: [3, 16, 9, 0],
        rt: [3, 16, 9, 0],
    }
);

runTest(
    "Staggered arrivals",
    [
        { at: 0, bt: 7 },
        { at: 2, bt: 4 },
        { at: 4, bt: 1 },
        { at: 5, bt: 4 },
    ],
    "sjf",
    {
        ct: [7, 12, 8, 16],
        tat: [7, 10, 4, 11],
        wt: [0, 6, 3, 7],
        rt: [0, 6, 3, 7],
    }
);

// ---- LJF ----
console.log("\n── LJF (Longest Job First) ──");
runTest(
    "Basic: 4 processes all at t=0",
    [
        { at: 0, bt: 6 },
        { at: 0, bt: 8 },
        { at: 0, bt: 7 },
        { at: 0, bt: 3 },
    ],
    "ljf",
    {
        ct: [21, 8, 15, 24],
        tat: [21, 8, 15, 24],
        wt: [15, 0, 8, 21],
        rt: [15, 0, 8, 21],
    }
);

// ---- SRTF ----
console.log("\n── SRTF (Shortest Remaining Time First) ──");
runTest(
    "Basic preemption test",
    [
        { at: 0, bt: 8 },
        { at: 1, bt: 4 },
        { at: 2, bt: 9 },
        { at: 3, bt: 5 },
    ],
    "srtf",
    {
        ct: [17, 5, 26, 10],
        tat: [17, 4, 24, 7],
        wt: [9, 0, 15, 2],
        rt: [0, 0, 15, 2],
    }
);

runTest(
    "No preemption needed (already shortest)",
    [
        { at: 0, bt: 3 },
        { at: 2, bt: 6 },
        { at: 4, bt: 4 },
    ],
    "srtf",
    {
        ct: [3, 13, 8],
        tat: [3, 11, 4],
        wt: [0, 5, 0],
        rt: [0, 1, 0],
    }
);

// ---- LRTF ----
console.log("\n── LRTF (Longest Remaining Time First) ──");
runTest(
    "Basic: 3 processes",
    [
        { at: 0, bt: 2 },
        { at: 0, bt: 4 },
        { at: 0, bt: 3 },
    ],
    "lrtf",
    {
        ct: [7, 8, 9],
        tat: [7, 8, 9],
        wt: [5, 4, 6],
        rt: [3, 0, 2],
    }
);

// ---- Round Robin ----
console.log("\n── RR (Round Robin) ──");
runTest(
    "TQ=2, 4 processes at t=0",
    [
        { at: 0, bt: 5 },
        { at: 0, bt: 4 },
        { at: 0, bt: 2 },
        { at: 0, bt: 1 },
    ],
    "rr",
    {
        ct: [12, 11, 6, 7],
        tat: [12, 11, 6, 7],
        wt: [7, 7, 4, 6],
        rt: [0, 2, 4, 6],
    },
    { timeQuantum: 2 }
);

runTest(
    "TQ=3, staggered",
    [
        { at: 0, bt: 4 },
        { at: 1, bt: 5 },
        { at: 2, bt: 2 },
        { at: 3, bt: 1 },
    ],
    "rr",
    {
        ct: [10, 12, 8, 9],
        tat: [10, 11, 6, 6],
        wt: [6, 6, 4, 5],
        rt: [0, 2, 4, 5],
    },
    { timeQuantum: 3 }
);

// ---- Priority Non-Preemptive ----
console.log("\n── PNP (Priority Non-Preemptive) ──");
runTest(
    "Basic: lower number = higher priority",
    [
        { at: 0, bt: 4, priority: 2 },
        { at: 0, bt: 3, priority: 1 },
        { at: 0, bt: 5, priority: 3 },
    ],
    "pnp",
    {
        ct: [7, 3, 12],
        tat: [7, 3, 12],
        wt: [3, 0, 7],
        rt: [3, 0, 7],
    }
);

runTest(
    "Same priority - tiebreak by PID",
    [
        { at: 0, bt: 3, priority: 1 },
        { at: 0, bt: 4, priority: 1 },
        { at: 0, bt: 2, priority: 1 },
    ],
    "pnp",
    {
        ct: [3, 7, 9],
        tat: [3, 7, 9],
        wt: [0, 3, 7],
        rt: [0, 3, 7],
    }
);

// ---- Priority Preemptive ----
console.log("\n── PP (Priority Preemptive) ──");
runTest(
    "Preemption on higher priority arrival",
    [
        { at: 0, bt: 4, priority: 2 },
        { at: 1, bt: 3, priority: 1 },
        { at: 2, bt: 5, priority: 3 },
    ],
    "pp",
    {
        ct: [7, 4, 12],
        tat: [7, 3, 10],
        wt: [3, 0, 5],
        rt: [0, 0, 5],
    }
);

// ---- HRRN ----
console.log("\n── HRRN (Highest Response Ratio Next) ──");
runTest(
    "Basic: 4 processes",
    [
        { at: 0, bt: 3 },
        { at: 2, bt: 6 },
        { at: 4, bt: 4 },
        { at: 6, bt: 5 },
    ],
    "hrrn",
    {
        ct: [3, 9, 13, 18],
        tat: [3, 7, 9, 12],
        wt: [0, 1, 5, 7],
        rt: [0, 1, 5, 7],
    }
);

// ---- Edge Cases ----
console.log("\n── Edge Cases ──");
runTest(
    "All processes same burst time (FCFS fallback)",
    [
        { at: 0, bt: 3 },
        { at: 0, bt: 3 },
        { at: 0, bt: 3 },
    ],
    "sjf",
    {
        ct: [3, 6, 9],
        tat: [3, 6, 9],
        wt: [0, 3, 6],
        rt: [0, 3, 6],
    }
);

runTest("Large burst time single process", [{ at: 0, bt: 100 }], "fcfs", {
    ct: [100],
    tat: [100],
    wt: [0],
    rt: [0],
});

runTest(
    "RR with TQ=1 (heavy context switching)",
    [
        { at: 0, bt: 3 },
        { at: 0, bt: 3 },
    ],
    "rr",
    {
        ct: [5, 6],
        tat: [5, 6],
        wt: [2, 3],
        rt: [0, 1],
    },
    { timeQuantum: 1 }
);

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
