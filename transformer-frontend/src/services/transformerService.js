import axiosClient from "../api/axiosClient";

const apiBase = "/transformers";

export const getTransformers = () => axiosClient.get(apiBase);
export const createTransformer = (data) => axiosClient.post(apiBase, data);
export const updateTransformer = (id, data) => axiosClient.put(`${apiBase}/${id}`, data);
export const deleteTransformer = (id) => axiosClient.delete(`${apiBase}/${id}`);
export const getImages = (id) => axiosClient.get(`${apiBase}/${id}/images`);

// Helper for <img> src (uses the same base as axios)
export const buildImageRawUrl = (imageId) => {
  const apiPrefix = (axiosClient.defaults.baseURL || "/api").replace(/\/$/, "");
  return `${apiPrefix}${apiBase}/images/${imageId}/raw`;
};
