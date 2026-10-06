const algoSelect = document.getElementById("algo");
const priorityOrder = document.getElementById("priority-order");
const timeQuantum = document.getElementById("tq");
const contextSwitch = document.getElementById("context-switch");
const processBody = document.getElementById("processes");
const outputDiv = document.getElementById("output");
const emptyState = outputDiv.innerHTML;

const ALGORITHM_NAMES = {
    fcfs: "FCFS",
    sjf: "SJF",
    srtf: "SRTF",
    ljf: "LJF",
    lrtf: "LRTF",
    rr: "RR",
    hrrn: "HRRN",
    pnp: "PNP",
    pp: "PP",
};
const METRICS = [
    ["Completion", "#3366CC"],
    ["Turnaround", "#DC3912"],
    ["Waiting", "#FF9900"],
    ["Response", "#109618"],
];
const LANES = {
    remain: "Not arrived",
    ready: "Ready",
    running: "Running",
    block: "Blocked (IO)",
    terminate: "Done",
};

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const round = (value, digits = 2) => Number(value.toFixed(digits));
const sum = (values) => values.reduce((total, value) => total + value, 0);

//---------- setup form ----------

function syncSettings() {
    let algorithm = algoSelect.value;
    document.body.classList.toggle("show-priority", algorithm === "pnp" || algorithm === "pp");
    document.body.classList.toggle("show-rr", algorithm === "rr");
}

function numberInput(min, value) {
    return `<input type="number" min="${min}" step="1" value="${value}" />`;
}

function burstHTML(kind) {
    return `<label class="burst ${kind.toLowerCase()}">${kind}${numberInput(1, 1)}</label>`;
}

function addProcess() {
    processBody.insertRow().innerHTML = `
        <td class="process-id"></td>
        <td class="priority-only"><label class="cell-label"><span class="cell-name">Priority</span>${numberInput(1, 1)}</label></td>
        <td><label class="cell-label"><span class="cell-name">Arrival</span>${numberInput(0, 0)}</label></td>
        <td><div class="bursts">${burstHTML("CPU")}</div></td>
        <td class="row-actions">
            <button type="button" class="icon" data-action="add-io" title="Add an IO burst and a CPU burst">+ IO</button>
            <button type="button" class="icon" data-action="remove-io" title="Remove the last IO and CPU burst">&minus; IO</button>
            <button type="button" class="icon" data-action="remove" title="Remove this process" aria-label="Remove this process">&times;</button>
        </td>`;
    refreshRows();
}

//process ids follow row order, so renumber after any change
function refreshRows() {
    let rows = [...processBody.rows];
    rows.forEach((row, i) => {
        row.cells[0].textContent = "P" + (i + 1);
        row.querySelector('[data-action="remove-io"]').disabled =
            row.querySelectorAll(".burst").length === 1;
        row.querySelector('[data-action="remove"]').disabled = rows.length === 1;
    });
}

processBody.onclick = (event) => {
    let button = event.target.closest("button");
    if (!button) {
        return;
    }
    let row = button.closest("tr");
    let bursts = row.querySelector(".bursts");
    switch (button.dataset.action) {
        case "add-io":
            bursts.insertAdjacentHTML("beforeend", burstHTML("IO") + burstHTML("CPU"));
            break;
        case "remove-io":
            bursts.lastElementChild.remove();
            bursts.lastElementChild.remove();
            break;
        case "remove":
            row.remove();
            break;
    }
    refreshRows();
};

//whole numbers only, never below the input's min
document.getElementById("setup").addEventListener("change", (event) => {
    let input = event.target;
    if (input.type !== "number") {
        return;
    }
    let value = Number(input.value);
    let min = Number(input.min);
    input.value = Number.isInteger(value) && value >= min ? value : min;
});

function reset() {
    stopTimeLog();
    processBody.innerHTML = "";
    addProcess();
    algoSelect.value = "fcfs";
    priorityOrder.value = "1";
    timeQuantum.value = 1;
    contextSwitch.value = 0;
    syncSettings();
    outputDiv.innerHTML = emptyState;
}

//---------- scheduling ----------

