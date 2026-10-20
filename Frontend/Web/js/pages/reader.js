import { readChapter } from "../api/chapters.js";
import { renderChapter, showReaderMessage } from "../ui/reader.js";

const params = new URLSearchParams(window.location.search);
const storyId = Number(params.get("storyId"));
const number = Number(params.get("number"));
const settingsKey = "bookread.reader.settings";

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    return {
      fontSize: Math.min(30, Math.max(14, Number(saved.fontSize) || 18)),
      dark: Boolean(saved.dark)
    };
  } catch {
    return { fontSize: 18, dark: false };
  }
}

let settings = readSettings();

function updateSettings(change) {
  settings = { ...settings, ...change };
  try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* storage is optional */ }
  if (chapter) renderChapter(chapter, settings, updateSettings);
}

let chapter;
if (!Number.isSafeInteger(storyId) || storyId < 1 || !Number.isSafeInteger(number) || number < 1) {
  showReaderMessage("Đường dẫn chương không hợp lệ", "Hãy quay lại trang truyện và chọn chương cần đọc.", true);
} else {
  readChapter(storyId, number)
    .then(data => {
      chapter = data;
      renderChapter(chapter, settings, updateSettings);
    })
    .catch(error => showReaderMessage("Không mở được chương", error.message, true));
}
