const achievements = {
  'first_summary': { name: 'First Summary', icon: '📝', unlocked: false },
  'streak_7': { name: '7-Day Streak', icon: '🔥', unlocked: false },
  'study_10h': { name: '10 Hours Studied', icon: '⏱️', unlocked: false },
  'flashcards_50': { name: '50 Flashcards', icon: '🎴', unlocked: false },
  'focus_master': { name: 'Focus Master', icon: '🎯', unlocked: false }
};

function checkAchievements() {
  const stats = getStorage('studyStats') || {};
  const summaries = getStorage('summaries') || {};

  if (Object.keys(summaries).length >= 1 && !achievements.first_summary.unlocked) {
    unlockAchievement('first_summary');
  }
}

function unlockAchievement(id) {
  achievements[id].unlocked = true;
  setStorage('achievements', achievements);

  showNotification(`🏆 Achievement Unlocked: ${achievements[id].name}`, 'success');

  try {
    new Audio('assets/sounds/achievement.mp3').play();
  } catch {}
}

setInterval(checkAchievements, 30000);