function readInput(algorithm = algoSelect.value) {
    let input = new Input();
    [...processBody.rows].forEach((row, i) => {
        let [priority, arrival, ...bursts] = [...row.querySelectorAll("input")].map((el) =>
            Number(el.value)
        );
        input.processId.push(i);
        input.priority.push(priority);
        input.arrivalTime.push(arrival);
        input.processTime.push(bursts);
        input.processTimeLength.push(bursts.length);
        //CPU bursts sit at the even indexes
        input.totalBurstTime.push(sum(bursts.filter((_, j) => j % 2 === 0)));
    });
    setAlgorithmNameType(input, algorithm);
    input.contextSwitch = Number(contextSwitch.value);
    input.timeQuantum = Number(timeQuantum.value);
    return input;
}

function schedule(input) {
    let utility = new Utility();
    let output = new Output();
    setUtility(input, utility);
    CPUScheduler(input, utility, output, Number(priorityOrder.value));
    setOutput(input, output);
    return output;
}

//---------- results ----------

function section(title, caption) {
    let card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<h2>${title}</h2>` + (caption ? `<p class="subtitle">${caption}</p>` : "");
    outputDiv.appendChild(card);
    return card;
}

function showSummary(input, output) {
    let lastCompletion = Math.max(...output.completionTime);
    let [ct, tat, wt, rt] = output.averageTimes;
    let stats = [
        ["Avg turnaround", round(tat)],
        ["Avg waiting", round(wt)],
        ["Avg response", round(rt)],
        ["Avg completion", round(ct)],
        ["CPU utilization", round((sum(input.totalBurstTime) / lastCompletion) * 100) + "%"],
        ["Throughput", round(input.processId.length / lastCompletion, 3) + " / unit"],
    ];
    if (input.contextSwitch > 0) {
        stats.push(["Context switches", output.contextSwitches - 1]);
    }
    let card = section("Results: " + algoSelect.selectedOptions[0].text);
    card.insertAdjacentHTML(
        "beforeend",
        `<div class="stats">${stats
            .map(
                ([label, value]) =>
                    `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`
            )
            .join("")}</div>`
    );
}

//google timelines take dates, so time t becomes t seconds past midnight
const toDate = (t) => new Date(0, 0, 0, 0, 0, t);

//the same process gets the same colour in both timelines, id is 1-based
const PROCESS_COLORS = [
    "#3366CC",
    "#DC3912",
    "#FF9900",
    "#109618",
    "#990099",
    "#0099C6",
    "#DD4477",
    "#66AA00",
    "#B82E2E",
    "#316395",
];
const processColor = (id) => PROCESS_COLORS[(id - 1) % PROCESS_COLORS.length];

function drawTimeline(card, columns, rows, rowCount, end, { timeline, ...options }) {
    let scroll = document.createElement("div");
    scroll.className = "chart-scroll";
    let container = document.createElement("div");
    scroll.appendChild(container);
    card.appendChild(scroll);

    google.charts.load("current", { packages: ["timeline"] });
    google.charts.setOnLoadCallback(() => {
        let data = new google.visualization.DataTable();
        columns.forEach((column) => data.addColumn(column));
        data.addRows(rows);
        new google.visualization.Timeline(container).draw(data, {
            width: end >= 20 ? 0.05 * end * screen.availWidth : "100%",
            height: rowCount * 41 + 50,
            backgroundColor: css("--surface"),
            timeline: { rowLabelStyle: { color: css("--text") }, ...timeline },
            ...options,
        });
    });
}

//walk the schedule and hand each entry its start and end time
function withTimes(schedule) {
    let time = 0;
    return schedule.map(([id, length]) => {
        let start = time;
        time += length;
        return { id, start, end: time };
    });
}

function showGanttChart(output) {
    let card = section("Gantt chart", "CS is a context switch, Idle means no process was ready.");
    let entries = withTimes(output.schedule);
    let rows = entries
        .filter(({ start, end }) => end > start)
        .map(({ id, start, end }) => {
            let [label, color] =
                id === -2
                    ? ["CS", css("--switch")]
                    : id === -1
                      ? ["Idle", css("--idle")]
                      : ["P" + id, processColor(id)];
            return ["Time", label, color, toDate(start), toDate(end)];
        });
    let columns = [
        { type: "string", id: "Gantt Chart" },
        { type: "string", id: "Process" },
        { type: "string", id: "style", role: "style" },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
    ];
    let end = entries.length ? entries[entries.length - 1].end : 0;
    drawTimeline(card, columns, rows, 1, end, {
        timeline: { showRowLabels: false },
        avoidOverlappingGridLines: false,
    });
}

function showTimelineChart(input, output) {
    let card = section("Timeline", "When each process held the CPU.");
    let entries = withTimes(output.schedule);
    let rows = entries
        .filter(({ id }) => id > 0)
        .sort((a, b) => a.id - b.id)
        .map(({ id, start, end }) => ["P" + id, toDate(start), toDate(end)]);
    let columns = [
        { type: "string", id: "Process" },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
    ];
    let end = entries.length ? entries[entries.length - 1].end : 0;
    drawTimeline(card, columns, rows, input.processId.length, end, {
        colors: input.processId.map((i) => processColor(i + 1)),
    });
}

function showFinalTable(input, output) {
    let card = section("Process table");
    let columns = [
        ["Arrival", input.arrivalTime],
        ["Burst", input.totalBurstTime],
        ["Completion", output.completionTime],
        ["Turnaround", output.turnAroundTime],
        ["Waiting", output.waitingTime],
        ["Response", output.responseTime],
    ];
    let body = input.processId
        .map(
            (i) =>
                `<tr><td>P${i + 1}</td>${columns.map(([, v]) => `<td>${v[i]}</td>`).join("")}</tr>`
        )
        .join("");
    let averages = ["", "", ...output.averageTimes].map(
        (v) => `<td>${v === "" ? "" : round(v)}</td>`
    );
    card.insertAdjacentHTML(
        "beforeend",
        `<div class="table-wrap"><table class="data-table">
            <thead><tr><th>Process</th>${columns.map(([name]) => `<th>${name}</th>`).join("")}</tr></thead>
            <tbody>${body}</tbody>
            <tfoot><tr><td>Average</td>${averages.join("")}</tr></tfoot>
        </table></div>`
    );
}

//---------- time log player ----------

let timeLogTimer = null;

function stopTimeLog() {
    clearInterval(timeLogTimer);
    timeLogTimer = null;
}

function laneOf(state, id) {
    return Object.keys(LANES).find((lane) => state[lane].includes(id));
}

function showTimeLog(output) {
    let log = output.timeLog;
    let card = section("Time log", "Step through how processes move between states.");
    card.insertAdjacentHTML(
        "beforeend",
        `<div class="player">
            <button type="button" class="icon" data-step="-1" aria-label="Previous step">&#9664;</button>
            <button type="button" class="primary" id="time-log-play">Play</button>
            <button type="button" class="icon" data-step="1" aria-label="Next step">&#9654;</button>
            <input type="range" min="0" max="${log.length - 1}" value="0" aria-label="Time log step" />
            <span class="player-time"></span>
        </div>
        <div class="lanes">${Object.entries(LANES)
            .map(
                ([lane, name]) =>
                    `<div class="lane ${lane}"><h4>${name}</h4><div class="chips"></div></div>`
            )
            .join("")}</div>
        <p class="moves"></p>`
    );
    let slider = card.querySelector("input[type=range]");
    let playButton = card.querySelector("#time-log-play");
    let chips = card.querySelectorAll(".chips");

    function render(index) {
        index = Math.min(Math.max(index, 0), log.length - 1);
        slider.value = index;
        let state = log[index];
        let previous = log[index - 1];
        let moves = [];
        Object.keys(LANES).forEach((lane, i) => {
            chips[i].innerHTML = state[lane]
                .map((id) => {
                    let from = previous && laneOf(previous, id);
                    let moved = from && from !== lane;
                    if (moved) {
                        moves.push(`P${id + 1}: ${LANES[from]} → ${LANES[lane]}`);
                    }
                    return `<span class="chip${moved ? " moved" : ""}">P${id + 1}</span>`;
                })
                .join("");
        });
        card.querySelector(".player-time").textContent =
            state.time < 0 ? "Start" : "t = " + state.time;
        card.querySelector(".moves").textContent = moves.join(" · ");
    }

    function setPlaying(playing) {
        stopTimeLog();
        playButton.textContent = playing ? "Pause" : "Play";
        if (!playing) {
            return;
        }
        if (Number(slider.value) === log.length - 1) {
            render(0);
        }
        timeLogTimer = setInterval(() => {
            let next = Number(slider.value) + 1;
            render(next);
            if (next >= log.length - 1) {
                setPlaying(false);
            }
        }, 1000);
    }

    playButton.onclick = () => setPlaying(timeLogTimer === null);
    slider.oninput = () => {
        setPlaying(false);
        render(Number(slider.value));
    };
    card.querySelectorAll("[data-step]").forEach((button) => {
        button.onclick = () => {
            setPlaying(false);
            render(Number(slider.value) + Number(button.dataset.step));
        };
    });
    render(0);
}

//---------- comparison charts ----------

function drawChart(card, type, labels, datasets, xLabel) {
    Chart.defaults.global.defaultFontColor = css("--muted");
    Chart.defaults.scale.gridLines.color = css("--border");
    let box = document.createElement("div");
    box.className = "chart-box";
    let canvas = document.createElement("canvas");
    box.appendChild(canvas);
    card.appendChild(box);
    new Chart(canvas, {
        type,
        data: { labels, datasets },
        options: {
            maintainAspectRatio: false,
            scales: {
                yAxes: [{ ticks: { beginAtZero: true } }],
                xAxes: [{ scaleLabel: { display: true, labelString: xLabel } }],
            },
        },
    });
}

function showRoundRobinChart(input) {
    let card = section(
        "Round Robin by time quantum",
        "Averages for every quantum up to the longest CPU burst. Lower is better."
    );
    let longestBurst = Math.max(
        ...input.processTime.flatMap((bursts) => bursts.filter((_, j) => j % 2 === 0))
    );
    let quanta = [];
    let series = [[], [], [], [], []];
    for (let quantum = 1; quantum <= longestBurst; quantum++) {
        let rrInput = readInput("rr");
        rrInput.timeQuantum = quantum;
        let output = schedule(rrInput);
        quanta.push(quantum);
        output.averageTimes.forEach((value, i) => series[i].push(value));
        series[4].push(Math.max(0, output.contextSwitches - 1));
    }
    let datasets = [...METRICS, ["Context switches", "#990099"]].map(([label, color], i) => ({
        label,
        data: series[i],
        borderColor: color,
        backgroundColor: color,
        fill: false,
    }));
    drawChart(card, "line", quanta, datasets, "Time quantum");
}

function showAlgorithmChart() {
    let card = section(
        "Algorithm comparison",
        "Average times for the same processes under every algorithm. Lower is better."
    );
    let algorithms = Object.keys(ALGORITHM_NAMES);
    let averages = algorithms.map((algorithm) => schedule(readInput(algorithm)).averageTimes);
    let datasets = METRICS.map(([label, color], i) => ({
        label,
        data: averages.map((times) => times[i]),
        backgroundColor: color,
    }));
    drawChart(card, "bar", Object.values(ALGORITHM_NAMES), datasets, "Algorithm");
}

//---------- wiring ----------

function calculate() {
    stopTimeLog();
    outputDiv.innerHTML = "";
    let input = readInput();
    let output = schedule(input);
    showSummary(input, output);
    showGanttChart(output);
    showTimelineChart(input, output);
    showFinalTable(input, output);
    showTimeLog(output);
    if (input.algorithm === "rr") {
        showRoundRobinChart(input);
    }
    showAlgorithmChart();
    outputDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

algoSelect.onchange = syncSettings;
document.getElementById("add-process").onclick = addProcess;
document.getElementById("reset").onclick = reset;
document.getElementById("calculate").onclick = calculate;

addProcess();
syncSettings();
