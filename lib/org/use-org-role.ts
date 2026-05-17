"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { fetchOrgMembers } from "@/lib/org/org-organizations-api";
import { useAuthStore } from "@/stores/auth-store";

export type OrgRole = "owner" | "admin" | "member" | string;

export type UseOrgRoleResult = {
  /** Whichever role the current user has on this org, or `"member"` as the fallback. */
  role: OrgRole;
  isOwner: boolean;
  isAdmin: boolean;
  /** True for owners and admins — the role tier that may mutate escrows. */
  canManage: boolean;
  /** Still loading either the members list or the auth/me query. */
  isLoading: boolean;
};

type RoleMember = { user_id?: string; role?: string };

/**
 * Inline role lookup, DRY-ing the `fetchOrgMembers` + `fetchAuthMe` pattern
 * that several org components already use (see `org-wallet-view`,
 * `org-settings-view`, `org-settings-team-actions`).
 *
 * Keep this purely a wrapper — no new fetching, caching, or query-key style
 * is introduced; it just reuses the existing query keys so the same data is
 * shared across the page.
 */
export function useOrgRole(orgId: string): UseOrgRoleResult {
  const accessToken = useAuthStore((s) => s.accessToken);

  const membersQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "members"],
    queryFn: () => fetchOrgMembers(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 60_000,
  });

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
  });

  const members: RoleMember[] = (membersQuery.data ?? []) as RoleMember[];
  const myMember = members.find((m) => m.user_id === meQuery.data?.id);
  const role: OrgRole = myMember?.role ?? "member";
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  return {
    role,
    isOwner,
    isAdmin,
    canManage: isOwner || isAdmin,
    isLoading: membersQuery.isPending || meQuery.isPending,
  };
}
