export const LEVELS_CONFIG = {
  STARTING_POINTS: 1000,
  POINTS_PER_CORRECT: 5,
  PERFECT_QUIZ_BONUS: 50,
  SUBLEVEL_SIZE: 100,
  TIERS: [
    { name: 'Amateur',     min: 1000, max: 1499 },
    { name: 'Expert',      min: 1500, max: 1999 },
    { name: 'Master',      min: 2000, max: 2499 },
    { name: 'Grandmaster', min: 2500, max: Infinity },
  ],
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
function toRoman(n) { return ROMAN[n - 1] || String(n); }

export function getLevel(totalPoints) {
  const { TIERS, SUBLEVEL_SIZE } = LEVELS_CONFIG;
  const tier = TIERS.find(t => totalPoints >= t.min && totalPoints <= t.max);

  if (!tier) {
    // Grandmaster Option B: repeating 500-point bands
    const band = Math.floor((totalPoints - 2500) / 500);
    const bandMin = 2500 + band * 500;
    const offset = totalPoints - bandMin;
    const subLevel = Math.min(5, Math.floor(offset / SUBLEVEL_SIZE) + 1);
    const progressInSub = offset % SUBLEVEL_SIZE;
    return { tierName: 'Grandmaster', subLevel, label: `Grandmaster ${toRoman(subLevel)}`, progressInSub, bandMin };
  }

  const offset = totalPoints - tier.min;
  const subLevel = Math.min(5, Math.floor(offset / SUBLEVEL_SIZE) + 1);
  const progressInSub = offset % SUBLEVEL_SIZE;
  return { tierName: tier.name, subLevel, label: `${tier.name} ${toRoman(subLevel)}`, progressInSub };
}

export function scoreQuiz(correctCount, totalQuestions = 10) {
  let earned = correctCount * LEVELS_CONFIG.POINTS_PER_CORRECT;
  if (correctCount === totalQuestions) earned += LEVELS_CONFIG.PERFECT_QUIZ_BONUS;
  return earned;
}

export function getAnimationTier(before, after) {
  if (before.tierName !== after.tierName) return 'tier';
  if (before.subLevel !== after.subLevel) return 'sublevel';
  return null;
}

// Guest player state via localStorage
const GUEST_KEY = 'quizzard_player_guest';

export function getGuestPlayer() {
  try {
    const stored = localStorage.getItem(GUEST_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { totalPoints: LEVELS_CONFIG.STARTING_POINTS, quizzesTaken: 0, perfectQuizzes: 0 };
}

export function saveGuestPlayer(player) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(player));
}

export function applyQuizToGuest(correctCount, totalQuestions = 10) {
  const player = getGuestPlayer();
  const earned = scoreQuiz(correctCount, totalQuestions);
  const before = getLevel(player.totalPoints);
  player.totalPoints += earned;
  player.quizzesTaken += 1;
  if (correctCount === totalQuestions) player.perfectQuizzes += 1;
  const after = getLevel(player.totalPoints);
  saveGuestPlayer(player);
  return { earned, before, after, totalPoints: player.totalPoints };
}
