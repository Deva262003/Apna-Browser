const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_ZLM_BASE_URL = 'https://api.z.ai/api/coding/paas/v4';

const STORAGE_KEYS = {
  provider: 'llm_provider',
  anthropicKey: 'anthropic_api_key',
  zlmApiUrl: 'zlm_api_url',
  zlmApiKey: 'zlm_api_key',
  zlmModel: 'zlm_model'
};

function readLocal(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch (error) {
    return '';
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Failed writing localStorage key:', key, error);
    return false;
  }
}

function removeLocal(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed removing localStorage key:', key, error);
    return false;
  }
}

function readEnv(name) {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name] || '';
    }
  } catch (error) {
    return '';
  }
  return '';
}

function firstValue(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getConfig() {
  const provider = firstValue(readEnv('LLM_PROVIDER'), readLocal(STORAGE_KEYS.provider), 'auto').toLowerCase();

  return {
    provider,
    anthropicKey: firstValue(readEnv('ANTHROPIC_API_KEY'), readLocal(STORAGE_KEYS.anthropicKey)),
    zlmApiUrl: firstValue(readEnv('ZLM_API_URL'), readLocal(STORAGE_KEYS.zlmApiUrl), DEFAULT_ZLM_BASE_URL),
    zlmApiKey: firstValue(readEnv('ZLM_API_KEY'), readLocal(STORAGE_KEYS.zlmApiKey)),
    zlmModel: firstValue(readEnv('ZLM_MODEL'), readLocal(STORAGE_KEYS.zlmModel), 'glm-4.7')
  };
}

function normalizeZlmEndpoint(apiUrl) {
  if (!apiUrl) return '';
  const trimmed = apiUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  return `${trimmed}/chat/completions`;
}

function selectProvider(config) {
  if (config.provider === 'zlm') return 'zlm';
  if (config.provider === 'anthropic') return 'anthropic';

  if (config.zlmApiUrl && config.zlmApiKey) return 'zlm';
  if (config.anthropicKey) return 'anthropic';
  return 'none';
}

function parseZlmText(data) {
  const text = firstValue(
    data && data.output_text,
    data && data.response,
    data && data.result,
    data && data.data && data.data.output_text,
    data && data.data && data.data.response,
    data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content,
    data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.reasoning_content,
    data && data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content,
    data && data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.reasoning_content,
    data && data.choices && data.choices[0] && data.choices[0].text
  );

  if (typeof text === 'string') return text.trim();

  if (Array.isArray(text)) {
    return text
      .map((item) => (typeof item === 'string' ? item : (item && item.text) || ''))
      .join('\n')
      .trim();
  }

  if (Array.isArray(data && data.choices)) {
    const joined = data.choices
      .map((choice) => {
        const content = choice && choice.message && choice.message.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          return content
            .map((item) => (typeof item === 'string' ? item : (item && item.text) || ''))
            .join('\n');
        }
        return '';
      })
      .join('\n')
      .trim();

    if (joined) return joined;
  }

  if (data && typeof data === 'object') {
    const asString = JSON.stringify(data);
    if (asString && asString !== '{}' && asString !== '[]') return '';
  }

  return '';
}

function parseSseJsonChunks(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const chunks = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, ''))
    .filter((line) => line && line !== '[DONE]');

  if (chunks.length === 0) return null;

  let mergedText = '';
  for (const chunk of chunks) {
    try {
      const json = JSON.parse(chunk);
      const piece = parseZlmText(json);
      if (piece) mergedText += piece;
    } catch (error) {
      // Ignore invalid partial chunks.
    }
  }

  return mergedText.trim() || null;
}

function parseAnthropicText(data) {
  if (!data || !Array.isArray(data.content)) return '';
  return data.content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text.trim())
    .join('\n\n')
    .trim();
}

