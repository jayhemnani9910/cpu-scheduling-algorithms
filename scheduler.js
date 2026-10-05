/**
 * CPU Scheduling Algorithms - scheduling engine.
 *
 * No DOM in here. The browser loads this with a plain script tag before
 * script.js; node gets the same code through require, so the tests exercise
 * exactly what ships.
 */

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
        this.averageTimes = []; //ct,tat,wt,rt
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
        this.move = []; //0-remain->ready 1-ready->running 2-running->terminate 3-running->ready 4-running->block 5-block->ready
    }
}

const ALGORITHM_TYPES = {
    fcfs: "nonpreemptive",
    sjf: "nonpreemptive",
    ljf: "nonpreemptive",
    pnp: "nonpreemptive",
    hrrn: "nonpreemptive",
    srtf: "preemptive",
    lrtf: "preemptive",
    pp: "preemptive",
    rr: "roundrobin",
};

function setAlgorithmNameType(input, algorithm) {
    input.algorithm = algorithm;
    input.algorithmType = ALGORITHM_TYPES[algorithm];
}

function setUtility(input, utility) {
    let n = input.processId.length;
    utility.remainingProcessTime = input.processTime.map((row) => row.slice());
    utility.remainingBurstTime = input.totalBurstTime.slice();
    utility.remainingTimeRunning = new Array(n).fill(0);
    utility.currentProcessIndex = new Array(n).fill(0);
    utility.start = new Array(n).fill(false);
    utility.done = new Array(n).fill(false);
    utility.returnTime = input.arrivalTime.slice();
}

//merge neighbouring entries that belong to the same process
function reduceSchedule(schedule) {
    let reduced = [];
    schedule.forEach(([id, length]) => {
        let last = reduced[reduced.length - 1];
        if (last && last[0] === id) {
            last[1] += length;
        } else {
            reduced.push([id, length]);
        }
    });
    return reduced;
}

//drop snapshots that are identical to the next one
function reduceTimeLog(timeLog) {
    return timeLog.filter(
        (entry, i) =>
            i === timeLog.length - 1 || JSON.stringify(entry) !== JSON.stringify(timeLog[i + 1])
    );
}

function outputAverageTimes(output, n) {
    const average = (values) => values.reduce((sum, value) => sum + value, 0) / n;
    return [
        average(output.completionTime),
        average(output.turnAroundTime),
        average(output.waitingTime),
        average(output.responseTime),
    ];
}

function setOutput(input, output) {
    let n = input.processId.length;
    for (let i = 0; i < n; i++) {
        output.turnAroundTime[i] = output.completionTime[i] - input.arrivalTime[i];
        output.waitingTime[i] = output.turnAroundTime[i] - input.totalBurstTime[i];
    }
    output.schedule = reduceSchedule(output.schedule);
    output.timeLog = reduceTimeLog(output.timeLog);
    output.averageTimes = outputAverageTimes(output, n);
}

