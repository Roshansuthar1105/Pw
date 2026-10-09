export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  profile: string;
  timestamp: string;
}
