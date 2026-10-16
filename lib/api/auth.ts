import {
  forgotPasswordResponseSchema,
  sessionResponseSchema,
  type ChangePasswordRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type UpdateProfileRequest,
} from "@/lib/schemas/auth";
import { userSchema } from "@/lib/schemas/entities";
import { apiRequest } from "./client";

/** Typed browser calls for `/api/auth/*` and `/api/me/*`. */
export const authApi = {
  register: (body: RegisterRequest) =>
    apiRequest("/api/auth/register", { method: "POST", body, schema: sessionResponseSchema }),
  login: (body: LoginRequest) => apiRequest("/api/auth/login", { method: "POST", body, schema: sessionResponseSchema }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  session: () => apiRequest("/api/auth/session", { schema: sessionResponseSchema }),
  forgotPassword: (body: ForgotPasswordRequest) =>
    apiRequest("/api/auth/forgot-password", { method: "POST", body, schema: forgotPasswordResponseSchema }),
  resetPassword: (body: ResetPasswordRequest) => apiRequest("/api/auth/reset-password", { method: "POST", body }),
};

export const meApi = {
  get: () => apiRequest("/api/me", { schema: userSchema }),
  update: (body: UpdateProfileRequest) => apiRequest("/api/me", { method: "PATCH", body, schema: userSchema }),
  changePassword: (body: ChangePasswordRequest) => apiRequest("/api/me/password", { method: "POST", body }),
};
