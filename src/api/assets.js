import apiClient from './client';

export const assetsApi = {
  getAll: () =>
    apiClient.get('/assets').then(r => r.data.data),

  getById: (id) =>
    apiClient.get(`/assets/${id}`).then(r => r.data.data),

  create: (payload) =>
    apiClient.post('/assets', payload).then(r => r.data.data),

  update: (id, payload) =>
    apiClient.put(`/assets/${id}`, payload).then(r => r.data.data),

  setStatus: (id, active) =>
    apiClient.patch(`/assets/${id}/status`, { active }).then(r => r.data.data),

  delete: (id) =>
    apiClient.delete(`/assets/${id}`).then(r => r.data),

  getViolations: () =>
    apiClient.get('/assets/violations').then(r => r.data.data),

  getAvgRms: () =>
    apiClient.get('/assets/avg-rms').then(r => r.data.data),
};
