import { UserRole, DriverStatus, RideStatus, PaymentMethod, PaymentStatus, AdminRole, NotificationType, SupportTicketStatus, SupportTicketPriority, ServerErrorSeverity } from "@prisma/client";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface JwtPayload {
  userId: string;
  role: UserRole;
  firebaseUid: string;
}

export interface AdminJwtPayload {
  adminId: string;
  role: AdminRole;
  email: string;
}

export interface AuthVerifyBody {
  idToken: string;
}

export interface RegisterBody {
  idToken: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
}

// Ride types
export interface FareEstimateQuery {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  nightCharge: number;
  surgeCharge: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes: number;
}

export interface BookRideBody {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropAddress: string;
  dropLatitude: number;
  dropLongitude: number;
  paymentMethod: PaymentMethod;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
}

// WebSocket event types
export interface WsRideAccepted {
  rideId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleNumber: string;
  vehicleColor: string;
  driverLatitude: number;
  driverLongitude: number;
  eta: number;
}

export interface WsDriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
}

export interface WsNewRideRequest {
  rideId: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropAddress: string;
  dropLatitude: number;
  dropLongitude: number;
  distanceKm: number;
  estimatedFare: number;
  distanceFromDriver: number;
}

// Admin types
export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  ridesToday: number;
  revenueToday: number;
  activeRides: number;
  driversOnline: number;
  pendingApprovals: number;
  openTickets: number;
}

export interface AnalyticsData {
  date: string;
  rides: number;
  revenue: number;
}

// Permission check
export type Permission =
  | "view_dashboard"
  | "view_rides"
  | "view_errors"
  | "manage_admins"
  | "approve_drivers"
  | "ban_users"
  | "view_payments"
  | "process_payouts"
  | "issue_refunds"
  | "manage_promotions"
  | "update_fare"
  | "manage_tickets"
  | "view_activity_logs";

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "view_dashboard", "view_rides", "view_errors", "manage_admins",
    "approve_drivers", "ban_users", "view_payments", "process_payouts",
    "issue_refunds", "manage_promotions", "update_fare", "manage_tickets",
    "view_activity_logs",
  ],
  DEVELOPER: [
    "view_dashboard", "view_rides", "view_errors", "view_activity_logs",
  ],
  OPERATIONS: [
    "view_dashboard", "view_rides", "approve_drivers", "ban_users",
    "view_payments", "manage_promotions", "manage_tickets", "view_activity_logs",
  ],
  FINANCE: [
    "view_dashboard", "view_rides", "view_payments", "process_payouts",
    "issue_refunds", "manage_promotions", "update_fare",
  ],
  CUSTOMER_SERVICE: [
    "view_dashboard", "view_rides", "ban_users", "manage_tickets",
  ],
  SUPPORT_AGENT: [
    "view_rides", "manage_tickets",
  ],
};
