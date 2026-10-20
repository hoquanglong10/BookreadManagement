import { requestJson } from "./client.js";

export const listGenres = () => requestJson("/api/genres");
export const createGenre = (name, token) => requestJson("/api/genres", { method: "POST", body: { name }, token });
export const updateGenre = (id, name, token) => requestJson(`/api/genres/${id}`, { method: "PUT", body: { name }, token });
export const deleteGenre = (id, token) => requestJson(`/api/genres/${id}`, { method: "DELETE", token });
