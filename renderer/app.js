let webview = null;
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
const pageStatus = document.getElementById('page-status');
const tabsList = document.getElementById('tabs-list');
const webviewStack = document.getElementById('webview-stack');
const moreToolsBtn = document.getElementById('more-tools-btn');
const toolsMenu = document.getElementById('tools-menu');

let tabs = [];
let activeTabId = null;
let tabCounter = 0;
const HOME_PAGE_URL = new URL('homepage.html', window.location.href).toString();
const BLOCKED_PAGE_URL = new URL('blocked-page.html', window.location.href).toString();

const ALWAYS_BLOCKED_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'xhamster.com',
  'youporn.com', 'spankbang.com', 'tube8.com', 'beeg.com', 'hqporner.com'
];

const ALWAYS_BLOCKED_KEYWORDS = [
  'porn', 'sex', 'xxx', 'adult', 'nude', 'hentai', 'camgirl', 'escort', 'nsfw'
];

const FOCUS_ALLOWED_DOMAINS = [
  'youtube.com', 'youtu.be', 'google.com', 'scholar.google.com',
  'wikipedia.org', 'khanacademy.org', 'coursera.org', 'edx.org',
  'nptel.ac.in', 'ncert.nic.in', 'geeksforgeeks.org', 'byjus.com',
  'unacademy.com', 'udemy.com', 'openstax.org', 'archive.org',
  'mit.edu', 'stanford.edu', 'harvard.edu'
];
const HISTORY_STORAGE_KEY = 'browserHistory';
const MAX_HISTORY_ITEMS = 250;

function init() {
  setupEventListeners();
  bindFeatureInteractions();
  bindAmbientMotion();
  createTab(HOME_PAGE_URL, true);
  loadStudyStats();
  setStatus('Ready', false);
}

function setupEventListeners() {
  goBtn.addEventListener('click', navigateToUrl);
  urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') navigateToUrl();
  });

  urlBar.addEventListener('focus', () => setStatus('Type a topic or URL', false));
  urlBar.addEventListener('blur', () => setStatus('Ready', false));

  backBtn.addEventListener('click', () => {
    if (webview && webview.canGoBack()) webview.goBack();
  });

  forwardBtn.addEventListener('click', () => {
    if (webview && webview.canGoForward()) webview.goForward();
  });

  refreshBtn.addEventListener('click', () => {
    if (webview) webview.reload();
  });

  homeBtn.addEventListener('click', () => {
    if (webview) {
      webview.loadURL(HOME_PAGE_URL);
      setStatus('Home', false);
    }
  });

  closeSidebarBtn.addEventListener('click', closeSidebar);
  setupToolsMenu();
  document.addEventListener('keydown', handleKeyboard);
}

function createTab(initialUrl = HOME_PAGE_URL, activate = true) {
  const id = `tab-${++tabCounter}`;
  const webviewEl = document.createElement('webview');
  webviewEl.className = 'tab-webview';
  webviewEl.setAttribute('src', initialUrl);
  webviewEl.setAttribute('allowpopups', '');
  webviewEl.dataset.tabId = id;

  const tab = {
    id,
    title: 'New Tab',
    url: initialUrl,
    webviewEl
  };

  const activeIndex = tabs.findIndex((item) => item.id === activeTabId);
  const insertIndex = activeIndex >= 0 ? activeIndex + 1 : tabs.length;

  tabs.splice(insertIndex, 0, tab);
  if (insertIndex >= webviewStack.children.length) {
    webviewStack.appendChild(webviewEl);
  } else {
    webviewStack.insertBefore(webviewEl, webviewStack.children[insertIndex]);
  }

  attachWebviewEvents(tab);

  if (activate) {
    switchTab(id);
  } else {
    renderTabs();
  }

  return tab;
}

