const historyBtn = document.getElementById('history-btn');
let isHistoryActionBound = false;

if (historyBtn) {
  historyBtn.addEventListener('click', openHistoryPanel);
}

function openHistoryPanel() {
  openSidebar('🕘 Browsing History', `
    <div class="history-toolbar">
      <input id="history-search" class="history-search" type="text" placeholder="Search history by title or URL..." />
      <button id="history-clear-all" class="history-clear-btn" type="button">Clear All</button>
    </div>
    <div id="history-list" class="history-list"></div>
  `);

  const searchInput = document.getElementById('history-search');
  const clearBtn = document.getElementById('history-clear-all');

  renderHistoryList('');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      renderHistoryList(event.target.value || '');
    });
    searchInput.focus();
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!window.clearBrowserHistory) return;
      window.clearBrowserHistory();
      renderHistoryList(searchInput ? searchInput.value : '');
      showNotification('History cleared', 'success');
    });
  }

  if (!isHistoryActionBound) {
    sidebarContent.addEventListener('click', handleHistoryActions);
    isHistoryActionBound = true;
  }
}

function renderHistoryList(query) {
  const list = document.getElementById('history-list');
  if (!list || !window.getBrowserHistory) return;

  const allHistory = window.getBrowserHistory();
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const filtered = normalizedQuery
    ? allHistory.filter((item) =>
      String(item.title || '').toLowerCase().includes(normalizedQuery) ||
      String(item.url || '').toLowerCase().includes(normalizedQuery)
    )
    : allHistory;

  if (!filtered.length) {
    list.innerHTML = `<p class="history-empty">No history found.</p>`;
    return;
  }

  list.innerHTML = filtered.map((item) => {
    const safeTitle = escapeText(item.title || 'Untitled');
    const safeUrl = escapeText(item.url || '');
    const safeId = escapeText(item.id || '');
    const timeText = escapeText(formatHistoryTime(item.lastVisited));
    const visits = Number(item.visits || 1);

    return `
      <div class="history-item">
        <button class="history-open" data-open-url="${safeUrl}" type="button">
          <div class="history-title">${safeTitle}</div>
          <div class="history-url">${safeUrl}</div>
        </button>
        <div class="history-meta">
          <span>${timeText}</span>
          <span>${visits} visit${visits > 1 ? 's' : ''}</span>
          <button class="history-remove" data-remove-id="${safeId}" type="button" title="Remove">x</button>
        </div>
      </div>
    `;
  }).join('');
}

function handleHistoryActions(event) {
  const openTarget = event.target.closest('[data-open-url]');
  const removeTarget = event.target.closest('[data-remove-id]');

  if (openTarget && window.openHistoryUrl) {
    window.openHistoryUrl(openTarget.getAttribute('data-open-url'));
    return;
  }

  if (removeTarget && window.removeHistoryItem) {
    const id = removeTarget.getAttribute('data-remove-id');
    window.removeHistoryItem(id);
    const searchInput = document.getElementById('history-search');
    renderHistoryList(searchInput ? searchInput.value : '');
  }
}

function formatHistoryTime(isoTime) {
  if (!isoTime) return 'Unknown time';

  const then = new Date(isoTime);
  if (Number.isNaN(then.getTime())) return 'Unknown time';

  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return then.toLocaleString();
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
