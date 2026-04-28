import apiClient from './client';
import type { ApiResponse, Sensor, SensorRequest } from '../types';

export const sensorsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Sensor[]>>('/sensors').then(r => r.data.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Sensor>>(`/sensors/${id}`).then(r => r.data.data),

  getByAsset: (assetId: number) =>
    apiClient.get<ApiResponse<Sensor[]>>(`/sensors/by-asset/${assetId}`).then(r => r.data.data),

  create: (payload: SensorRequest) =>
    apiClient.post<ApiResponse<Sensor>>('/sensors', payload).then(r => r.data.data),

  update: (id: number, payload: SensorRequest) =>
    apiClient.put<ApiResponse<Sensor>>(`/sensors/${id}`, payload).then(r => r.data.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/sensors/${id}`).then(r => r.data),
};
