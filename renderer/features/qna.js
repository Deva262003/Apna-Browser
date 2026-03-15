document.getElementById('qna-btn').addEventListener('click', handleQnA);

let chatHistory = [];

async function handleQnA() {
  const pageContent = await extractPageContent();

  openSidebar('💬 Ask AI', `
    <div id="chat-messages" style="height: 300px; overflow-y: auto; margin-bottom: 15px; padding: 10px; background: #f7fafc; border-radius: 8px;">
      <p style="color: #718096;">Ask me anything about this page!</p>
    </div>
    <div style="display: flex; gap: 10px;">
      <input id="question-input" type="text" placeholder="Type your question..."
             style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; outline: none;">
      <button id="ask-btn" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Ask
      </button>
    </div>
    <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
      <button class="quick-q" data-q="Explain this simply">Explain Simply</button>
      <button class="quick-q" data-q="What are the main concepts?">Main Concepts</button>
      <button class="quick-q" data-q="Create quiz questions">Quiz Me</button>
      <button class="quick-q" data-q="Give examples">Examples</button>
    </div>
  `);

  document.getElementById('ask-btn').addEventListener('click', () => askQuestion(pageContent));
  document.getElementById('question-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') askQuestion(pageContent);
  });

  document.querySelectorAll('.quick-q').forEach(btn => {
    btn.style.cssText = 'padding: 8px 12px; background: #e2e8f0; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;';
    btn.addEventListener('click', () => {
      document.getElementById('question-input').value = btn.dataset.q;
      askQuestion(pageContent);
    });
  });
}

async function askQuestion(pageContent) {
  const question = document.getElementById('question-input').value.trim();
  if (!question) return;

  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML += `<div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;"><strong>You:</strong> ${question}</div>`;
  chatMessages.innerHTML += `<div style="margin: 10px 0; padding: 10px; background: #e6f4ff; border-radius: 6px;"><strong>AI:</strong> Thinking...</div>`;

  document.getElementById('question-input').value = '';

  const result = await callClaudeAPI(
    `Based on this page content:\n${pageContent}\n\nQuestion: ${question}`,
    'You are a helpful study assistant. Answer questions clearly for students.'
  );

  const lastMessage = chatMessages.lastElementChild;
  if (result.success) {
    lastMessage.innerHTML = `<strong>AI:</strong> ${result.text}`;
  } else {
    lastMessage.innerHTML = `<strong>AI:</strong> <span style="color: #e53e3e;">Error: ${result.error}</span>`;
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}
