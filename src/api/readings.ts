import apiClient from './client';
import type { ApiResponse, Page, Reading, ReadingRequest } from '../types';

export const readingsApi = {
  getPage: (params: {
    sensorId: number;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient
      .get<ApiResponse<Page<Reading>>>('/readings', { params })
      .then(r => r.data.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Reading>>(`/readings/${id}`).then(r => r.data.data),

  create: (payload: ReadingRequest) =>
    apiClient.post<ApiResponse<Reading>>('/readings', payload).then(r => r.data.data),
};
