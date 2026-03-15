const focusBtn = document.getElementById('focus-btn');
const focusStatus = document.getElementById('focus-status');

let focusModeActive = false;
let blockedSites = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'reddit.com'];

focusBtn.addEventListener('click', toggleFocusMode);

function toggleFocusMode() {
  focusModeActive = !focusModeActive;

  if (focusModeActive) {
    focusBtn.classList.add('active');
    focusStatus.classList.remove('hidden');
    showNotification('🎯 Focus Mode Activated!', 'success');
    startBlockingDistractions();
  } else {
    focusBtn.classList.remove('active');
    focusStatus.classList.add('hidden');
    showNotification('Focus Mode Deactivated', 'info');
    stopBlockingDistractions();
  }
}

function startBlockingDistractions() {
  webview.addEventListener('will-navigate', blockDistractingSites);
  webview.addEventListener('did-start-navigation', blockDistractingSites);
}

function stopBlockingDistractions() {
  webview.removeEventListener('will-navigate', blockDistractingSites);
  webview.removeEventListener('did-start-navigation', blockDistractingSites);
}

function blockDistractingSites(event) {
  if (!focusModeActive) return;

  const url = event.url || webview.getURL();
  const isBlocked = blockedSites.some(site => url.includes(site));

  if (isBlocked) {
    event.preventDefault();
    webview.loadURL('blocked-page.html');
    showNotification('⛔ Site blocked! Stay focused!', 'error');
  }
}
