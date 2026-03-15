const achievements = {
  'first_summary': { name: 'First Summary', icon: '📝', unlocked: false },
  'streak_7': { name: '7-Day Streak', icon: '🔥', unlocked: false },
  'study_10h': { name: '10 Hours Studied', icon: '⏱️', unlocked: false },
  'flashcards_50': { name: '50 Flashcards', icon: '🎴', unlocked: false },
  'focus_master': { name: 'Focus Master', icon: '🎯', unlocked: false }
};

const storedAchievements = getStorage('achievements') || {};
Object.keys(achievements).forEach((key) => {
  if (storedAchievements[key] && typeof storedAchievements[key].unlocked === 'boolean') {
    achievements[key].unlocked = storedAchievements[key].unlocked;
  }
});

function checkAchievements() {
  const summaries = getStorage('summaries') || {};

  if (Object.keys(summaries).length >= 1 && !achievements.first_summary.unlocked) {
    unlockAchievement('first_summary');
  }
}

function unlockAchievement(id) {
  if (!achievements[id] || achievements[id].unlocked) return;

  achievements[id].unlocked = true;
  setStorage('achievements', achievements);

  // Keep achievement tracking silent to avoid distracting popups.
}

setInterval(checkAchievements, 30000);
