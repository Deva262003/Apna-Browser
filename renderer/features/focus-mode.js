const focusBtn = document.getElementById('focus-btn');
const focusStatus = document.getElementById('focus-status');

let focusModeActive = false;
window.isFocusModeActive = () => focusModeActive;

focusBtn.addEventListener('click', toggleFocusMode);

function toggleFocusMode() {
  focusModeActive = !focusModeActive;

  if (focusModeActive) {
    focusBtn.classList.add('active');
    focusStatus.classList.remove('hidden');
    showNotification('Focus Mode Activated', 'success');
  } else {
    focusBtn.classList.remove('active');
    focusStatus.classList.add('hidden');
    showNotification('Focus Mode Deactivated', 'info');
  }
}
