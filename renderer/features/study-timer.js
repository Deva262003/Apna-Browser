const timerBtn = document.getElementById('timer-btn');
const floatingTimer = document.getElementById('floating-timer');
const timerDisplay = document.getElementById('timer-display');
const timerPause = document.getElementById('timer-pause');
const timerStop = document.getElementById('timer-stop');
const timerMini = document.getElementById('timer-mini');

let timerInterval = null;
let timeRemaining = 25 * 60;
let isTimerRunning = false;
let isPaused = false;

timerBtn.addEventListener('click', startStudyTimer);
timerPause.addEventListener('click', togglePauseTimer);
timerStop.addEventListener('click', stopStudyTimer);

function startStudyTimer() {
  if (isTimerRunning) {
    // Keep timer visible while a session is active.
    floatingTimer.classList.remove('hidden');
    showNotification('Timer is already running', 'info');
    return;
  }

  floatingTimer.classList.remove('hidden');
  isTimerRunning = true;
  isPaused = false;
  timeRemaining = 25 * 60;
  timerPause.textContent = '⏸';
  updateTimerDisplay();
  showMiniTimer();

  runTimer();
  showNotification('⏱️ Study session started! Focus for 25 minutes.', 'success');
}

function runTimer() {
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeRemaining--;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        timerComplete();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timerDisplay.textContent = formatted;
  if (timerMini) {
    timerMini.textContent = `Timer: ${formatted}`;
  }
}

function togglePauseTimer() {
  isPaused = !isPaused;
  timerPause.textContent = isPaused ? '▶️' : '⏸';
  showNotification(isPaused ? 'Timer paused' : 'Timer resumed', 'info');
}

function stopStudyTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  isPaused = false;
  timeRemaining = 25 * 60;
  floatingTimer.classList.add('hidden');
  timerDisplay.textContent = '25:00';
  if (timerMini) {
    timerMini.classList.add('hidden');
    timerMini.textContent = 'Timer: 25:00';
  }
  timerPause.textContent = '⏸';
  showNotification('Timer stopped', 'info');
}

function timerComplete() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  isPaused = false;
  timeRemaining = 0;
  updateTimerDisplay();
  if (timerMini) {
    timerMini.classList.add('hidden');
  }

  showNotification('🎉 Session complete! Take a 5-minute break.', 'success');
  showSessionCompletePopup();

  try {
    new Audio('assets/sounds/timer-end.mp3').play();
  } catch {}

  const stats = getStorage('studyStats') || {};
  const today = new Date().toDateString();
  if (!stats[today]) stats[today] = { minutes: 0 };
  stats[today].minutes += 25;
  setStorage('studyStats', stats);
  updateStudyDisplay();
}

function showSessionCompletePopup() {
  const existing = document.getElementById('session-complete-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'session-complete-modal';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    width: min(440px, 92vw);
    background: white;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    border: 1px solid #e2e8f0;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
  `;

  card.innerHTML = `
    <div style="font-size: 34px; margin-bottom: 8px;">🎉</div>
    <h3 style="margin-bottom: 8px; color: #0f172a;">Session Completed</h3>
    <p style="color: #475569; margin-bottom: 16px;">Great work! Your 25-minute study session is complete.</p>
    <button id="session-complete-ok" style="padding: 10px 16px; border: none; border-radius: 8px; background: #f59e0b; color: white; font-weight: 700; cursor: pointer;">OK</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  document.getElementById('session-complete-ok').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function showMiniTimer() {
  if (!timerMini) return;
  timerMini.classList.remove('hidden');
}
