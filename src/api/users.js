import apiClient from './client';

export const usersApi = {
  getAll:    ()            => apiClient.get('/users').then(r => r.data.data),
  create:    (data)        => apiClient.post('/users', data).then(r => r.data.data),
  delete:    (id)          => apiClient.delete(`/users/${id}`),
  setStatus: (id, active)  => apiClient.patch(`/users/${id}/status`, { active }).then(r => r.data.data),
};
