import apiClient from './client';

export const readingsApi = {
  getPage: (params) =>
    apiClient
      .get('/readings', { params })
      .then(r => r.data.data),

  getById: (id) =>
    apiClient.get(`/readings/${id}`).then(r => r.data.data),

  create: (payload) =>
    apiClient.post('/readings', payload).then(r => r.data.data),
};
