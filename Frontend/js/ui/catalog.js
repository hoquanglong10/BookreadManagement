import { createCover } from "./cover.js";

export function renderAccountActions(session, onLogout) {
  const actions = document.getElementById("account-actions");
  actions.replaceChildren();
  if (!session) {
    const link = document.createElement("a");
    link.className = "account-primary";
    link.href = "./account.html";
    link.textContent = "Đăng nhập / Đăng ký";
    actions.append(link);
    return;
  }
  const name = document.createElement("span");
  name.className = "account-name";
  name.textContent = `Xin chào, ${session.user.username}`;
  actions.append(name);
  if (session.user.role === "Admin") {
    const admin = document.createElement("a");
    admin.href = "./admin.html";
    admin.textContent = "Quản trị";
    actions.append(admin);
  }
  const logout = document.createElement("button");
  logout.type = "button";
  logout.textContent = "Đăng xuất";
  logout.addEventListener("click", onLogout);
  actions.append(logout);
}

export function showCatalogStatus(title, message, onRetry) {
  const statusBox = document.getElementById("catalog-status");
  statusBox.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = title;
  statusBox.append(heading, document.createTextNode(message));
  if (onRetry) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Thử lại";
    button.addEventListener("click", onRetry);
    statusBox.append(button);
  }
  statusBox.hidden = false;
}

export function renderGenreFilters(stories, activeGenre, onSelect) {
  const filters = document.getElementById("genre-filters");
  const genres = ["Tất cả", ...new Set(stories.map(story => story.genre))];
  filters.replaceChildren();
  if (genres.length < 3) return;
  for (const genre of genres) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = genre;
    button.classList.toggle("active", genre === activeGenre);
    button.setAttribute("aria-pressed", String(genre === activeGenre));
    button.addEventListener("click", () => onSelect(genre));
    filters.append(button);
  }
}

function createCard(story) {
  const card = document.createElement("article");
  card.className = "story-card";
  card.append(createCover(story));
  const body = document.createElement("div");
  body.className = "story-card-body";
  const meta = document.createElement("div");
  meta.className = "story-meta";
  const genre = document.createElement("span");
  genre.className = "genre-tag";
  genre.textContent = story.genre;
  meta.append(genre, document.createTextNode(story.status));
  const title = document.createElement("h3");
  title.textContent = story.title;
  const author = document.createElement("p");
  author.className = "story-author";
  author.textContent = `Tác giả: ${story.author}`;
  const description = document.createElement("p");
  description.className = "story-description";
  description.textContent = story.description;
  const footer = document.createElement("div");
  footer.className = "story-footer";
  const count = document.createElement("span");
  count.textContent = `${story.chapterCount} chương`;
  const link = document.createElement("a");
  link.href = `./story.html?id=${encodeURIComponent(story.id)}`;
  link.textContent = "Xem chi tiết →";
  link.setAttribute("aria-label", `Xem chi tiết truyện ${story.title}`);
  footer.append(count, link);
  body.append(meta, title, author, description, footer);
  card.append(body);
  return card;
}

export function renderCatalogStories(stories, query, activeGenre) {
  const visible = activeGenre === "Tất cả" ? stories : stories.filter(story => story.genre === activeGenre);
  document.getElementById("result-summary").textContent = query
    ? `${visible.length} kết quả cho “${query}”`
    : `${visible.length} câu chuyện đang chờ bạn khám phá`;
  document.getElementById("story-grid").replaceChildren(...visible.map(createCard));
  document.getElementById("catalog-status").hidden = visible.length > 0;
  if (!visible.length) showCatalogStatus("Chưa tìm thấy truyện", "Thử một tên truyện khác hoặc chọn thể loại Tất cả.");
}

export function setCatalogLoading() {
  document.getElementById("story-grid").replaceChildren();
  document.getElementById("genre-filters").replaceChildren();
  document.getElementById("result-summary").textContent = "Đang tìm truyện...";
  showCatalogStatus("Đang mở thư viện", "Vui lòng chờ trong giây lát...");
}
