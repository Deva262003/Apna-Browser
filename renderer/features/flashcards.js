document.getElementById('flashcards-btn').addEventListener('click', handleFlashcards);

let currentFlashcards = [];
let currentCardIndex = 0;

async function handleFlashcards() {
  openSidebar('🎴 Flashcards', '<p style="color: #718096;">Generating flashcards...</p>');

  const content = await extractPageContent();

  if (!content) {
    sidebarContent.innerHTML = '<p style="color: #e53e3e;">Unable to extract content.</p>';
    return;
  }

  const result = await callClaudeAPI(
    `Create 5 flashcards from this content. Format each as:\nQ: [Question]\nA: [Answer]\n\nContent:\n${content}`,
    'You are a study assistant creating flashcards for students.'
  );

  if (result.success) {
    parseAndDisplayFlashcards(result.text);
  } else {
    sidebarContent.innerHTML = `<p style="color: #e53e3e;">Error: ${result.error}</p>`;
  }
}

function parseAndDisplayFlashcards(text) {
  const cards = [];
  const lines = text.split('\n');
  let currentQ = '';

  lines.forEach(line => {
    if (line.startsWith('Q:')) {
      currentQ = line.substring(2).trim();
    } else if (line.startsWith('A:') && currentQ) {
      cards.push({
        question: currentQ,
        answer: line.substring(2).trim()
      });
      currentQ = '';
    }
  });

  if (cards.length === 0) {
    sidebarContent.innerHTML = '<p style="color: #e53e3e;">Could not parse flashcards.</p>';
    return;
  }

  currentFlashcards = cards;
  currentCardIndex = 0;
  displayFlashcard();
}

function displayFlashcard() {
  const card = currentFlashcards[currentCardIndex];

  sidebarContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="color: #718096;">Card ${currentCardIndex + 1} of ${currentFlashcards.length}</span>
    </div>
    <div id="flashcard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; min-height: 200px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 18px; text-align: center;">
      ${card.question}
    </div>
    <div id="answer" style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-top: 15px; display: none;">
      <strong>Answer:</strong><br>${card.answer}
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button onclick="prevCard()" ${currentCardIndex === 0 ? 'disabled' : ''}
              style="flex: 1; padding: 10px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">
        ← Previous
      </button>
      <button onclick="flipCard()" style="flex: 2; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Flip Card
      </button>
      <button onclick="nextCard()" ${currentCardIndex === currentFlashcards.length - 1 ? 'disabled' : ''}
              style="flex: 1; padding: 10px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">
        Next →
      </button>
    </div>
  `;

  document.getElementById('flashcard').addEventListener('click', flipCard);
}

window.flipCard = function() {
  const answer = document.getElementById('answer');
  answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
};

window.nextCard = function() {
  if (currentCardIndex < currentFlashcards.length - 1) {
    currentCardIndex++;
    displayFlashcard();
  }
};

window.prevCard = function() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    displayFlashcard();
  }
};
