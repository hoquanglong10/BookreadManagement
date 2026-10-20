import { getStory, listChapters } from "../api/stories.js";
import { renderStoryDetail, showStoryError } from "../ui/story.js?v=reading-room-2";

document.getElementById("detail-search-form").addEventListener("submit", event => {
  event.preventDefault();
  const query = document.getElementById("detail-search-input").value.trim();
  const target = new URL("./", window.location.href);
  if (query) target.searchParams.set("search", query);
  target.hash = "stories";
  window.location.assign(target);
});

const storyId = Number(new URLSearchParams(window.location.search).get("id"));
if (!Number.isSafeInteger(storyId) || storyId < 1) {
  showStoryError("Đường dẫn truyện không hợp lệ.");
} else {
  Promise.all([getStory(storyId), listChapters(storyId)])
    .then(([story, chapters]) => renderStoryDetail(story, chapters))
    .catch(error => showStoryError(error.status === 404
      ? "Truyện này không tồn tại hoặc đã được gỡ."
      : error.message));
}
