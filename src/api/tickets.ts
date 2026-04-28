import apiClient from './client';
import type { ApiResponse, Page, Ticket, TicketStatus, TicketStatusUpdateRequest } from '../types';

export const ticketsApi = {
  getPage: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient
      .get<ApiResponse<Page<Ticket>>>('/tickets', { params })
      .then(r => r.data.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`).then(r => r.data.data),

  getByAsset: (assetId: number) =>
    apiClient.get<ApiResponse<Ticket[]>>(`/tickets/by-asset/${assetId}`).then(r => r.data.data),

  getActive: () =>
    apiClient.get<ApiResponse<Ticket[]>>('/tickets/active').then(r => r.data.data),

  countOpen: () =>
    apiClient.get<ApiResponse<{ openTickets: number }>>('/tickets/count/open').then(r => r.data.data),

  updateStatus: (id: number, status: TicketStatus) =>
    apiClient
      .patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status } as TicketStatusUpdateRequest)
      .then(r => r.data.data),
};
