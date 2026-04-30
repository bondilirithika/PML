import apiClient from './client';

export const sensorsApi = {
  getAll: () =>
    apiClient.get('/sensors').then(r => r.data.data),

  getById: (id) =>
    apiClient.get(`/sensors/${id}`).then(r => r.data.data),

  getByAsset: (assetId) =>
    apiClient.get(`/sensors/by-asset/${assetId}`).then(r => r.data.data),

  create: (payload) =>
    apiClient.post('/sensors', payload).then(r => r.data.data),

  update: (id, payload) =>
    apiClient.put(`/sensors/${id}`, payload).then(r => r.data.data),

  setStatus: (id, active) =>
    apiClient.patch(`/sensors/${id}/status`, { active }).then(r => r.data.data),

  delete: (id) =>
    apiClient.delete(`/sensors/${id}`).then(r => r.data),
};
