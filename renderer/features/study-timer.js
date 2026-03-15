const timerBtn = document.getElementById('timer-btn');
const floatingTimer = document.getElementById('floating-timer');
const timerDisplay = document.getElementById('timer-display');
const timerPause = document.getElementById('timer-pause');
const timerStop = document.getElementById('timer-stop');

let timerInterval = null;
let timeRemaining = 25 * 60;
let isTimerRunning = false;
let isPaused = false;

timerBtn.addEventListener('click', startStudyTimer);
timerPause.addEventListener('click', togglePauseTimer);
timerStop.addEventListener('click', stopStudyTimer);

function startStudyTimer() {
  if (isTimerRunning) {
    floatingTimer.classList.toggle('hidden');
    return;
  }

  floatingTimer.classList.remove('hidden');
  isTimerRunning = true;
  isPaused = false;
  timeRemaining = 25 * 60;

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
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  timerPause.textContent = '⏸';
  showNotification('Timer stopped', 'info');
}

function timerComplete() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  showNotification('🎉 Session complete! Take a 5-minute break.', 'success');

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
