# Apna Study Browser

AI-powered study browser desktop app built with Electron and Vanilla JavaScript.

## Features

- Core browser navigation (Back, Forward, Refresh, Home, URL/search)
- Smart homepage with educational quick links
- AI study toolkit:
  - Page summarizer
  - Auto notes
  - Page Q&A assistant
  - Hindi/English translator
  - Flashcard generator
  - Citation generator (APA/MLA/Chicago)
  - Focus mode blocker
  - Study timer (Pomodoro)
  - Reading mode with text-to-speech
  - Screenshot capture tool
  - Dictionary hook (double-click listener)
  - Achievements tracking

## Project Structure

```text
apna-study-browser/
├── package.json
├── main.js
├── preload.js
├── renderer/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── homepage.html
│   ├── blocked-page.html
│   ├── features/
│   └── utils/
└── assets/
    └── blocked-page.html
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your API (ZLM first):

```bash
# Option A: ZLM via environment variables (recommended)
# PowerShell
$env:LLM_PROVIDER="zlm"
$env:ZLM_API_URL="https://your-zlm-host"
$env:ZLM_API_KEY="your_key_here"
$env:ZLM_MODEL="zlm-chat"
npm start
```

```js
// Option B: set once from DevTools console (stored locally)
setLlmProvider("zlm");
setZlmApiConfig({
  apiUrl: "https://your-zlm-host",
  apiKey: "your_key_here",
  model: "zlm-chat"
});
```

3. Optional fallback (Anthropic):

```bash
$env:LLM_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your_key_here"
```

## Notes

- Some features depend on page script permissions and may vary by website.
- AI features require a valid API configuration (ZLM or Anthropic).
- Focus Mode blocks common distractor domains listed in `renderer/features/focus-mode.js`.
