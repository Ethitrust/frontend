"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { isPlatformAdminRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/stores/auth-store";

function onAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/** Auth entry pages — once signed in, the user should not stay here. */
function isSignedInForbiddenAuthPath(pathname: string): boolean {
  return pathname === "/signin" || pathname === "/signup";
}

/** Routes platform admins may open without going to `/admin`. */
function isPublicAuthPath(pathname: string): boolean {
  return (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email"
  );
}

/**
 * Keeps `/admin` restricted to operator roles and confines platform admins to
 * `/admin` (plus `/signin` and related auth URLs so logout / onboarding still works).
 */
export function SessionRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken || !meQuery.isSuccess || !meQuery.data) return;

    const admin = isPlatformAdminRole(meQuery.data.role);

    // Already signed in — bounce away from /signin and /signup.
    if (isSignedInForbiddenAuthPath(pathname)) {
      router.replace(admin ? "/admin" : "/dashboard");
      return;
    }

    if (onAdminPath(pathname) && !admin) {
      router.replace("/dashboard");
      return;
    }

    if (admin && !onAdminPath(pathname) && !isPublicAuthPath(pathname)) {
      router.replace("/admin");
    }
  }, [accessToken, meQuery.isSuccess, meQuery.data?.role, pathname, router]);

  return children;
}
