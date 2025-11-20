export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: number;
  uptime: number;
  services: {
    sui: boolean;
    walrus: boolean;
    websocket: boolean;
  };
}

export interface CreateVaultRequest {
  walrus_blob_id: string;
}

export interface UpdateVaultRequest {
  vault_id: string;
  walrus_blob_id: string;
}

export interface CreatePasswordEntryRequest {
  vault_id: string;
  domain_hash: string;
  password_hash: string;
  device_id: string;
}

export interface RecordUsageRequest {
  entry_id: string;
  device_id: string;
}

export interface GetAlertsRequest {
  vault_id: string;
  page?: number;
  limit?: number;
  type?: 'login_attempt' | 'suspicious_activity' | 'password_breach' | 'unauthorized_access';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}