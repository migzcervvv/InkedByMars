export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_TIMEOUT_MS = 15000;

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin";

export const BOOKING_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
  onHold: "on-hold",
};

export const SLOT_STATUS = {
  available: "available",
  booked: "booked",
  onHold: "on-hold",
  closed: "closed",
};

export const DAY_STATUS = {
  open: "open",
  fullyClosed: "fully_closed",
  partiallyClosed: "partially_closed",
  holiday: "holiday",
};
