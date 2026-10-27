const HISTORY_KEY = "bookread.reader.history";
const READ_EPISODES_KEY = "bookread.reader.read-episodes";

function readEpisodeIdentity(userId) {
  return userId == null ? "guest" : `user:${userId}`;
}

export function getReadingHistory() {
  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveReadingProgress(entry) {
  if (!entry?.storyId || !entry?.chapterNumber) return;
  try {
    const allReadEpisodes = JSON.parse(window.localStorage.getItem(READ_EPISODES_KEY) || "{}");
    const identity = readEpisodeIdentity(entry.userId);
    const storyId = String(entry.storyId);
    const current = allReadEpisodes[identity]?.[storyId] || [];
    allReadEpisodes[identity] ??= {};
    allReadEpisodes[identity][storyId] = [...new Set([...current, Number(entry.chapterNumber)])];
    window.localStorage.setItem(READ_EPISODES_KEY, JSON.stringify(allReadEpisodes));
  } catch { /* Per-episode markers are a local fallback; the server stores account progress. */ }

  const history = getReadingHistory().filter(item => String(item.storyId) !== String(entry.storyId));
  const next = [{ ...entry, readAt: new Date().toISOString() }, ...history].slice(0, 30);
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* Reading history is optional. */ }
}

export function getReadEpisodeNumbers(storyId, userId = null) {
  const identity = readEpisodeIdentity(userId);
  try {
    const allReadEpisodes = JSON.parse(window.localStorage.getItem(READ_EPISODES_KEY) || "{}");
    const saved = allReadEpisodes[identity]?.[String(storyId)];
    const numbers = Array.isArray(saved) ? saved.map(Number).filter(Number.isFinite) : [];
    // Migrate the previous guest history format, which kept only the latest episode per story.
    if (userId == null) {
      const previous = getReadingHistory().find(entry => String(entry.storyId) === String(storyId));
      if (previous?.chapterNumber) numbers.push(Number(previous.chapterNumber));
    }
    return [...new Set(numbers)];
  } catch {
    return userId == null
      ? getReadingHistory().filter(entry => String(entry.storyId) === String(storyId)).map(entry => Number(entry.chapterNumber)).filter(Number.isFinite)
      : [];
  }
}

export function clearReadingHistory() {
  try { window.localStorage.removeItem(HISTORY_KEY); } catch { /* Storage can be disabled by the browser. */ }
}