function attachWebviewEvents(tab) {
  const view = tab.webviewEl;

  if (typeof window.bindDictionaryToWebview === 'function') {
    window.bindDictionaryToWebview(view);
  }

  view.addEventListener('did-start-loading', () => {
    if (tab.id === activeTabId) handleLoadStart();
  });

  view.addEventListener('did-stop-loading', () => {
    updateTabFromWebview(tab);
    addHistoryEntry(safeGetUrl(view), tab.title);
    if (tab.id === activeTabId) handleLoadStop();
  });

  const onNavigate = () => {
    updateTabFromWebview(tab);
    if (tab.id === activeTabId) handleNavigate(view);
  };

  view.addEventListener('did-navigate', onNavigate);
  view.addEventListener('did-navigate-in-page', onNavigate);

  view.addEventListener('will-navigate', (event) => {
    const decision = evaluateNavigationPolicy(event.url);
    if (!decision.allow) {
      event.preventDefault();
      handleBlockedNavigation(view, decision.reason, event.url);
    }
  });

  view.addEventListener('page-title-updated', (event) => {
    if (event && event.title) {
      tab.title = event.title;
      renderTabs();
    }
  });

  view.addEventListener('new-window', (event) => {
    if (event && event.url) {
      const decision = evaluateNavigationPolicy(event.url);
      if (!decision.allow) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        handleBlockedNavigation(view, decision.reason, event.url);
        return;
      }
      createTab(event.url, true);
    }
  });
}

function updateTabFromWebview(tab) {
  const currentUrl = safeGetUrl(tab.webviewEl);
  if (currentUrl) {
    tab.url = currentUrl;
    if (!currentUrl.startsWith('file://')) {
      tab.title = deriveTabTitle(currentUrl);
    } else {
      tab.title = 'New Tab';
    }
    renderTabs();
  }
}

function switchTab(tabId) {
  const tab = tabs.find((item) => item.id === tabId);
  if (!tab) return;

  activeTabId = tabId;
  webview = tab.webviewEl;

  tabs.forEach((item) => {
    item.webviewEl.classList.toggle('active', item.id === tabId);
  });

  const currentUrl = safeGetUrl(webview);
  if (currentUrl && !currentUrl.startsWith('file://')) {
    urlBar.value = currentUrl;
  } else {
    urlBar.value = '';
  }

  updateNavButtons();
  renderTabs();
}

function closeTab(tabId) {
  if (tabs.length <= 1) {
    const onlyTab = tabs[0];
    if (onlyTab && onlyTab.webviewEl) {
      onlyTab.webviewEl.loadURL(HOME_PAGE_URL);
    }
    return;
  }

  const idx = tabs.findIndex((item) => item.id === tabId);
  if (idx < 0) return;

  const tab = tabs[idx];
  tab.webviewEl.remove();
  tabs.splice(idx, 1);

  if (activeTabId === tabId) {
    const nextTab = tabs[Math.max(0, idx - 1)] || tabs[0];
    switchTab(nextTab.id);
  } else {
    renderTabs();
  }
}

function renderTabs() {
  tabsList.innerHTML = '';
  let addInserted = false;

  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.className = `tab-pill${tab.id === activeTabId ? ' active' : ''}`;
    button.type = 'button';

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'New Tab';

    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = 'x';
    close.title = 'Close tab';

    button.appendChild(title);
    button.appendChild(close);

    button.addEventListener('click', (e) => {
      if (e.target === close) {
        closeTab(tab.id);
        return;
      }
      switchTab(tab.id);
    });

    tabsList.appendChild(button);

    if (tab.id === activeTabId) {
      tabsList.appendChild(createNewTabButton());
      addInserted = true;
    }
  });

  if (!addInserted) {
    tabsList.appendChild(createNewTabButton());
  }
}

function navigateToUrl() {
  if (!webview) return;

  const input = urlBar.value.trim();
  if (!input) return;

  const url = normalizeInputToUrl(input);
  const decision = evaluateNavigationPolicy(url, input);
  if (!decision.allow) {
    handleBlockedNavigation(webview, decision.reason, url);
    return;
  }

  setStatus('Navigating...', true);
  webview.loadURL(url);
}

function handleLoadStart() {
  progressBar.classList.add('loading');
  setStatus('Loading page...', true);
  updateNavButtons();
}

function handleLoadStop() {
  progressBar.classList.remove('loading');
  setStatus('Ready', false);
  updateNavButtons();
  trackStudyTime();
}

