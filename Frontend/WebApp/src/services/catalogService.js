import { getChaptersRequest, getGenresRequest, getStoriesRequest, getStoryRequest, readChapterRequest } from "../api/catalogApi.js";

export async function loadCatalog({ search = "", genreId = "", status = "", sort = "updated", page = 1, pageSize = 6 } = {}) {
  const params = { page, pageSize, sort };
  if (search) params.search = search;
  if (genreId) params.genreId = Number(genreId);
  if (status) params.status = status;
  const [storyResult, genres] = await Promise.all([
    getStoriesRequest(params),
    getGenresRequest()
  ]);
  const stories = Array.isArray(storyResult) ? storyResult : storyResult?.items ?? [];
  return {
    stories,
    genres: Array.isArray(genres) ? genres : [],
    pagination: {
      page: storyResult?.page ?? page,
      pageSize: storyResult?.pageSize ?? pageSize,
      totalCount: storyResult?.totalCount ?? stories.length,
      totalPages: storyResult?.totalPages ?? 1
    }
  };
}

export const loadStory = id => getStoryRequest(id);
export const loadChapters = id => getChaptersRequest(id);
export const loadChapter = (storyId, number) => readChapterRequest(storyId, number);
