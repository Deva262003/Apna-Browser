document.getElementById('summarize-btn').addEventListener('click', handleSummarize);

async function handleSummarize() {
  openSidebar('📝 Page Summary', '<p style="color: #718096;">Analyzing page...</p>');

  const content = await extractPageContent();

  if (!content || content.length < 100) {
    sidebarContent.innerHTML = '<p style="color: #e53e3e;">Unable to extract content from this page.</p>';
    return;
  }

  const result = await callClaudeAPI(
    `Summarize this article for a student. Return ONLY markdown in this format:
## Summary
- point 1
- point 2
- point 3

## Key Terms
- term: short meaning

Article content:
${content}`,
    'You are a helpful study assistant for students. Respond strictly in clean markdown with concise bullet points.'
  );

  if (result.success) {
    displaySummary(result.text);
    saveSummary(webview.getURL(), result.text);
  } else {
    sidebarContent.innerHTML = `<p style="color: #e53e3e;">Error: ${result.error}</p>`;
  }
}

function displaySummary(summary) {
  const safeMarkdown = escapeHtml(summary);
  const encodedSummary = summary
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

  sidebarContent.innerHTML = `
    <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
      <h4 style="margin-bottom: 10px; color: #2d3748;">Markdown Summary:</h4>
      <pre style="white-space: pre-wrap; line-height: 1.6; color: #334155; font-family: Consolas, monospace; font-size: 13px;">${safeMarkdown}</pre>
    </div>
    <button onclick="copyToClipboard('${encodedSummary}')"
            style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
      Copy Markdown
    </button>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function saveSummary(url, summary) {
  const summaries = getStorage('summaries') || {};
  summaries[url] = {
    summary: summary,
    date: new Date().toISOString()
  };
  setStorage('summaries', summaries);
}
