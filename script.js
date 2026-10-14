
/* =========================
   FOCUSLY — POMODORO TIMER
========================= */

// DOM Elements
const timerDisplay = document.querySelector("#timer");
const startBtn = document.querySelector("#start-btn");
const resetBtn = document.querySelector("#reset-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const sessionLabel = document.querySelector("#session-label");

const totalFocusDisplay = document.querySelector("#total-focus");
const completedSessionsDisplay = document.querySelector(
    "#completed-sessions"
);

// Timer Configuration (in seconds)
const modes = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

// Timer State
let currentMode = "focus";
let timeLeft = modes[currentMode];
let timerInterval = null;
let endTime = null;
let isRunning = false;

// Session State
let sessionCount = 1;

// Load saved statistics
function loadStats() {
    try {
        const savedStats = JSON.parse(
            localStorage.getItem("focusly-stats")
        );

        if (
            savedStats &&
            Number.isFinite(savedStats.totalFocusSeconds) &&
            savedStats.totalFocusSeconds >= 0 &&
            Number.isFinite(savedStats.completedSessions) &&
            savedStats.completedSessions >= 0
        ) {
            return {
                totalFocusSeconds: savedStats.totalFocusSeconds,
                completedSessions: savedStats.completedSessions
            };
        }
    } catch (error) {
        console.warn("Could not load saved statistics:", error);
    }

    return {
        totalFocusSeconds: 0,
        completedSessions: 0
    };
}

const stats = loadStats();

// =========================
// DISPLAY FUNCTIONS
// =========================

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
    document.title = `${formatTime(timeLeft)} — Focusly`;
}

function updateStatsDisplay() {
    const totalMinutes = Math.floor(
        stats.totalFocusSeconds / 60
    );

    totalFocusDisplay.textContent = `${totalMinutes} min`;
    completedSessionsDisplay.textContent =
        stats.completedSessions;
}

function saveStats() {
    try {
        localStorage.setItem(
            "focusly-stats",
            JSON.stringify(stats)
        );
    } catch (error) {
        console.warn("Could not save statistics:", error);
    }
}

function updateSessionLabel(message) {
    const sessionNumber = String(sessionCount).padStart(2, "0");

    sessionLabel.textContent =
        `SESSION ${sessionNumber} · ${message}`;
}

// =========================
// TIMER CONTROLS
// =========================

function startTimer() {
    if (isRunning) {
        pauseTimer();
        return;
    }

    isRunning = true;
    endTime = Date.now() + timeLeft * 1000;

    startBtn.textContent = "Pause";
    updateSessionLabel(
        currentMode === "focus" ? "TIME TO FOCUS" : "TAKE A BREAK"
    );

    // Update immediately, then check every second.
    tick();

    if (timeLeft > 0) {
        timerInterval = setInterval(tick, 250);
    }
}

function tick() {
    const remaining = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
    );

    // Count elapsed focus time only.
    const elapsed = timeLeft - remaining;

    if (currentMode === "focus" && elapsed > 0) {
        stats.totalFocusSeconds += elapsed;
        timeLeft = remaining;

        saveStats();
        updateStatsDisplay();
    } else {
        timeLeft = remaining;
    }

    updateTimerDisplay();

    if (timeLeft <= 0) {
        completeTimer();
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;

    isRunning = false;
    endTime = null;

    startBtn.textContent = "Resume";
    updateSessionLabel("PAUSED");
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;

    isRunning = false;
    endTime = null;
    timeLeft = modes[currentMode];

    startBtn.textContent =
        currentMode === "focus" ? "Start Focus" : "Start Break";

    updateTimerDisplay();
    updateSessionLabel("READY TO START");
}

function completeTimer() {
    clearInterval(timerInterval);
    timerInterval = null;

    isRunning = false;
    endTime = null;
    timeLeft = 0;

    stats.completedSessions++;

    saveStats();
    updateStatsDisplay();
    updateTimerDisplay();

    startBtn.textContent = "Start Again";
    updateSessionLabel("SESSION COMPLETED");

    sessionCount++;

    // Notify the user when the timer finishes.
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Focusly", {
            body: currentMode === "focus"
                ? "Focus session complete! Time for a break."
                : "Break complete! Ready to focus again?"
        });
    } else {
        alert(
            currentMode === "focus"
                ? "Focus session complete! Time for a break."
                : "Break complete! Ready to focus again?"
        );
    }
}

// =========================
// MODE SWITCHING
// =========================

function switchMode(mode) {
    if (!Object.hasOwn(modes, mode)) {
        return;
    }

    currentMode = mode;
    timeLeft = modes[currentMode];

    // Stop the previous timer.
    clearInterval(timerInterval);
    timerInterval = null;

    isRunning = false;
    endTime = null;

    // Update active button.
    modeButtons.forEach((button) => {
        const isActive = button.dataset.mode === mode;

        button.classList.toggle("active", isActive);
        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });

    startBtn.textContent =
        mode === "focus" ? "Start Focus" : "Start Break";

    updateTimerDisplay();
    updateSessionLabel(
        mode === "focus" ? "TIME TO FOCUS" : "TAKE A BREAK"
    );
}

// =========================
// EVENT LISTENERS
// =========================

startBtn.addEventListener("click", startTimer);

resetBtn.addEventListener("click", resetTimer);

modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        switchMode(button.dataset.mode);
    });
});

// =========================
// INITIALIZE APP
// =========================

updateTimerDisplay();
updateStatsDisplay();
updateSessionLabel("READY TO START");
