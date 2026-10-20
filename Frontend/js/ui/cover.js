const allowedThemes = new Set(["teal", "indigo", "rose", "amber", "sage", "slate"]);

export function coverTheme(value) {
  return allowedThemes.has(value) ? value : "teal";
}

export function createCover(story) {
  const cover = document.createElement("div");
  cover.className = `story-cover theme-${coverTheme(story.coverTheme)}`;
  const kicker = document.createElement("span");
  kicker.className = "cover-kicker";
  kicker.textContent = "ĐỌC TRUYỆN · TUYỂN TẬP";
  const title = document.createElement("span");
  title.className = "cover-title";
  title.textContent = story.title;
  cover.append(kicker, title);
  return cover;
}
