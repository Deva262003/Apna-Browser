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

2. Add your Claude API key in `renderer/utils/api.js`:

```js
const CLAUDE_API_KEY = 'YOUR_CLAUDE_API_KEY_HERE';
```

3. Start the app:

```bash
npm start
```

## Notes

- Some features depend on page script permissions and may vary by website.
- AI features require a valid Anthropic API key.
- Focus Mode blocks common distractor domains listed in `renderer/features/focus-mode.js`.