async function callZlmAPI(config, prompt, systemPrompt) {
  const endpoint = normalizeZlmEndpoint(config.zlmApiUrl);
  if (!endpoint || !config.zlmApiKey) {
    return {
      success: false,
      error: 'ZLM config missing. Set ZLM_API_URL and ZLM_API_KEY (or call setZlmApiConfig).'
    };
  }

  const messages = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.zlmApiKey}`
      },
      body: JSON.stringify({
        model: config.zlmModel,
        messages,
        max_tokens: 2048,
        temperature: 0.3,
        stream: false
      })
    });

    const rawBody = await response.text();
    let data = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      const apiError =
        (data.error && (data.error.message || data.error)) ||
        data.message ||
        (rawBody && rawBody.slice(0, 200)) ||
        `ZLM API error: ${response.status}`;
      throw new Error(String(apiError));
    }

    let text = parseZlmText(data);
    if (!text) {
      const sseText = parseSseJsonChunks(rawBody);
      if (sseText) text = sseText;
    }
    if (!text) {
      const snippet = rawBody ? rawBody.slice(0, 180) : 'empty-body';
      throw new Error(`Empty response from ZLM API. Body preview: ${snippet}`);
    }

    return { success: true, text };
  } catch (error) {
    console.error('ZLM API error:', error);
    return { success: false, error: error.message || 'Unknown ZLM API error.' };
  }
}

async function callAnthropicAPI(config, prompt, systemPrompt) {
  if (!config.anthropicKey) {
    return {
      success: false,
      error: 'Anthropic key missing. Set ANTHROPIC_API_KEY or call setClaudeApiKey.'
    };
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        temperature: 0.3,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiError =
        (data.error && data.error.message) ||
        data.message ||
        `Anthropic API error: ${response.status}`;
      throw new Error(String(apiError));
    }

    const text = parseAnthropicText(data);
    if (!text) throw new Error('Empty response from Anthropic API.');
    return { success: true, text };
  } catch (error) {
    console.error('Anthropic API error:', error);
    return { success: false, error: error.message || 'Unknown Anthropic API error.' };
  }
}

async function callClaudeAPI(prompt, systemPrompt = '') {
  if (!prompt || !prompt.trim()) {
    return { success: false, error: 'Prompt is empty.' };
  }

  const config = getConfig();
  const provider = selectProvider(config);

  if (provider === 'zlm') {
    return callZlmAPI(config, prompt, systemPrompt);
  }

  if (provider === 'anthropic') {
    return callAnthropicAPI(config, prompt, systemPrompt);
  }

  return {
    success: false,
    error: 'No API configured. Set ZLM_API_URL + ZLM_API_KEY or ANTHROPIC_API_KEY.'
  };
}

function setLlmProvider(provider) {
  const value = String(provider || '').toLowerCase();
  if (!['auto', 'zlm', 'anthropic'].includes(value)) return false;
  return writeLocal(STORAGE_KEYS.provider, value);
}

function setClaudeApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  return writeLocal(STORAGE_KEYS.anthropicKey, apiKey.trim());
}

function clearClaudeApiKey() {
  return removeLocal(STORAGE_KEYS.anthropicKey);
}

function setZlmApiConfig(config = {}) {
  const apiUrl = String(config.apiUrl || '').trim();
  const apiKey = String(config.apiKey || '').trim();
  const model = String(config.model || '').trim();

  let ok = true;
  if (apiUrl) ok = writeLocal(STORAGE_KEYS.zlmApiUrl, apiUrl) && ok;
  if (apiKey) ok = writeLocal(STORAGE_KEYS.zlmApiKey, apiKey) && ok;
  if (model) ok = writeLocal(STORAGE_KEYS.zlmModel, model) && ok;
  return ok;
}

function clearZlmApiConfig() {
  return (
    removeLocal(STORAGE_KEYS.zlmApiUrl) &&
    removeLocal(STORAGE_KEYS.zlmApiKey) &&
    removeLocal(STORAGE_KEYS.zlmModel)
  );
}

function getClaudeApiKeyStatus() {
  const config = getConfig();
  return {
    provider: selectProvider(config),
    hasAnthropicKey: Boolean(config.anthropicKey),
    hasZlmUrl: Boolean(config.zlmApiUrl),
    hasZlmKey: Boolean(config.zlmApiKey),
    zlmModel: config.zlmModel
  };
}