function CPUScheduler(input, utility, output, priorityPreference = 1) {
    let log = new TimeLog();
    log.remain = input.processId.slice();

    function moveElement(value, from, to) {
        let index = from.indexOf(value);
        if (index !== -1) {
            from.splice(index, 1);
        }
        if (!to.includes(value)) {
            to.push(value);
        }
    }

    function snapshot() {
        output.timeLog.push(JSON.parse(JSON.stringify(log)));
        log.move = [];
    }

    function updateReadyQueue() {
        let fromRemain = log.remain.filter((id) => input.arrivalTime[id] <= log.time);
        let fromBlock = log.block.filter((id) => utility.returnTime[id] <= log.time);
        if (fromRemain.length > 0) {
            log.move.push(0);
        }
        if (fromBlock.length > 0) {
            log.move.push(5);
        }
        fromRemain
            .concat(fromBlock)
            .sort((a, b) => utility.returnTime[a] - utility.returnTime[b])
            .forEach((id) => {
                moveElement(id, log.remain, log.ready);
                moveElement(id, log.block, log.ready);
            });
        snapshot();
    }

    function contextSwitch() {
        output.schedule.push([-2, input.contextSwitch]);
        for (let i = 0; i < input.contextSwitch; i++, log.time++) {
            updateReadyQueue();
        }
        if (input.contextSwitch > 0) {
            output.contextSwitches++;
        }
    }

    //the current CPU burst is used up: terminate, or go to IO
    function endBurst(id) {
        utility.currentProcessIndex[id]++;
        if (utility.currentProcessIndex[id] === input.processTimeLength[id]) {
            utility.done[id] = true;
            output.completionTime[id] = log.time;
            moveElement(id, log.running, log.terminate);
            log.move.push(2);
        } else {
            utility.returnTime[id] =
                log.time + input.processTime[id][utility.currentProcessIndex[id]];
            utility.currentProcessIndex[id]++;
            moveElement(id, log.running, log.block);
            log.move.push(4);
        }
        snapshot();
    }

    function responseRatio(id) {
        let s = input.totalBurstTime[id];
        let w = log.time - input.arrivalTime[id];
        return (w + s) / s;
    }

    function compare(a, b) {
        switch (input.algorithm) {
            case "fcfs":
                return utility.returnTime[a] - utility.returnTime[b];
            case "sjf":
            case "srtf":
                return utility.remainingBurstTime[a] - utility.remainingBurstTime[b];
            case "ljf":
            case "lrtf":
                return utility.remainingBurstTime[b] - utility.remainingBurstTime[a];
            case "pnp":
            case "pp":
                return priorityPreference * (input.priority[a] - input.priority[b]);
            case "hrrn":
                return responseRatio(b) - responseRatio(a);
        }
    }

    const isRoundRobin = input.algorithm === "rr";
    const isPreemptive = input.algorithmType === "preemptive";
    snapshot();
    log.time++;
    let lastFound = -1;
    while (utility.done.includes(false)) {
        updateReadyQueue();
        let found = -1;
        if (log.running.length === 1) {
            found = log.running[0];
        } else if (log.ready.length > 0) {
            if (isRoundRobin) {
                found = log.ready[0];
                utility.remainingTimeRunning[found] = Math.min(
                    utility.remainingProcessTime[found][utility.currentProcessIndex[found]],
                    input.timeQuantum
                );
            } else {
                //ties go to the lower process id
                found = [...log.ready].sort((a, b) => compare(a, b) || a - b)[0];
                if (isPreemptive && lastFound >= 0 && found !== lastFound) {
                    contextSwitch();
                }
            }
            moveElement(found, log.ready, log.running);
            log.move.push(1);
            snapshot();
            if (!utility.start[found]) {
                utility.start[found] = true;
                output.responseTime[found] = log.time - input.arrivalTime[found];
            }
        }
        log.time++;
        if (found === -1) {
            output.schedule.push([-1, 1]);
            lastFound = -1;
        } else {
            output.schedule.push([found + 1, 1]);
            utility.remainingProcessTime[found][utility.currentProcessIndex[found]]--;
            utility.remainingBurstTime[found]--;
            let burstDone =
                utility.remainingProcessTime[found][utility.currentProcessIndex[found]] === 0;

            if (isRoundRobin) {
                utility.remainingTimeRunning[found]--;
                if (utility.remainingTimeRunning[found] === 0) {
                    if (burstDone) {
                        endBurst(found);
                        updateReadyQueue();
                    } else {
                        updateReadyQueue();
                        moveElement(found, log.running, log.ready);
                        log.move.push(3);
                        snapshot();
                    }
                    //no switch when the preempted process is the only one ready
                    if (!(log.ready.length === 1 && log.ready[0] === found)) {
                        contextSwitch();
                    }
                }
            } else if (burstDone) {
                endBurst(found);
                contextSwitch();
                lastFound = -1;
            } else if (isPreemptive) {
                moveElement(found, log.running, log.ready);
                log.move.push(3);
                snapshot();
                lastFound = found;
            }
        }
        snapshot();
    }
    output.schedule.pop();
}

if (typeof module !== "undefined") {
    module.exports = {
        Input,
        Utility,
        Output,
        TimeLog,
        setAlgorithmNameType,
        setUtility,
        reduceSchedule,
        reduceTimeLog,
        outputAverageTimes,
        setOutput,
        CPUScheduler,
    };
}
