export type AdminRole = "SUPER_ADMIN" | "DEVELOPER" | "CUSTOMER_SERVICE" | "FINANCE" | "OPERATIONS" | "SUPPORT_AGENT";

export interface AdminUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
