import { sessionResponseSchema } from "@/lib/schemas/auth";
import {
  inviteResponseSchema,
  invitesResponseSchema,
  membersResponseSchema,
  workspaceResponseSchema,
  type AcceptInviteRequest,
  type CreateInviteRequest,
  type UpdateWorkspaceRequest,
} from "@/lib/schemas/workspace";
import { apiRequest } from "./client";

/** Typed browser calls for `/api/workspace/*`. */
export const workspaceApi = {
  get: () => apiRequest("/api/workspace", { schema: workspaceResponseSchema }),
  update: (body: UpdateWorkspaceRequest) =>
    apiRequest("/api/workspace", { method: "PATCH", body, schema: workspaceResponseSchema }),
  members: () => apiRequest("/api/workspace/members", { schema: membersResponseSchema }),
  removeMember: (userId: string) =>
    apiRequest(`/api/workspace/members/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  invites: () => apiRequest("/api/workspace/invites", { schema: invitesResponseSchema }),
  createInvite: (body: CreateInviteRequest) =>
    apiRequest("/api/workspace/invites", { method: "POST", body, schema: inviteResponseSchema }),
  revokeInvite: (inviteId: string) =>
    apiRequest(`/api/workspace/invites/${encodeURIComponent(inviteId)}`, { method: "DELETE" }),
};

/** The public invite flow (`/api/invites/:token/*`). */
export const inviteApi = {
  accept: (token: string, body: AcceptInviteRequest) =>
    apiRequest(`/api/invites/${encodeURIComponent(token)}/accept`, { method: "POST", body, schema: sessionResponseSchema }),
};
