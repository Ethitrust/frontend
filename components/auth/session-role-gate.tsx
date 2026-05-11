"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { isPlatformAdminRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/stores/auth-store";

function onAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Avoid a common pitfall: on first paint `accessToken` is null until
    // zustand/persist rehydrates from localStorage, which can briefly show
    // "Sign in" UI even though a valid token exists.
    const unsub = useAuthStore.persist?.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useAuthStore.persist?.hasHydrated() ?? false);
    
    // If persist is not available for some reason, or already hydrated
    if (!useAuthStore.persist) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  const pathname = usePathname() ?? "";
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!hydrated) {
    // During server-side rendering (prerendering), we render the children
    // so that static pages have content. On the client, we wait for
    // hydration before applying any redirect logic to avoid "flickering"
    // or incorrect redirects while the accessToken is being loaded from
    // local storage.
    if (typeof window === 'undefined') {
      return children;
    }
    return null;
  }

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken || !meQuery.isSuccess || !meQuery.data) return;

    const admin = isPlatformAdminRole(meQuery.data.role);

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
