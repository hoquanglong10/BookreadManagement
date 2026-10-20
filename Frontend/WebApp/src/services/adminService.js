import {
  createChapterRequest, createCustomerRequest, createGenreRequest, createStoryRequest,
  deleteChapterRequest, deleteCustomerRequest, deleteGenreRequest, deleteStoryRequest,
  getCustomersRequest, getCustomerRequest, updateChapterRequest, updateCustomerRequest,
  updateGenreRequest, updateStoryRequest
} from "../api/adminApi.js";
import { getChapterRequest } from "../api/catalogApi.js";

export const adminService = {
  createStory: body => createStoryRequest(body),
  updateStory: (id, body) => updateStoryRequest(id, body),
  deleteStory: id => deleteStoryRequest(id),
  createChapter: (storyId, body) => createChapterRequest(storyId, body),
  updateChapter: (storyId, chapterId, body) => updateChapterRequest(storyId, chapterId, body),
  deleteChapter: (storyId, chapterId) => deleteChapterRequest(storyId, chapterId),
  getChapter: id => getChapterRequest(id),
  createGenre: name => createGenreRequest(name),
  updateGenre: (id, name) => updateGenreRequest(id, name),
  deleteGenre: id => deleteGenreRequest(id),
  getCustomers: () => getCustomersRequest(),
  getCustomer: id => getCustomerRequest(id),
  createCustomer: body => createCustomerRequest(body),
  updateCustomer: (id, body) => updateCustomerRequest(id, body),
  deleteCustomer: id => deleteCustomerRequest(id)
};
