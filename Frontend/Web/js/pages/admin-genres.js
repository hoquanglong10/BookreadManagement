import { createGenre, deleteGenre, listGenres, updateGenre } from "../api/genres.js";
import { adminErrorMessage } from "../core/admin.js";
import { clearSession, requireAdmin, watchAdminSession } from "../core/session.js";
import { showNotice } from "../ui/common.js";

const session = requireAdmin();
if (session) start(session);

function start(auth) {
  const form = document.getElementById("genre-form");
  const input = form.elements.name;
  const rows = document.getElementById("genre-rows");
  const notice = document.getElementById("genre-notice");
  const save = document.getElementById("genre-save");
  let genres = [];
  let editingId = null;

  document.getElementById("admin-name").textContent = auth.user.username;
  document.getElementById("logout-button").addEventListener("click", () => {
    clearSession();
    window.location.replace("./account.html");
  });
  watchAdminSession(auth);

  function resetForm() {
    editingId = null;
    form.reset();
    save.textContent = "Thêm thể loại";
    document.getElementById("genre-cancel").hidden = true;
  }

  function render() {
    rows.replaceChildren();
    document.getElementById("genre-count").textContent = String(genres.length);
    for (const genre of genres) {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const name = document.createElement("strong");
      name.textContent = genre.name;
      nameCell.append(name);
      const countCell = document.createElement("td");
      countCell.textContent = `${genre.storyCount} truyện`;
      const actionCell = document.createElement("td");
      actionCell.className = "table-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Sửa";
      edit.addEventListener("click", () => {
        editingId = genre.id;
        input.value = genre.name;
        save.textContent = "Lưu thay đổi";
        document.getElementById("genre-cancel").hidden = false;
        input.focus();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger-text";
      remove.textContent = "Xóa";
      remove.addEventListener("click", () => removeGenre(genre));
      actionCell.append(edit, remove);
      row.append(nameCell, countCell, actionCell);
      rows.append(row);
    }
    document.getElementById("genre-empty").hidden = genres.length > 0;
    document.getElementById("genre-table").hidden = genres.length === 0;
  }

  async function reload() {
    try {
      genres = await listGenres();
      render();
      showNotice(notice, "");
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  async function removeGenre(genre) {
    if (!window.confirm(`Xóa thể loại “${genre.name}”?`)) return;
    try {
      await deleteGenre(genre.id, auth.token);
      await reload();
      showNotice(notice, `Đã xóa thể loại “${genre.name}”.`);
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return showNotice(notice, "Nhập tên thể loại.", true);
    const editing = editingId !== null;
    try {
      if (editingId === null) await createGenre(name, auth.token);
      else await updateGenre(editingId, name, auth.token);
      resetForm();
      await reload();
      showNotice(notice, editing ? "Đã cập nhật thể loại." : "Đã thêm thể loại.");
    } catch (error) {
      showNotice(notice, adminErrorMessage(error), true);
    }
  });

  document.getElementById("genre-cancel").addEventListener("click", resetForm);
  reload();
}
