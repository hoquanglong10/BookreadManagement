import { listStories } from "../api/stories.js";
import { clearSession, getSession } from "../core/session.js";
import { renderAccountActions, renderCatalogStories, renderGenreFilters, setCatalogLoading, showCatalogStatus } from "../ui/catalog.js";

const searchInput = document.getElementById("search-input");
searchInput.value = new URLSearchParams(window.location.search).get("search")?.trim() || "";
let stories = [];
let activeGenre = "Tất cả";
let pendingSearch;
let activeRequest;

function refreshAccount() {
  renderAccountActions(getSession(), () => {
    clearSession();
    refreshAccount();
  });
}

function render() {
  renderGenreFilters(stories, activeGenre, genre => {
    activeGenre = genre;
    render();
  });
  renderCatalogStories(stories, searchInput.value.trim(), activeGenre);
}

async function loadStories() {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  const query = searchInput.value.trim();
  setCatalogLoading();
  try {
    const data = await listStories(query, request.signal);
    if (request !== activeRequest) return;
    if (!Array.isArray(data)) throw new Error("Dữ liệu truyện không hợp lệ.");
    stories = data;
    activeGenre = "Tất cả";
    render();
  } catch (error) {
    if (error.name === "AbortError" || request !== activeRequest) return;
    document.getElementById("result-summary").textContent = "Không thể tải dữ liệu";
    showCatalogStatus("Chưa kết nối được thư viện", error.message, loadStories);
  }
}

document.getElementById("search-form").addEventListener("submit", event => {
  event.preventDefault();
  clearTimeout(pendingSearch);
  const query = searchInput.value.trim();
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("search", query);
  else url.searchParams.delete("search");
  url.hash = "stories";
  window.history.replaceState(null, "", url);
  loadStories();
  document.getElementById("stories").scrollIntoView({ behavior: "smooth", block: "start" });
});
searchInput.addEventListener("input", () => {
  clearTimeout(pendingSearch);
  activeRequest?.abort();
  pendingSearch = setTimeout(loadStories, 300);
});
refreshAccount();
loadStories();
