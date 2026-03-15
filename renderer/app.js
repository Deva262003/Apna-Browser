const webview = document.getElementById('webview');
const urlBar = document.getElementById('url-bar');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const progressBar = document.getElementById('progress-bar');
const sidebar = document.getElementById('sidebar');
const sidebarTitle = document.getElementById('sidebar-title');
const sidebarContent = document.getElementById('sidebar-content');
const closeSidebarBtn = document.getElementById('close-sidebar');

function init() {
  setupEventListeners();
  updateNavButtons();
  loadStudyStats();
}

function setupEventListeners() {
  goBtn.addEventListener('click', navigateToUrl);
  urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') navigateToUrl();
  });

  backBtn.addEventListener('click', () => webview.goBack());
  forwardBtn.addEventListener('click', () => webview.goForward());
  refreshBtn.addEventListener('click', () => webview.reload());
  homeBtn.addEventListener('click', () => webview.loadURL('homepage.html'));
  closeSidebarBtn.addEventListener('click', closeSidebar);

  webview.addEventListener('did-start-loading', handleLoadStart);
  webview.addEventListener('did-stop-loading', handleLoadStop);
  webview.addEventListener('did-navigate', handleNavigate);

  document.addEventListener('keydown', handleKeyboard);
}

function navigateToUrl() {
  let url = urlBar.value.trim();
  if (!url) return;

  if (!url.includes('.') || url.includes(' ')) {
    url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  } else if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  webview.loadURL(url);
}

function handleLoadStart() {
  progressBar.classList.add('loading');
  updateNavButtons();
}

function handleLoadStop() {
  progressBar.classList.remove('loading');
  updateNavButtons();
  trackStudyTime();
}

function handleNavigate() {
  const currentUrl = webview.getURL();
  if (!currentUrl.startsWith('file://')) {
    urlBar.value = currentUrl;
  }
  updateNavButtons();
}

function updateNavButtons() {
  backBtn.disabled = !webview.canGoBack();
  forwardBtn.disabled = !webview.canGoForward();
}

function handleKeyboard(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'l':
        e.preventDefault();
        urlBar.select();
        break;
      case 'r':
        e.preventDefault();
        webview.reload();
        break;
    }
  }

  if (e.altKey) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (webview.canGoBack()) webview.goBack();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (webview.canGoForward()) webview.goForward();
    }
  }
}

function openSidebar(title, content) {
  sidebarTitle.textContent = title;
  sidebarContent.innerHTML = content || '<p>Loading...</p>';
  sidebar.classList.remove('hidden');
}

function closeSidebar() {
  sidebar.classList.add('hidden');
}

function trackStudyTime() {
  const today = new Date().toDateString();
  const stats = getStorage('studyStats') || {};

  if (!stats[today]) {
    stats[today] = { minutes: 0 };
  }

  stats[today].minutes += 1;
  setStorage('studyStats', stats);
  updateStudyDisplay();
}

function loadStudyStats() {
  updateStudyDisplay();
  updateStreak();
}

function updateStudyDisplay() {
  const today = new Date().toDateString();
  const stats = getStorage('studyStats') || {};
  const todayMinutes = stats[today] ? stats[today].minutes : 0;

  const hours = Math.floor(todayMinutes / 60);
  const mins = todayMinutes % 60;

  document.getElementById('today-time').textContent = `${hours}h ${mins}m`;
}

function updateStreak() {
  const stats = getStorage('studyStats') || {};
  const dates = Object.keys(stats).sort().reverse();

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    if (diff === i) {
      streak++;
    } else {
      break;
    }
  }

  document.getElementById('streak-count').textContent = streak;
}

async function executeInWebview(script) {
  try {
    return await webview.executeJavaScript(script);
  } catch (error) {
    console.error('Script execution failed:', error);
    return null;
  }
}

async function extractPageContent() {
  return await executeInWebview(`
    (function() {
      const article = document.querySelector('article') ||
                      document.querySelector('main') ||
                      document.querySelector('.content') ||
                      document.body;
      return article.innerText.substring(0, 5000);
    })()
  `);
}

document.addEventListener('DOMContentLoaded', init);
