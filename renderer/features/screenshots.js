document.getElementById('screenshot-btn').addEventListener('click', handleScreenshot);

async function handleScreenshot() {
  try {
    const image = await webview.capturePage();
    const base64 = image.toDataURL();

    openSidebar('📸 Screenshot', `
      <div style="margin-bottom: 15px;">
        <img src="${base64}" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="downloadScreenshot('${base64}')" style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
          💾 Save
        </button>
        <button onclick="copyScreenshot('${base64}')" style="flex: 1; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
          📋 Copy
        </button>
      </div>
    `);

    showNotification('Screenshot captured!', 'success');
  } catch (error) {
    showNotification('Screenshot failed', 'error');
    console.error(error);
  }
}

window.downloadScreenshot = function(base64) {
  const a = document.createElement('a');
  a.href = base64;
  a.download = `screenshot-${Date.now()}.png`;
  a.click();
  showNotification('Screenshot saved!', 'success');
};

window.copyScreenshot = async function(base64) {
  try {
    const blob = await (await fetch(base64)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    showNotification('Screenshot copied to clipboard!', 'success');
  } catch {
    showNotification('Copy failed', 'error');
  }
};
