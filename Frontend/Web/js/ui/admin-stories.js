import { addCell, makeButton } from "./common.js";

export function renderAdminStories(stories, query, { onChapters, onEdit, onDelete }) {
  const normalized = query.toLocaleLowerCase("vi-VN");
  const filtered = stories.filter(story => [story.title, story.author, story.genre]
    .some(value => String(value || "").toLocaleLowerCase("vi-VN").includes(normalized)));
  const rows = document.getElementById("story-rows");
  rows.replaceChildren();
  document.getElementById("story-count").textContent = String(stories.length);
  document.getElementById("chapter-count").textContent = String(stories.reduce((sum, story) => sum + story.chapterCount, 0));
  document.getElementById("result-count").textContent = query ? `${filtered.length} kết quả phù hợp` : `${stories.length} truyện`;
  document.getElementById("empty-state").hidden = filtered.length > 0;
  document.getElementById("empty-description").textContent = query
    ? "Không tìm thấy truyện phù hợp. Thử từ khóa khác."
    : "Hãy thêm truyện đầu tiên để bắt đầu.";

  for (const story of filtered) {
    const row = document.createElement("tr");
    const titleCell = addCell(row);
    const title = document.createElement("span");
    title.className = "story-name";
    title.textContent = story.title;
    const author = document.createElement("span");
    author.className = "story-author";
    author.textContent = `${story.author} · ID #${story.id}`;
    titleCell.append(title, author);
    addCell(row, story.genre);
    const status = document.createElement("span");
    status.className = `story-status${story.status === "Hoàn thành" ? " complete" : ""}`;
    status.textContent = story.status;
    addCell(row).append(status);
    addCell(row, `${story.chapterCount} chương`, "story-count-cell");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      makeButton("Chương", "row-button", `Quản lý chương của ${story.title}`, () => onChapters(story)),
      makeButton("Sửa", "row-button", `Sửa ${story.title}`, () => onEdit(story.id)),
      makeButton("Xóa", "row-button delete", `Xóa ${story.title}`, () => onDelete(story))
    );
    addCell(row).append(actions);
    rows.append(row);
  }
}

export function fillStoryForm(form, story) {
  form.elements.title.value = story.title;
  form.elements.author.value = story.author;
  form.elements.genre.value = story.genre;
  form.elements.description.value = story.description;
  form.elements.status.value = story.status;
  form.elements.coverTheme.value = story.coverTheme;
}

export function setStoryDialogMode(editing) {
  document.getElementById("story-dialog-title").textContent = editing ? "Sửa truyện" : "Thêm truyện";
  document.getElementById("save-story").textContent = editing ? "Lưu thay đổi" : "Thêm truyện";
}

export function renderAdminChapters(chapters, { onEdit, onDelete }) {
  const list = document.getElementById("chapter-list");
  list.replaceChildren();
  if (!chapters.length) {
    const empty = document.createElement("div");
    empty.className = "chapter-empty";
    empty.textContent = "Truyện chưa có chương. Hãy thêm chương đầu tiên bên dưới.";
    list.append(empty);
    return;
  }
  for (const chapter of chapters) {
    const row = document.createElement("div");
    row.className = "chapter-row";
    const info = document.createElement("div");
    info.className = "chapter-row-info";
    const number = document.createElement("strong");
    number.textContent = `CHƯƠNG ${chapter.number}`;
    const title = document.createElement("span");
    title.textContent = chapter.title;
    const contentState = document.createElement("span");
    contentState.className = `chapter-content-state${chapter.hasContent ? " ready" : ""}`;
    contentState.textContent = chapter.hasContent ? "Có nội dung" : "Chưa nhập nội dung";
    info.append(number, title, contentState);
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      makeButton("Sửa", "row-button", `Sửa chương ${chapter.number}`, () => onEdit(chapter)),
      makeButton("Xóa", "row-button delete", `Xóa chương ${chapter.number}`, () => onDelete(chapter))
    );
    row.append(info, actions);
    list.append(row);
  }
}

export function setChapterFormMode(form, chapter, nextNumber) {
  if (chapter) {
    form.elements.number.value = String(chapter.number);
    form.elements.title.value = chapter.title;
    form.elements.content.value = "";
    form.elements.isFree.checked = chapter.isFree;
    form.elements.publishAt.value = "";
  } else {
    form.reset();
    form.elements.number.value = String(nextNumber);
    form.elements.isFree.checked = true;
  }
  document.getElementById("chapter-form-title").textContent = chapter ? `Sửa chương ${chapter.number}` : "Thêm chương";
  document.getElementById("save-chapter").textContent = chapter ? "Lưu thay đổi" : "Thêm chương";
  document.getElementById("cancel-chapter-edit").hidden = !chapter;
}