function handleNavigate(currentWebview = webview) {
  if (!currentWebview) return;

  const currentUrl = safeGetUrl(currentWebview);
  if (currentUrl && !currentUrl.startsWith('file://')) {
    urlBar.value = currentUrl;
  }

  try {
    const host = currentUrl ? new URL(currentUrl).host : 'Page opened';
    setStatus(host || 'Page opened', false);
  } catch {
    setStatus('Ready', false);
  }

  updateNavButtons();
}

function updateNavButtons() {
  backBtn.disabled = !webview || !webview.canGoBack();
  forwardBtn.disabled = !webview || !webview.canGoForward();
}

function handleKeyboard(e) {
  if (e.key === 'Escape') {
    closeToolsMenu();
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'l':
        e.preventDefault();
        urlBar.focus();
        urlBar.select();
        break;
      case 'r':
        e.preventDefault();
        if (webview) webview.reload();
        break;
      case 't':
        e.preventDefault();
        createTab(HOME_PAGE_URL, true);
        break;
      case 'w':
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
        break;
    }
  }

  if (e.altKey) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (webview && webview.canGoBack()) webview.goBack();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (webview && webview.canGoForward()) webview.goForward();
    }
  }
}

function bindFeatureInteractions() {
  document.querySelectorAll('.tools-item').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.remove('pulse');
      void button.offsetWidth;
      button.classList.add('pulse');
      closeToolsMenu();
    });
  });
}

function bindAmbientMotion() {
  let ticking = false;

  const move = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (ticking) return;

    window.requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * 22;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      document.body.style.setProperty('--mx', `${x}px`);
      document.body.style.setProperty('--my', `${y}px`);
      ticking = false;
    });

    ticking = true;
  };

  window.addEventListener('pointermove', move);
}

function setStatus(text, isLoading) {
  if (!pageStatus) return;
  pageStatus.textContent = text;
  if (isLoading) {
    pageStatus.style.borderColor = 'rgba(245, 158, 11, 0.55)';
    pageStatus.style.color = '#b45309';
    pageStatus.style.background = 'rgba(245, 158, 11, 0.12)';
  } else {
    pageStatus.style.borderColor = 'rgba(15, 23, 42, 0.22)';
    pageStatus.style.color = '#334155';
    pageStatus.style.background = 'rgba(148, 163, 184, 0.12)';
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

  const todayTimeEl = document.getElementById('today-time');
  if (todayTimeEl) {
    todayTimeEl.textContent = `${hours}h ${mins}m`;
  }
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

  const streakEl = document.getElementById('streak-count');
  if (streakEl) {
    streakEl.textContent = streak;
  }
}

function addHistoryEntry(url, title = '') {
  if (!url || url.startsWith('file://') || url.startsWith('about:blank')) return;
  if (url.includes('blocked-page.html')) return;

  const history = getStorage(HISTORY_STORAGE_KEY) || [];
  const nowIso = new Date().toISOString();
  const cleanTitle = title && title !== 'New Tab' ? title : deriveTabTitle(url);
  const existingIndex = history.findIndex((item) => item.url === url);

  if (existingIndex >= 0) {
    const existing = history[existingIndex];
    history.splice(existingIndex, 1);
    history.unshift({
      ...existing,
      title: cleanTitle || existing.title || 'Untitled',
      lastVisited: nowIso,
      visits: Number(existing.visits || 0) + 1
    });
  } else {
    history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      title: cleanTitle || 'Untitled',
      lastVisited: nowIso,
      visits: 1
    });
  }

  setStorage(HISTORY_STORAGE_KEY, history.slice(0, MAX_HISTORY_ITEMS));
}

function getBrowserHistory() {
  const history = getStorage(HISTORY_STORAGE_KEY) || [];
  return Array.isArray(history) ? history : [];
}

function clearBrowserHistory() {
  setStorage(HISTORY_STORAGE_KEY, []);
}

function removeHistoryItem(itemId) {
  if (!itemId) return;
  const history = getBrowserHistory().filter((entry) => entry.id !== itemId);
  setStorage(HISTORY_STORAGE_KEY, history);
}

function openHistoryUrl(url) {
  if (!url || !webview) return;
  const decision = evaluateNavigationPolicy(url, url);
  if (!decision.allow) {
    handleBlockedNavigation(webview, decision.reason, url);
    return;
  }
  webview.loadURL(url);
  closeSidebar();
}

