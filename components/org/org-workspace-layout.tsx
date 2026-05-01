"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, MenuIcon, UserIcon } from "lucide-react";

import { WorkspaceSidebarLogout } from "@/components/dashboard/workspace-sidebar-logout";
import { UserNotificationsNavPopover } from "@/components/notifications/user-notifications-nav-popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OrgWorkspaceAccessGate } from "@/components/org/org-workspace-access-gate";
import {
  mergeOrgSidebarSections,
  isOrgSidebarItemActive,
} from "@/lib/org/org-nav";
import { fetchMeOrganizations } from "@/lib/organizations/me-organizations-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

function OrgNavBody({
  orgId,
  onNavigate,
}: {
  orgId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { typography } = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);

  const orgsQuery = useQuery({
    queryKey: ["me", "organizations"],
    queryFn: () => fetchMeOrganizations(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const sections = mergeOrgSidebarSections(orgId, orgsQuery.data ?? []);

  return (
    <nav className="flex flex-col gap-6" aria-label="Organization workspace">
      {sections.map((section) => (
        <div key={section.heading}>
          <p
            className={cn(
              typography.eyebrow,
              "mb-2 px-2 text-[0.65rem] opacity-80",
            )}
          >
            {section.heading}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isOrgSidebarItemActive(pathname, item);
              return (
                <li key={`${section.heading}:${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function OrgWorkspaceLayout({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const { layout, typography, brand, surfaces, controls } =
    ethitrustThemeTokens;
  const orgHref = `/org/${orgId}/escrows`;

  return (
    <div className={cn(layout.page, "grain flex min-h-screen flex-col")}>
      <header className={surfaces.stickyHeader}>
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-full max-h-[100dvh] w-72 flex-col gap-0 overflow-hidden pt-10"
            >
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-lg">
                  {brand.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-1">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <OrgNavBody orgId={orgId} />
                </div>
                <div className="shrink-0 border-t border-border pt-4">
                  <WorkspaceSidebarLogout />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href={orgHref} className="flex min-w-0 items-center gap-2">
            <span className={controls.brandMark}>
              <Building2 className="size-4" aria-hidden />
            </span>
            <span className={cn(typography.wordmark, "truncate")}>
              Org workspace
            </span>
          </Link>

          <span className="hidden max-w-[10rem] truncate font-mono text-[10px] text-muted-foreground md:inline md:max-w-[14rem]">
            {orgId}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <UserNotificationsNavPopover />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              asChild
            >
              <Link href="/profile" aria-label="Profile">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-muted">
                    <UserIcon className="size-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[15.5rem] shrink-0 flex-col border-r border-border bg-card/35 backdrop-blur-md md:flex lg:w-64"
          aria-label="Organization sidebar"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto py-6 pl-4 pr-3 lg:pl-6">
              <OrgNavBody orgId={orgId} />
            </div>
            <div className="shrink-0 border-t border-border px-4 py-4 lg:px-6">
              <WorkspaceSidebarLogout />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <OrgWorkspaceAccessGate orgId={orgId}>
            {children}
          </OrgWorkspaceAccessGate>
        </main>
      </div>
    </div>
  );
}
