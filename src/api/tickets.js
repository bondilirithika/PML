import apiClient from './client';

export const ticketsApi = {
  getPage: (params) =>
    apiClient
      .get('/tickets', { params })
      .then(r => r.data.data),

  getById: (id) =>
    apiClient.get(`/tickets/${id}`).then(r => r.data.data),

  getByAsset: (assetId) =>
    apiClient.get(`/tickets/by-asset/${assetId}`).then(r => r.data.data),

  getActive: () =>
    apiClient.get('/tickets/active').then(r => r.data.data),

  countOpen: () =>
    apiClient.get('/tickets/count/open').then(r => r.data.data),

  updateStatus: (id, status) =>
    apiClient
      .patch(`/tickets/${id}/status`, { status })
      .then(r => r.data.data),
};