async function executeInWebview(script) {
  if (!webview) return null;

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

function safeGetUrl(view) {
  try {
    return view && view.getURL ? view.getURL() : '';
  } catch (error) {
    return '';
  }
}

function deriveTabTitle(url) {
  if (!url) return 'New Tab';
  if (url.startsWith('file://')) return 'New Tab';

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '') || 'Page';
  } catch (error) {
    return 'Page';
  }
}

function normalizeInputToUrl(input) {
  let url = input.trim();
  if (!url.includes('.') || url.includes(' ')) {
    return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  }
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  return url;
}

function evaluateNavigationPolicy(url, rawInput = '') {
  if (!url) return { allow: true, reason: '' };

  if (isAdultBlocked(url, rawInput)) {
    return { allow: false, reason: 'Adult content is blocked in this browser.' };
  }

  if (isFocusModeEnabled() && !isEducationAllowed(url)) {
    return { allow: false, reason: 'Focus Mode allows only education-related websites.' };
  }

  return { allow: true, reason: '' };
}

function isAdultBlocked(url, rawInput = '') {
  const normalizedInput = String(rawInput || '').toLowerCase();
  const normalizedUrl = String(url || '').toLowerCase();

  if (ALWAYS_BLOCKED_KEYWORDS.some((word) => normalizedInput.includes(word))) {
    return true;
  }

  if (ALWAYS_BLOCKED_KEYWORDS.some((word) => normalizedUrl.includes(word))) {
    return true;
  }

  const host = getHost(url);
  if (!host) return false;
  return ALWAYS_BLOCKED_DOMAINS.some((domain) => hostMatchesDomain(host, domain));
}

function isEducationAllowed(url) {
  if (!url) return true;
  if (url.startsWith('file://')) return true;
  if (url.startsWith('about:blank')) return true;

  const host = getHost(url);
  if (!host) return true;

  return FOCUS_ALLOWED_DOMAINS.some((domain) => hostMatchesDomain(host, domain));
}

function isFocusModeEnabled() {
  if (typeof window.isFocusModeActive === 'function') {
    return Boolean(window.isFocusModeActive());
  }
  return false;
}

function hostMatchesDomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function getHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
}

function handleBlockedNavigation(view, reason, attemptedUrl) {
  showNotification(reason, 'error');
  setStatus('Blocked', false);

  if (view && typeof view.loadURL === 'function') {
    view.loadURL(BLOCKED_PAGE_URL);
  }

  if (attemptedUrl && !attemptedUrl.startsWith('file://')) {
    urlBar.value = attemptedUrl;
  }
}

function setupToolsMenu() {
  if (!moreToolsBtn || !toolsMenu) return;

  moreToolsBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = toolsMenu.classList.contains('open');
    if (isOpen) {
      closeToolsMenu();
    } else {
      openToolsMenu();
    }
  });

  toolsMenu.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('click', (event) => {
    if (!toolsMenu.classList.contains('open')) return;
    if (!toolsMenu.contains(event.target) && !moreToolsBtn.contains(event.target)) {
      closeToolsMenu();
    }
  });
}

function openToolsMenu() {
  if (!toolsMenu || !moreToolsBtn) return;
  toolsMenu.classList.add('open');
  moreToolsBtn.setAttribute('aria-expanded', 'true');
}

function closeToolsMenu() {
  if (!toolsMenu || !moreToolsBtn) return;
  toolsMenu.classList.remove('open');
  moreToolsBtn.setAttribute('aria-expanded', 'false');
}

window.getBrowserHistory = getBrowserHistory;
window.clearBrowserHistory = clearBrowserHistory;
window.removeHistoryItem = removeHistoryItem;
window.openHistoryUrl = openHistoryUrl;

document.addEventListener('DOMContentLoaded', init);

function createNewTabButton() {
  const button = document.createElement('button');
  button.id = 'new-tab-btn';
  button.className = 'new-tab-btn';
  button.title = 'New Tab';
  button.innerHTML = '<span class="material-symbols-outlined">add</span>';
  button.addEventListener('click', () => createTab(HOME_PAGE_URL, true));
  return button;
}
