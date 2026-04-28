// ─── Enums (mirror Spring Boot enums exactly) ────────────────────────────────

export type SensorType = 'VIBRATION' | 'TEMPERATURE' | 'COMBINED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// ─── API Response wrapper (mirrors ApiResponse<T>) ───────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

// ─── Pagination (Spring Data PagedModel via VIA_DTO) ─────────────────────────

export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Asset {
  id: number;
  name: string;
  location?: string;
  assetType?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sensor {
  id: number;
  assetId: number;
  assetName: string;
  name: string;
  serialNumber?: string;
  sensorType: SensorType;
  active: boolean;
  installedAt: string;
}

export interface Reading {
  id: number;
  sensorId: number;
  sensorName: string;
  assetId: number;
  assetName: string;
  rms: number;
  temperature: number;
  timestamp: string;
  processed: boolean;
}

export interface Threshold {
  id: number;
  assetId: number;
  assetName: string;
  rmsMax: number;
  tempMax: number;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  assetId: number;
  assetName: string;
  sensorId: number;
  sensorName: string;
  readingId: number;
  status: TicketStatus;
  description: string;
  createdAt: string;
  closedAt?: string;
}

export interface AvgRmsResponse {
  assetId: number;
  assetName: string;
  date: string;
  averageRms: number;
}

// ─── Request payloads ────────────────────────────────────────────────────────

export interface AssetRequest {
  name: string;
  location?: string;
  assetType?: string;
  description?: string;
}

export interface SensorRequest {
  assetId: number;
  name: string;
  serialNumber?: string;
  sensorType: SensorType;
}

export interface ThresholdRequest {
  assetId: number;
  rmsMax: number;
  tempMax: number;
}

export interface ReadingRequest {
  sensorId: number;
  rms: number;
  temperature: number;
  timestamp: string;
}

export interface IoTPayloadRequest {
  deviceId: string;
  rms: number;
  temp: number;
  ts: string;
}

export interface TicketStatusUpdateRequest {
  status: TicketStatus;
}
