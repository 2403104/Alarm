let timer;
let isRunning = false;
let isWork = true;
let remainingSeconds = 0;

const statusEl = document.getElementById("status");
const countdownEl = document.getElementById("countdown");
const timeLeftEl = document.getElementById("timeLeft");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");
const alarmSound = document.getElementById("alarmSound");

// Listen for messages from the service worker (e.g., notification action)
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "STOP_ALARM") {
      stopAlarm();
    }
  });
}

function startTimer() {
  if (isRunning) return;

  const workMinutes = parseInt(document.getElementById("workTime").value) || 25;
  const restMinutes = parseInt(document.getElementById("restTime").value) || 5;

  remainingSeconds = workMinutes * 60;
  isWork = true;
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  stopAlarmBtn.disabled = true;
  updateDisplay();

  timer = setInterval(() => {
    remainingSeconds--;
    updateDisplay();

    if (remainingSeconds <= 0) {
      // Ensure impactful, continuous alarm
      alarmSound.pause();
      alarmSound.currentTime = 0;
      alarmSound.volume = 1.0;
      const playPromise = alarmSound.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          statusEl.textContent = "Alarm (click Stop Alarm to silence)";
        });
      }
      stopAlarmBtn.disabled = false;
      // Show a notification with an action to stop the alarm
      if ("Notification" in window && Notification.permission !== "denied") {
        const ensurePermission = Notification.permission === "granted"
          ? Promise.resolve("granted")
          : Notification.requestPermission();

        ensurePermission.then((perm) => {
          if (perm === "granted") {
            const title = isWork ? "Work session complete" : "Rest session complete";
            const body = "Tap Stop Alarm to silence";
            const options = {
              body,
              silent: true,
              actions: [{ action: "stop-alarm", title: "Stop Alarm" }],
              tag: "eye-care-timer-alarm",
              renotify: true,
              data: { ts: Date.now() }
            };
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, options);
              });
            } else if (Notification && Notification.prototype && Notification.prototype.constructor) {
              // Fallback (no SW) — action buttons require SW in most browsers
              new Notification(title, options);
            }
          }
        });
      }
      if (isWork) {
        remainingSeconds = restMinutes * 60;
        isWork = false;
      } else {
        remainingSeconds = workMinutes * 60;
        isWork = true;
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  alarmSound.pause();
  alarmSound.currentTime = 0;
  statusEl.textContent = "Stopped";
  countdownEl.textContent = "--:--";
  timeLeftEl.textContent = "";
  startBtn.disabled = false;
  stopBtn.disabled = true;
  stopAlarmBtn.disabled = true;
}


function updateDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (isWork) {
    statusEl.textContent = "Work Time ⏳";
    timeLeftEl.textContent = `Rest starts in ${minutes}m ${seconds}s`;
  } else {
    statusEl.textContent = "Rest Time 😌";
    timeLeftEl.textContent = `Work starts in ${minutes}m ${seconds}s`;
  }
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
stopAlarmBtn.addEventListener("click", stopAlarm);

function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0;
  stopAlarmBtn.disabled = true;
}
