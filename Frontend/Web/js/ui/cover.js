const allowedThemes = new Set(["teal", "indigo", "rose", "amber", "sage", "slate"]);

export function coverTheme(value) {
  return allowedThemes.has(value) ? value : "teal";
}

export function createCover(story) {
  const cover = document.createElement("div");
  cover.className = `story-cover theme-${coverTheme(story.coverTheme)}`;
  cover.setAttribute("aria-hidden", "true");
  const kicker = document.createElement("span");
  kicker.className = "cover-kicker";
  kicker.textContent = story.genre || "ĐỌC TRUYỆN";
  const title = document.createElement("span");
  title.className = "cover-title";
  title.textContent = story.title;
  const author = document.createElement("span");
  author.className = "cover-author";
  author.textContent = story.author || "Đọc Truyện";
  const mark = document.createElement("span");
  mark.className = "cover-mark";
  mark.textContent = "✳";
  cover.append(kicker, title, mark, author);
  return cover;
}
