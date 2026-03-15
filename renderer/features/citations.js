document.getElementById('citation-btn').addEventListener('click', handleCitation);

async function handleCitation() {
  const url = webview.getURL();
  const title = await executeInWebview('document.title');

  openSidebar('📚 Citation Generator', `
    <div style="margin-bottom: 15px;">
      <strong>Page:</strong><br>
      <div style="background: #f7fafc; padding: 10px; border-radius: 6px; margin-top: 5px; font-size: 13px; word-break: break-all;">
        ${title || url}
      </div>
    </div>
    <div style="margin-bottom: 10px;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Citation Style:</label>
      <select id="citation-style" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
        <option value="APA">APA</option>
        <option value="MLA">MLA</option>
        <option value="Chicago">Chicago</option>
      </select>
    </div>
    <button onclick="generateCitation()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 15px;">
      Generate Citation
    </button>
    <div id="citation-output" style="background: #f7fafc; padding: 15px; border-radius: 8px; display: none;">
      <div id="citation-text" style="font-family: monospace; font-size: 13px; line-height: 1.6;"></div>
      <button onclick="copyToClipboard(document.getElementById('citation-text').textContent)"
              style="margin-top: 10px; padding: 8px 15px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Copy Citation
      </button>
    </div>
  `);
}

window.generateCitation = async function() {
  const style = document.getElementById('citation-style').value;
  const url = webview.getURL();
  const title = await executeInWebview('document.title');
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const result = await callClaudeAPI(
    `Generate a ${style} citation for this webpage:\nTitle: ${title}\nURL: ${url}\nAccessed: ${date}`,
    'You are a citation expert. Generate properly formatted citations.'
  );

  const output = document.getElementById('citation-output');
  const text = document.getElementById('citation-text');

  if (result.success) {
    text.textContent = result.text;
    output.style.display = 'block';
  } else {
    text.innerHTML = `<span style="color: #e53e3e;">Error: ${result.error}</span>`;
    output.style.display = 'block';
  }
};
