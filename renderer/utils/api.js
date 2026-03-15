const CLAUDE_API_KEY = 'YOUR_CLAUDE_API_KEY_HERE';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaudeAPI(prompt, systemPrompt = '') {
  if (CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY_HERE') {
    return {
      success: false,
      error: 'Please add your Claude API key in utils/api.js'
    };
  }

  try {
    const messages = [{ role: 'user', content: prompt }];

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt || undefined,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      text: data.content[0].text
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
