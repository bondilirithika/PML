import apiClient from './client';
import type { ApiResponse, Threshold, ThresholdRequest } from '../types';

export const thresholdsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Threshold[]>>('/thresholds').then(r => r.data.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Threshold>>(`/thresholds/${id}`).then(r => r.data.data),

  getByAsset: (assetId: number) =>
    apiClient.get<ApiResponse<Threshold>>(`/thresholds/by-asset/${assetId}`).then(r => r.data.data),

  create: (payload: ThresholdRequest) =>
    apiClient.post<ApiResponse<Threshold>>('/thresholds', payload).then(r => r.data.data),

  update: (id: number, payload: ThresholdRequest) =>
    apiClient.put<ApiResponse<Threshold>>(`/thresholds/${id}`, payload).then(r => r.data.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/thresholds/${id}`).then(r => r.data),
};
