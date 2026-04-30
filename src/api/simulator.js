import apiClient from './client';

export const simulatorApi = {
  publish: (payload) =>
    apiClient
      .post('/simulator/publish', payload)
      .then(r => r.data.data),
};
