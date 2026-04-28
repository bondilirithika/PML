import apiClient from './client';
import type { ApiResponse, Asset, AssetRequest, AvgRmsResponse } from '../types';

export const assetsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Asset[]>>('/assets').then(r => r.data.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Asset>>(`/assets/${id}`).then(r => r.data.data),

  create: (payload: AssetRequest) =>
    apiClient.post<ApiResponse<Asset>>('/assets', payload).then(r => r.data.data),

  update: (id: number, payload: AssetRequest) =>
    apiClient.put<ApiResponse<Asset>>(`/assets/${id}`, payload).then(r => r.data.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/assets/${id}`).then(r => r.data),

  getViolations: () =>
    apiClient.get<ApiResponse<Asset[]>>('/assets/violations').then(r => r.data.data),

  getAvgRms: () =>
    apiClient.get<ApiResponse<AvgRmsResponse[]>>('/assets/avg-rms').then(r => r.data.data),
};
