"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { writeCollapsePreference } from "../../lib/sidebar/collapse-cookie-client.ts";
import { getRoleNavigation } from "../../lib/sidebar/navigation.ts";
import { withNotificationBadge } from "../../lib/notifications/rules.ts";
import { getNavigationWidth } from "../../lib/sidebar/presentation.ts";
import type { SidebarAccountState } from "../../lib/sidebar/types.ts";
import type { UserRole } from "../../lib/auth/types.ts";
import MobileTopBar from "./mobile-top-bar";
import SidebarAccount from "./sidebar-account";
import SidebarAccountMenu from "./sidebar-account-menu";
import SidebarDrawer from "./sidebar-drawer";
import SidebarHeader from "./sidebar-header";
import SidebarNav from "./sidebar-nav";
import { useUnreadNotifications } from "./use-unread-notifications.ts";

interface SidebarProps {
  role: UserRole;
  account: SidebarAccountState;
  initialCollapsed: boolean;
}

/** Contenedor del menú lateral para escritorio, tablet y móvil. */
export default function Sidebar({
  role,
  account,
  initialCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const baseId = useId();
  const sidebarId = `${baseId}-sidebar`;
  const drawerId = `${baseId}-drawer`;
  const desktopMenuId = `${baseId}-account-menu`;
  const drawerMenuId = `${baseId}-drawer-account-menu`;

  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [closedSections, setClosedSections] = useState<Record<string, string>>(
    {},
  );

  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopAccountTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerAccountTriggerRef = useRef<HTMLButtonElement>(null);

  const unreadCount = useUnreadNotifications();
  const items = withNotificationBadge(getRoleNavigation(role), unreadCount);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setAccountMenuOpen(false);
    setDrawerOpen(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;

    setCollapsed(next);
    writeCollapsePreference(next);
  }, [collapsed]);

  const toggleAccountMenu = useCallback(() => {
    setAccountMenuOpen((current) => !current);
  }, []);

  const closeAccountMenu = useCallback(() => {
    setAccountMenuOpen(false);
  }, []);

  const isSectionOpen = (label: string) => closedSections[label] !== pathname;

  const toggleSection = (label: string) => {
    setClosedSections((current) => ({
      ...current,
      [label]: current[label] === pathname ? "" : pathname,
    }));
  };

  useEffect(() => {
    function handlePopState() {
      setDrawerOpen(false);
      setAccountMenuOpen(false);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setDrawerOpen(false);
        setAccountMenuOpen(false);
      }
    }

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const desktopMode = collapsed ? "collapsed" : "expanded";
  const desktopMenuOpen = accountMenuOpen && !drawerOpen;
  const drawerMenuOpen = accountMenuOpen && drawerOpen;

  return (
    <>
      <aside
        id={sidebarId}
        aria-label="Menú lateral"
        data-collapsed={collapsed ? "true" : "false"}
        data-role={role}
        data-account-status={account.status}
        style={{
          width: getNavigationWidth(collapsed ? "collapsed" : "expanded"),
        }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-borde-input bg-superficie lg:flex"
      >
        <div className="shrink-0">
          <SidebarHeader
            mode={desktopMode}
            sidebarId={sidebarId}
            onToggleCollapse={toggleCollapse}
            onCloseDrawer={closeDrawer}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav
            key={`desktop-${collapsed ? "collapsed" : "expanded"}`}
            items={items}
            pathname={pathname}
            collapsed={collapsed}
            isSectionOpen={isSectionOpen}
            onToggleSection={toggleSection}
          />
        </div>

        <SidebarAccount
          account={account}
          collapsed={collapsed}
          menuOpen={desktopMenuOpen}
          menuId={desktopMenuId}
          onToggleMenu={toggleAccountMenu}
          triggerRef={desktopAccountTriggerRef}
          menu={
            <SidebarAccountMenu
              open={desktopMenuOpen}
              id={desktopMenuId}
              account={account}
              collapsed={collapsed}
              onClose={closeAccountMenu}
              triggerRef={desktopAccountTriggerRef}
            />
          }
        />
      </aside>

      <MobileTopBar
        onOpenMenu={openDrawer}
        menuOpen={drawerOpen}
        menuId={drawerId}
        triggerRef={mobileTriggerRef}
      />

      <SidebarDrawer
        id={drawerId}
        open={drawerOpen}
        onClose={closeDrawer}
        triggerRef={mobileTriggerRef}
        header={
          <SidebarHeader
            mode="drawer"
            sidebarId={drawerId}
            onToggleCollapse={closeDrawer}
            onCloseDrawer={closeDrawer}
          />
        }
        footer={
          <SidebarAccount
            account={account}
            collapsed={false}
            menuOpen={drawerMenuOpen}
            menuId={drawerMenuId}
            onToggleMenu={toggleAccountMenu}
            triggerRef={drawerAccountTriggerRef}
            menu={
              <SidebarAccountMenu
                open={drawerMenuOpen}
                id={drawerMenuId}
                account={account}
                collapsed={false}
                onClose={closeAccountMenu}
                triggerRef={drawerAccountTriggerRef}
              />
            }
          />
        }
      >
        <SidebarNav
          items={items}
          pathname={pathname}
          collapsed={false}
          onNavigate={closeDrawer}
          isSectionOpen={isSectionOpen}
          onToggleSection={toggleSection}
        />
      </SidebarDrawer>
    </>
  );
}
