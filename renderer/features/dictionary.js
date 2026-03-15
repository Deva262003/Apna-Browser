let dictionaryEnabled = false;

webview.addEventListener('did-stop-loading', () => {
  if (!dictionaryEnabled) {
    enableDictionary();
    dictionaryEnabled = true;
  }
});

async function enableDictionary() {
  await executeInWebview(`
    document.addEventListener('dblclick', async (e) => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText && selectedText.split(' ').length === 1) {
        console.log('Dictionary lookup:', selectedText);
      }
    });
  `);
}
