document.getElementById('translate-btn').addEventListener('click', handleTranslate);

async function handleTranslate() {
  openSidebar('🌍 Translate', `
    <div style="margin-bottom: 15px;">
      <textarea id="translate-input" placeholder="Enter text to translate..."
                style="width: 100%; height: 100px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; resize: vertical;"></textarea>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
      <button onclick="translateText('english')" style="flex: 1; min-width: 120px; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
        To English
      </button>
      <button onclick="translateText('hindi')" style="flex: 1; min-width: 120px; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
        To Hindi
      </button>
      <button onclick="translateText('marathi')" style="flex: 1; min-width: 120px; padding: 10px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">
        To Marathi
      </button>
    </div>
    <div id="translation-result" style="background: #f7fafc; padding: 15px; border-radius: 8px; min-height: 100px; display: none;">
      <h4 id="translation-heading" style="margin-bottom: 10px;">Translation:</h4>
      <div id="translation-text" style="line-height: 1.6;"></div>
    </div>
  `);
}

function getTranslationConfig(targetLang) {
  if (targetLang === 'hindi') {
    return {
      heading: 'Hindi Translation',
      prompt: 'Translate the text into Hindi using Devanagari script.',
      system: 'You are a professional translator. Output ONLY final Hindi translation in Devanagari script. Do NOT include English words, notes, analysis, steps, bullets, labels, or transliteration.'
    };
  }

  if (targetLang === 'marathi') {
    return {
      heading: 'Marathi Translation',
      prompt: 'Translate the text into Marathi using Devanagari script.',
      system: 'You are a professional translator. Output ONLY final Marathi translation in Devanagari script. Do NOT include English words, notes, analysis, steps, bullets, labels, or transliteration.'
    };
  }

  return {
    heading: 'English Translation',
    prompt: 'Translate the text into English.',
    system: 'You are a professional translator. Output ONLY the English translation. No notes or explanation.'
  };
}

function cleanTranslationOutput(text) {
  if (!text) return '';
  return String(text)
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/\n?```$/g, '')
    .trim();
}

function extractPureIndicText(text) {
  const raw = cleanTranslationOutput(text);
  if (!raw) return '';

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const hasIndic = (line) => /[\u0900-\u097F]/.test(line);
  const hasLatin = (line) => /[A-Za-z]/.test(line);

  const filtered = lines
    .filter((line) => hasIndic(line))
    .map((line) => line.replace(/[A-Za-z]/g, '').trim())
    .filter(Boolean);

  if (filtered.length === 0) return '';

  const finalLines = filtered.filter((line) => !hasLatin(line));
  return (finalLines.length ? finalLines : filtered).join('\n').trim();
}

function needsStrictRetry(text, targetLang) {
  if (targetLang !== 'hindi' && targetLang !== 'marathi') return false;
  if (!text) return true;
  if (!/[\u0900-\u097F]/.test(text)) return true;
  return /[A-Za-z]/.test(text);
}

window.translateText = async function(targetLang) {
  const text = document.getElementById('translate-input').value.trim();
  if (!text) {
    showNotification('Please enter text to translate', 'error');
    return;
  }

  const resultDiv = document.getElementById('translation-result');
  const resultText = document.getElementById('translation-text');
  const heading = document.getElementById('translation-heading');

  const config = getTranslationConfig(targetLang);
  heading.textContent = config.heading;
  resultDiv.style.display = 'block';
  resultText.textContent = 'Translating...';

  const prompt = `${config.prompt}\n\nText:\n${text}`;
  let result = await callClaudeAPI(prompt, config.system);

  if (result.success && needsStrictRetry(result.text, targetLang)) {
    const retryPrompt = `${config.prompt}

IMPORTANT:
- Return only final translation.
- Use only Devanagari script.
- Do not include any English words.
- Do not include explanation, analysis, attempts, labels, or bullet points.

Text:
${text}`;

    const retry = await callClaudeAPI(retryPrompt, config.system);
    if (retry.success) {
      result = retry;
    }
  }

  if (result.success) {
    const finalOutput =
      targetLang === 'hindi' || targetLang === 'marathi'
        ? extractPureIndicText(result.text)
        : cleanTranslationOutput(result.text);

    if (!finalOutput) {
      resultText.innerHTML = '<span style="color: #e53e3e;">Error: Could not generate clean translation. Please try again.</span>';
      return;
    }

    resultText.textContent = finalOutput;
  } else {
    resultText.innerHTML = `<span style="color: #e53e3e;">Error: ${result.error}</span>`;
  }
};
