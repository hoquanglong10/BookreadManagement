import { coverTheme } from "./cover.js";

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
    const title = document.createElement("span");
    title.className = "chapter-title";
    title.textContent = chapter.title;
    item.append(number, title);
    list.append(item);
  }
  if (!chapters.length) {
    const item = document.createElement("li");
    item.textContent = "Truyện chưa có chương nào.";
    list.append(item);
  }
  document.getElementById("detail-status").hidden = true;
  document.getElementById("detail-content").hidden = false;
}
