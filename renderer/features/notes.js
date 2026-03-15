document.getElementById('notes-btn').addEventListener('click', handleNotes);

async function handleNotes() {
  openSidebar('📓 Generate Notes', '<p style="color: #718096;">Generating notes...</p>');

  const content = await extractPageContent();

  if (!content) {
    sidebarContent.innerHTML = '<p style="color: #e53e3e;">Unable to extract content.</p>';
    return;
  }

  const result = await callClaudeAPI(
    `Create structured study notes from this content. Use headings and bullet points:\n\n${content}`,
    'You are a study assistant. Create clear, organized notes for students.'
  );

  if (result.success) {
    displayNotes(result.text);
  } else {
    sidebarContent.innerHTML = `<p style="color: #e53e3e;">Error: ${result.error}</p>`;
  }
}

function displayNotes(notes) {
  sidebarContent.innerHTML = `
    <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <div style="line-height: 1.8; color: #2d3748;">${notes.replace(/\n/g, '<br>')}</div>
    </div>
    <button onclick="copyToClipboard('${notes.replace(/'/g, "\\'")}')"
            style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
      Copy Notes
    </button>
    <button onclick="downloadNotes('${notes.replace(/'/g, "\\'")}')"
            style="margin-left: 10px; padding: 10px 20px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
      Download
    </button>
  `;
}

function downloadNotes(notes) {
  const blob = new Blob([notes], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'study-notes.txt';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Notes downloaded!', 'success');
}
