"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
 * Routes that do NOT require authentication. Anyone (signed in or out) may
 * reach these. Everything else is treated as protected and an unauthenticated
 * visitor is redirected to `/signin?next=<original-path>`.
 *
 * Keep this list in sync with `app/` top-level public routes.
 */
function isUnauthenticatedAllowedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/signin") return true;
  if (pathname === "/signup") return true;
  if (pathname === "/forgot-password") return true;
  if (pathname === "/verify-email") return true;
  if (pathname === "/reset-password" || pathname.startsWith("/reset-password/")) return true;
  // Public invite landing + developer docs.
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.startsWith("/developer/")) return true;
  return false;
}

/** Build a safe `?next=` value from the current path + query string. */
function buildNextParam(pathname: string, search: string): string {
  // `pathname` always starts with `/`. Only forward the path + query so we
  // never leak host/protocol into the redirect target.
  const target = search ? `${pathname}?${search}` : pathname;
  return encodeURIComponent(target);
}

/**
 * Keeps `/admin` restricted to operator roles and confines platform admins to
 * `/admin` (plus `/signin` and related auth URLs so logout / onboarding still works).
 *
 * Also redirects unauthenticated visitors away from protected routes to
 * `/signin?next=<original-path>` so they return to where they were headed after
 * signing in.
 */
export function SessionRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  // Zustand `persist` hydrates from localStorage after the first client render.
  // Until hydration finishes, `accessToken` looks `null` even for signed-in users,
  // which would cause every protected page to flash a redirect to `/signin`.
  const [hydrated, setHydrated] = useState<boolean>(() =>
    // `hasHydrated` is available on the persist API at runtime.
    useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  useEffect(() => {
    if (hydrated) return;
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });
    return () => {
      unsubscribe?.();
    };
  }, [hydrated]);

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
  });

  // Redirect unauthenticated visitors on protected routes to `/signin?next=...`.
  useEffect(() => {
    if (!hydrated) return;
    if (accessToken) return;
    if (isUnauthenticatedAllowedPath(pathname)) return;

    const search = searchParams?.toString() ?? "";
    const next = buildNextParam(pathname, search);
    router.replace(`/signin?next=${next}`);
  }, [hydrated, accessToken, pathname, searchParams, router]);

  // Role-based bouncing for signed-in users.
  useEffect(() => {
    if (!accessToken || !meQuery.isSuccess || !meQuery.data) return;

    const admin = isPlatformAdminRole(meQuery.data.role);

    // Already signed in — bounce away from /signin and /signup.
    if (isSignedInForbiddenAuthPath(pathname)) {
      // Honour `?next=` so deep-link flows (invites, KYC, etc.) survive a
      // signed-in user reopening the signin/signup page directly.
      const nextParam = searchParams?.get("next") ?? null;
      const safeNext = nextParam && nextParam.startsWith("/") ? nextParam : null;
      // Admins are still confined to `/admin` unless `next` itself targets
      // `/admin/*`.
      if (admin) {
        router.replace(safeNext && safeNext.startsWith("/admin") ? safeNext : "/admin");
      } else {
        router.replace(safeNext ?? "/dashboard");
      }
      return;
    }

    if (onAdminPath(pathname) && !admin) {
      router.replace("/dashboard");
      return;
    }

    if (admin && !onAdminPath(pathname) && !isPublicAuthPath(pathname)) {
      router.replace("/admin");
    }
  }, [
    accessToken,
    meQuery.isSuccess,
    meQuery.data?.role,
    pathname,
    searchParams,
    router,
  ]);

  return children;
}
