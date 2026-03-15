let dictionaryEnabled = false;
const boundDictionaryWebviews = new WeakSet();

window.bindDictionaryToWebview = function(view) {
  if (!view || boundDictionaryWebviews.has(view)) return;

  view.addEventListener('did-stop-loading', () => {
    if (!dictionaryEnabled) {
      enableDictionary();
      dictionaryEnabled = true;
    }
  });

  boundDictionaryWebviews.add(view);
};

if (typeof webview !== 'undefined' && webview) {
  window.bindDictionaryToWebview(webview);
}

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
