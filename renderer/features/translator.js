document.getElementById('translate-btn').addEventListener('click', handleTranslate);

async function handleTranslate() {
  openSidebar('🌍 Translate', `
    <div style="margin-bottom: 15px;">
      <textarea id="translate-input" placeholder="Enter text to translate..."
                style="width: 100%; height: 100px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; resize: vertical;"></textarea>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
      <button onclick="translateText('english')" style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
        To English
      </button>
      <button onclick="translateText('hindi')" style="flex: 1; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
        To Hindi
      </button>
    </div>
    <div id="translation-result" style="background: #f7fafc; padding: 15px; border-radius: 8px; min-height: 100px; display: none;">
      <h4 style="margin-bottom: 10px;">Translation:</h4>
      <div id="translation-text" style="line-height: 1.6;"></div>
    </div>
  `);
}

window.translateText = async function(targetLang) {
  const text = document.getElementById('translate-input').value.trim();
  if (!text) {
    showNotification('Please enter text to translate', 'error');
    return;
  }

  const resultDiv = document.getElementById('translation-result');
  const resultText = document.getElementById('translation-text');

  resultDiv.style.display = 'block';
  resultText.textContent = 'Translating...';

  const prompt = targetLang === 'hindi'
    ? `Translate this text to Hindi (Devanagari script):\n\n${text}`
    : `Translate this text to English:\n\n${text}`;

  const result = await callClaudeAPI(prompt, 'You are a translator. Provide accurate translations.');

  if (result.success) {
    resultText.textContent = result.text;
  } else {
    resultText.innerHTML = `<span style="color: #e53e3e;">Error: ${result.error}</span>`;
  }
};
