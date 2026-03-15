document.getElementById('summarize-btn').addEventListener('click', handleSummarize);

async function handleSummarize() {
  openSidebar('📝 Page Summary', '<p style="color: #718096;">Analyzing page...</p>');

  const content = await extractPageContent();

  if (!content || content.length < 100) {
    sidebarContent.innerHTML = '<p style="color: #e53e3e;">Unable to extract content from this page.</p>';
    return;
  }

  const result = await callClaudeAPI(
    `Summarize this article for a student in 3-4 concise bullet points. Focus on key facts and main ideas:\n\n${content}`,
    'You are a helpful study assistant for students. Provide clear, concise summaries.'
  );

  if (result.success) {
    displaySummary(result.text);
    saveSummary(webview.getURL(), result.text);
  } else {
    sidebarContent.innerHTML = `<p style="color: #e53e3e;">Error: ${result.error}</p>`;
  }
}

function displaySummary(summary) {
  sidebarContent.innerHTML = `
    <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
      <h4 style="margin-bottom: 10px; color: #2d3748;">Summary:</h4>
      <div style="line-height: 1.6; color: #4a5568;">${summary.replace(/\n/g, '<br>')}</div>
    </div>
    <button onclick="copyToClipboard('${summary.replace(/'/g, "\\'")}')"
            style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
      Copy Summary
    </button>
  `;
}

function saveSummary(url, summary) {
  const summaries = getStorage('summaries') || {};
  summaries[url] = {
    summary: summary,
    date: new Date().toISOString()
  };
  setStorage('summaries', summaries);
}
