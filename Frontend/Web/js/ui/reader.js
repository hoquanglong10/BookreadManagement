export function showReaderMessage(title, message, isError = false) {
  const status = document.getElementById("reader-status");
  status.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = title;
  const detail = document.createElement("p");
  detail.textContent = message;
  status.append(heading, detail);
  status.classList.toggle("is-error", isError);
  status.hidden = false;
  document.getElementById("reader-panel").hidden = true;
}

export function renderChapter(chapter, settings, onSettingsChange) {
  document.title = `${chapter.title} | Đọc Truyện`;
  document.getElementById("reader-story-title").textContent = chapter.storyTitle;
  document.getElementById("reader-story-title").href = `./story.html?id=${chapter.storyId}`;
  document.getElementById("reader-chapter-title").textContent = `Chương ${chapter.number}: ${chapter.title}`;
  document.getElementById("font-size-value").textContent = `${settings.fontSize}px`;
  document.getElementById("reader-panel").classList.toggle("reader-dark", settings.dark);

  const article = document.getElementById("chapter-content");
  article.replaceChildren();
  const paragraphs = chapter.content.split(/\n+/).map(text => text.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "reader-empty-content";
    empty.textContent = "Chương này chưa có nội dung. Quản trị viên cần bổ sung trước khi đọc.";
    article.append(empty);
  } else {
    for (const paragraph of paragraphs) {
      const node = document.createElement("p");
      node.textContent = paragraph;
      article.append(node);
    }
  }
  article.style.fontSize = `${settings.fontSize}px`;

  const previous = chapter.prevNumber;
  const next = chapter.nextNumber;
  for (const [id, number, label] of [
    ["previous-top", previous, "← Chương trước"],
    ["previous-bottom", previous, "← Chương trước"],
    ["next-top", next, "Chương sau →"],
    ["next-bottom", next, "Chương sau →"]
  ]) {
    const link = document.getElementById(id);
    link.textContent = label;
    link.href = number === null ? "#" : `./reader.html?storyId=${chapter.storyId}&number=${number}`;
    link.classList.toggle("is-disabled", number === null);
    link.setAttribute("aria-disabled", String(number === null));
    link.onclick = number === null ? event => event.preventDefault() : null;
  }
  document.getElementById("reader-list-link").href = `./story.html?id=${chapter.storyId}`;

  document.getElementById("font-decrease").onclick = () => onSettingsChange({ fontSize: Math.max(14, settings.fontSize - 2) });
  document.getElementById("font-increase").onclick = () => onSettingsChange({ fontSize: Math.min(30, settings.fontSize + 2) });
  document.getElementById("theme-toggle").textContent = settings.dark ? "Nền sáng" : "Nền tối";
  document.getElementById("theme-toggle").onclick = () => onSettingsChange({ dark: !settings.dark });

  document.getElementById("reader-status").hidden = true;
  document.getElementById("reader-panel").hidden = false;
}
