const readingBtn = document.getElementById('reading-btn');
let readingModeActive = false;
let speechSynth = window.speechSynthesis;
let currentUtterance = null;

readingBtn.addEventListener('click', toggleReadingMode);

function toggleReadingMode() {
  readingModeActive = !readingModeActive;

  if (readingModeActive) {
    readingBtn.classList.add('active');
    enableReadingMode();
  } else {
    readingBtn.classList.remove('active');
    disableReadingMode();
  }
}

async function enableReadingMode() {
  await executeInWebview(`
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';
    document.body.style.padding = '40px 20px';
    document.body.style.fontSize = '18px';
    document.body.style.lineHeight = '1.8';
    document.body.style.background = '#f9fafb';
    document.body.style.color = '#1a202c';

    document.querySelectorAll('nav, header, footer, aside, .sidebar, .ads').forEach(el => {
      el.style.display = 'none';
    });
  `);

  openSidebar('📖 Reading Mode', `
    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px;">Text Size:</h4>
      <input type="range" id="font-size-slider" min="14" max="24" value="18"
             style="width: 100%;">
      <span id="font-size-value">18px</span>
    </div>
    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px;">Background:</h4>
      <div style="display: flex; gap: 10px;">
        <button onclick="setReadingBg('#f9fafb')" style="flex: 1; padding: 10px; background: #f9fafb; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;">Light</button>
        <button onclick="setReadingBg('#2d3748')" style="flex: 1; padding: 10px; background: #2d3748; color: white; border: none; border-radius: 6px; cursor: pointer;">Dark</button>
        <button onclick="setReadingBg('#fef3c7')" style="flex: 1; padding: 10px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; cursor: pointer;">Sepia</button>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px;">Text-to-Speech:</h4>
      <button id="tts-btn" onclick="startTextToSpeech()" style="width: 100%; padding: 12px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
        🔊 Read Aloud
      </button>
      <div id="tts-controls" style="display: none; margin-top: 10px;">
        <button onclick="stopTTS()" style="padding: 8px 15px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer;">⏹ Stop</button>
      </div>
    </div>
  `);

  document.getElementById('font-size-slider').addEventListener('input', (e) => {
    const size = e.target.value;
    document.getElementById('font-size-value').textContent = `${size}px`;
    executeInWebview(`document.body.style.fontSize = '${size}px'`);
  });

  showNotification('📖 Reading mode enabled', 'success');
}

async function disableReadingMode() {
  await executeInWebview(`
    document.body.style = '';
    document.querySelectorAll('nav, header, footer, aside, .sidebar, .ads').forEach(el => {
      el.style.display = '';
    });
  `);

  stopTTS();
  closeSidebar();
  showNotification('Reading mode disabled', 'info');
}

window.setReadingBg = async function(color) {
  const textColor = color === '#2d3748' ? '#e2e8f0' : '#1a202c';
  await executeInWebview(`
    document.body.style.background = '${color}';
    document.body.style.color = '${textColor}';
  `);
};

window.startTextToSpeech = async function() {
  const text = await executeInWebview(`
    (document.querySelector('article') || document.querySelector('main') || document.body).innerText
  `);

  if (!text) {
    showNotification('No text found to read', 'error');
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;

  speechSynth.speak(currentUtterance);

  document.getElementById('tts-btn').style.display = 'none';
  document.getElementById('tts-controls').style.display = 'block';
  showNotification('🔊 Reading started', 'success');
};

window.pauseTTS = function() {
  if (speechSynth.speaking && !speechSynth.paused) {
    speechSynth.pause();
  } else if (speechSynth.paused) {
    speechSynth.resume();
  }
};

window.stopTTS = function() {
  speechSynth.cancel();
  document.getElementById('tts-btn').style.display = 'block';
  document.getElementById('tts-controls').style.display = 'none';
};
