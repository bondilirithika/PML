import apiClient from './client';
import type { ApiResponse, IoTPayloadRequest, Reading } from '../types';

export const simulatorApi = {
  publish: (payload: IoTPayloadRequest) =>
    apiClient
      .post<ApiResponse<Reading>>('/simulator/publish', payload)
      .then(r => r.data.data),
};
