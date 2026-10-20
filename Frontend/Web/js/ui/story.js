import { coverTheme } from "./cover.js?v=reading-room-2";

export function showStoryError(message) {
  const statusBox = document.getElementById("detail-status");
  const content = document.getElementById("detail-content");
  statusBox.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = "Không mở được truyện";
  statusBox.append(heading, document.createTextNode(message));
  statusBox.hidden = false;
  content.hidden = true;
}

export function renderStoryDetail(story, chapters) {
  document.title = `${story.title} | Đọc Truyện`;
  document.getElementById("story-title").textContent = story.title;
  document.getElementById("cover-title").textContent = story.title;
  document.getElementById("cover-genre").textContent = story.genre || "ĐỌC TRUYỆN";
  document.getElementById("cover-author").textContent = story.author || "Đọc Truyện";
  document.getElementById("story-author").textContent = `Tác giả: ${story.author}`;
  document.getElementById("story-genre").textContent = story.genre;
  document.getElementById("story-status").textContent = story.status;
  document.getElementById("story-chapter-count").textContent = `${story.chapterCount} chương`;
  document.getElementById("story-description").textContent = story.description;
  document.getElementById("detail-cover").classList.add(`theme-${coverTheme(story.coverTheme)}`);

  const list = document.getElementById("chapter-list");
  list.replaceChildren();
  for (const chapter of chapters) {
    const item = document.createElement("li");
    const number = document.createElement("span");
    number.className = "chapter-number";
    number.textContent = `CHƯƠNG ${chapter.number}`;
    const title = document.createElement(chapter.hasContent && chapter.isPublished ? "a" : "span");
    title.className = "chapter-title";
    if (title instanceof HTMLAnchorElement)
      title.href = `./reader.html?storyId=${encodeURIComponent(story.id)}&number=${encodeURIComponent(chapter.number)}`;
    title.textContent = chapter.title;
    const open = document.createElement("span");
    open.className = "chapter-open";
    open.textContent = chapter.hasContent && chapter.isPublished ? "Đọc chương →" : "Đang biên soạn";
    if (!chapter.hasContent || !chapter.isPublished) open.classList.add("chapter-unavailable");
    item.append(number, title, open);
    list.append(item);
  }
  const first = chapters.find(chapter => chapter.hasContent && chapter.isPublished);
  const actions = document.getElementById("story-read-actions");
  actions.replaceChildren();
  if (first) {
    const read = document.createElement("a");
    read.className = "button-primary";
    read.href = `./reader.html?storyId=${encodeURIComponent(story.id)}&number=${encodeURIComponent(first.number)}`;
    read.textContent = "Đọc từ đầu";
    actions.append(read);
  }
  if (!chapters.length) {
    const item = document.createElement("li");
    item.textContent = "Truyện chưa có chương nào.";
    list.append(item);
  }
  document.getElementById("detail-status").hidden = true;
  document.getElementById("detail-content").hidden = false;
}
