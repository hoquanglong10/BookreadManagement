const HISTORY_KEY = "bookread.reader.history";

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
  const history = getReadingHistory().filter(item => String(item.storyId) !== String(entry.storyId));
  const next = [{ ...entry, readAt: new Date().toISOString() }, ...history].slice(0, 30);
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* Reading history is optional. */ }
}

export function clearReadingHistory() {
  try { window.localStorage.removeItem(HISTORY_KEY); } catch { /* Storage can be disabled by the browser. */ }
}
