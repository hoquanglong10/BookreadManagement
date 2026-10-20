import {
  createChapter, createStory, deleteChapter, deleteStory, getChapter, getStory,
  listChapters, listStories, updateChapter, updateStory
} from "../api/stories.js";
import { adminErrorMessage } from "../core/admin.js";
import { clearSession, requireAdmin, watchAdminSession } from "../core/session.js";
import { fillStoryForm, renderAdminChapters, renderAdminStories, setChapterFormMode, setStoryDialogMode } from "../ui/admin-stories.js";
import { showNotice } from "../ui/common.js";
import { listGenres } from "../api/genres.js";

const auth = requireAdmin();
if (auth) startStoryAdmin(auth);

function startStoryAdmin(session) {
  const searchInput = document.getElementById("search-input");
  const notice = document.getElementById("admin-notice");
  const storyDialog = document.getElementById("story-dialog");
  const storyForm = document.getElementById("story-form");
  const storyFormNotice = document.getElementById("story-form-notice");
  const storySaveButton = document.getElementById("save-story");
  const chaptersDialog = document.getElementById("chapters-dialog");
  const chaptersNotice = document.getElementById("chapters-notice");
  const chapterForm = document.getElementById("chapter-form");
  const chapterFormNotice = document.getElementById("chapter-form-notice");
  const chapterSaveButton = document.getElementById("save-chapter");
  const genreOptions = document.getElementById("genre-options");
  let stories = [];
  let chapters = [];
  let editingStoryId = null;
  let currentStoryId = null;
  let editingChapterId = null;
  let loadSequence = 0;
  let chapterLoadSequence = 0;

  document.getElementById("admin-name").textContent = session.user.username;
  watchAdminSession(session);

  function loadGenreOptions() {
    listGenres().then(genres => {
      genreOptions.replaceChildren(...genres.map(genre => {
        const option = document.createElement("option");
        option.value = genre.name;
        return option;
      }));
    }).catch(() => {});
  }

  function signOut() {
    clearSession();
    window.location.replace("./account.html");
  }

  function renderStories() {
    renderAdminStories(stories, searchInput.value.trim(), {
      onChapters: openChapters,
      onEdit: openStoryEdit,
      onDelete: removeStory
    });
  }

  async function loadStories() {
    const requestId = ++loadSequence;
    document.getElementById("refresh-button").disabled = true;
    try {
      const data = await listStories();
      if (requestId !== loadSequence) return false;
      if (!Array.isArray(data)) throw new Error("API trả dữ liệu danh sách không hợp lệ.");
      stories = data;
      renderStories();
      showNotice(notice, "");
      return true;
    } catch (error) {
      if (requestId === loadSequence) {
        showNotice(notice, adminErrorMessage(error), true);
        document.getElementById("result-count").textContent = "Không tải được dữ liệu";
      }
      return false;
    } finally {
      if (requestId === loadSequence) document.getElementById("refresh-button").disabled = false;
    }
  }

  function openStoryCreate() {
    editingStoryId = null;
    storyForm.reset();
    showNotice(storyFormNotice, "");
    setStoryDialogMode(false);
    storyDialog.showModal();
    storyForm.elements.title.focus();
  }

  async function openStoryEdit(id) {
    showNotice(notice, "");
    try {
      const story = await getStory(id);
      editingStoryId = id;
      fillStoryForm(storyForm, story);
      showNotice(storyFormNotice, "");
      setStoryDialogMode(true);
      storyDialog.showModal();
      storyForm.elements.title.focus();
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  async function removeStory(story) {
    if (!window.confirm(`Xóa truyện “${story.title}” và toàn bộ ${story.chapterCount} chương? Thao tác này không thể hoàn tác.`)) return;
    showNotice(notice, "");
    try {
      await deleteStory(story.id, session.token);
      if (await loadStories()) showNotice(notice, `Đã xóa truyện “${story.title}”.`);
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  storyForm.addEventListener("submit", async event => {
    event.preventDefault();
    showNotice(storyFormNotice, "");
    const body = {
      title: storyForm.elements.title.value.trim(),
      author: storyForm.elements.author.value.trim(),
      genre: storyForm.elements.genre.value.trim(),
      description: storyForm.elements.description.value.trim(),
      status: storyForm.elements.status.value,
      coverTheme: storyForm.elements.coverTheme.value
    };
    if ([body.title, body.author, body.genre, body.description].some(value => !value)) {
      showNotice(storyFormNotice, "Vui lòng nhập đầy đủ thông tin truyện.", true);
      return;
    }
    storySaveButton.disabled = true;
    try {
      const editing = editingStoryId !== null;
      if (editing) await updateStory(editingStoryId, body, session.token);
      else await createStory(body, session.token);
      storyDialog.close();
      if (await loadStories()) showNotice(notice, editing ? "Đã cập nhật truyện." : "Đã thêm truyện.");
      loadGenreOptions();
    } catch (error) {
      showNotice(storyFormNotice, adminErrorMessage(error), true);
    } finally {
      storySaveButton.disabled = false;
    }
  });

  function resetChapterForm() {
    editingChapterId = null;
    const nextNumber = chapters.reduce((max, chapter) => Math.max(max, chapter.number), 0) + 1;
    setChapterFormMode(chapterForm, null, nextNumber);
    showNotice(chapterFormNotice, "");
  }

  async function editChapter(chapter) {
    editingChapterId = chapter.id;
    setChapterFormMode(chapterForm, chapter);
    showNotice(chapterFormNotice, "");
    chapterForm.elements.content.value = "";
    chapterForm.elements.isFree.checked = chapter.isFree;
    chapterForm.elements.publishAt.value = toLocalDateTime(chapter.publishAt);
    chapterForm.elements.title.focus();
    try {
      const detail = await getChapter(chapter.id, session.token);
      if (editingChapterId !== chapter.id) return;
      chapterForm.elements.content.value = detail.content;
      chapterForm.elements.isFree.checked = detail.isFree;
      chapterForm.elements.publishAt.value = toLocalDateTime(detail.publishAt);
    } catch (error) {
      showNotice(chapterFormNotice, adminErrorMessage(error), true);
    }
  }

  function renderChapters() {
    renderAdminChapters(chapters, { onEdit: editChapter, onDelete: removeChapter });
  }

  async function loadChapters() {
    const requestId = ++chapterLoadSequence;
    const storyId = currentStoryId;
    try {
      const data = await listChapters(storyId);
      if (requestId !== chapterLoadSequence || storyId !== currentStoryId) return false;
      if (!Array.isArray(data)) throw new Error("API trả dữ liệu chương không hợp lệ.");
      chapters = data;
      renderChapters();
      showNotice(chaptersNotice, "");
      return true;
    } catch (error) {
      if (requestId === chapterLoadSequence) showNotice(chaptersNotice, adminErrorMessage(error), true);
      return false;
    }
  }

  async function openChapters(story) {
    currentStoryId = story.id;
    chapters = [];
    document.getElementById("chapters-story-name").textContent = story.title;
    document.getElementById("chapter-list").replaceChildren();
    showNotice(chaptersNotice, "Đang tải danh sách chương...");
    resetChapterForm();
    chaptersDialog.showModal();
    if (await loadChapters()) resetChapterForm();
  }

  async function removeChapter(chapter) {
    if (!window.confirm(`Xóa chương ${chapter.number} “${chapter.title}”?`)) return;
    try {
      await deleteChapter(currentStoryId, chapter.id, session.token);
      resetChapterForm();
      const refreshed = await loadChapters();
      await loadStories();
      if (refreshed) showNotice(chaptersNotice, `Đã xóa chương ${chapter.number}.`);
    } catch (error) {
      showNotice(chaptersNotice, adminErrorMessage(error), true);
    }
  }

  chapterForm.addEventListener("submit", async event => {
    event.preventDefault();
    showNotice(chapterFormNotice, "");
    const number = Number(chapterForm.elements.number.value);
    const title = chapterForm.elements.title.value.trim();
    const content = chapterForm.elements.content.value.trim();
    if (!Number.isSafeInteger(number) || number < 1 || number > 100000 || !title || !content) {
      showNotice(chapterFormNotice, "Nhập số chương, tên chương và nội dung.", true);
      return;
    }
    const publishValue = chapterForm.elements.publishAt.value;
    const body = {
      number,
      title,
      content,
      isFree: chapterForm.elements.isFree.checked,
      publishAt: publishValue ? new Date(publishValue).toISOString() : null
    };
    chapterSaveButton.disabled = true;
    try {
      const editing = editingChapterId !== null;
      if (editing) await updateChapter(currentStoryId, editingChapterId, body, session.token);
      else await createChapter(currentStoryId, body, session.token);
      const refreshed = await loadChapters();
      await loadStories();
      resetChapterForm();
      if (refreshed) showNotice(chaptersNotice, editing ? "Đã cập nhật chương." : "Đã thêm chương.");
    } catch (error) {
      showNotice(chapterFormNotice, adminErrorMessage(error), true);
    } finally {
      chapterSaveButton.disabled = false;
    }
  });

  document.getElementById("add-story").addEventListener("click", openStoryCreate);
  document.getElementById("refresh-button").addEventListener("click", loadStories);
  document.getElementById("close-story-dialog").addEventListener("click", () => storyDialog.close());
  document.getElementById("cancel-story").addEventListener("click", () => storyDialog.close());
  document.getElementById("close-chapters-dialog").addEventListener("click", () => chaptersDialog.close());
  document.getElementById("cancel-chapter-edit").addEventListener("click", resetChapterForm);
  document.getElementById("logout-button").addEventListener("click", signOut);
  searchInput.addEventListener("input", renderStories);
  loadGenreOptions();
  loadStories();
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
