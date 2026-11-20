"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { getSidebarIconPath } from "../../lib/sidebar/icons.ts";
import {
  getActiveChild,
  isHrefActive,
  isSectionItem,
  type SidebarNavSection,
} from "../../lib/sidebar/navigation.ts";
import { buildNotificationMenuLabel } from "../../lib/notifications/labels.ts";
import type {
  SidebarIconKey,
  SidebarMatchMode,
  SidebarNavItem,
} from "../../lib/sidebar/types.ts";
import NotificationBadge from "./notification-badge.tsx";

interface SidebarNavProps {
  items: readonly SidebarNavItem[];
  pathname: string;
  collapsed: boolean;
  isSectionOpen: (label: string) => boolean;
  onToggleSection: (label: string) => void;
  onNavigate?: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

interface NavLinkRowProps {
  label: string;
  icon: SidebarIconKey;
  href: string | null;
  enabled: boolean;
  match: SidebarMatchMode;
  pathname: string;
  activeOverride?: boolean;
  collapsed: boolean;
  indent: boolean;
  badge?: number;
  tooltipKey: string;
  openTooltip: string | null;
  setOpenTooltip: (key: string | null) => void;
  onNavigate?: () => void;
}

/** Fila de enlace o de opción no disponible. */
function NavLinkRow({
  label,
  icon,
  href,
  enabled,
  match,
  pathname,
  activeOverride,
  collapsed,
  indent,
  badge,
  tooltipKey,
  openTooltip,
  setOpenTooltip,
  onNavigate,
}: NavLinkRowProps) {
  const active =
    enabled &&
    (activeOverride !== undefined
      ? activeOverride
      : isHrefActive(href, pathname, match));
  const unavailable = !enabled || href === null;
  const accessibleLabel =
    badge !== undefined ? buildNotificationMenuLabel(badge) : undefined;
  const tooltipOpen = collapsed && openTooltip === tooltipKey;
  const labelClasses = collapsed
    ? "sr-only"
    : "block break-words text-sm leading-tight";
  const itemClasses = [
    "relative flex min-h-11 items-center gap-3 rounded-lg py-2 transition-colors",
    collapsed ? "justify-center px-0" : indent ? "pl-9 pr-3" : "px-3",
    active
      ? "bg-azul-institucional/10 font-semibold text-azul-institucional"
      : "text-texto-principal",
    unavailable ? "cursor-default" : "hover:bg-fondo-app",
    FOCUS_RING_CLASSES,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full border border-transparent bg-azul-institucional"
        />
      )}

      <span className={collapsed ? "relative shrink-0" : "shrink-0"}>
        <Image
          src={getSidebarIconPath(icon)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
        />
        {collapsed && badge !== undefined && badge > 0 ? (
          <NotificationBadge count={badge} collapsed />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className={labelClasses}>{label}</span>

        {unavailable && !collapsed && (
          <span
            aria-hidden="true"
            className="mt-1 block w-fit max-w-full whitespace-normal rounded-full border border-borde-input bg-fondo-app px-2 py-0.5 text-center text-xs font-medium leading-tight text-texto-principal"
          >
            Próximamente
          </span>
        )}
      </span>

      {!collapsed && badge !== undefined && badge > 0 ? (
        <NotificationBadge count={badge} collapsed={false} />
      ) : null}

      {collapsed && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-full top-1/2 z-30 ml-2 max-w-56 -translate-y-1/2 whitespace-normal break-words rounded-md bg-texto-principal px-2 py-1 text-left text-xs font-medium text-superficie transition-opacity motion-reduce:transition-none ${
            tooltipOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          {label}
          {badge !== undefined && badge > 0 ? ` (${badge} sin leer)` : ""}
          {unavailable ? " — Próximamente" : ""}
        </span>
      )}
    </>
  );

  return (
    <li
      onMouseEnter={() => {
        if (collapsed) {
          setOpenTooltip(tooltipKey);
        }
      }}
      onMouseLeave={() => {
        setOpenTooltip(null);
      }}
      onFocus={() => {
        if (collapsed) {
          setOpenTooltip(tooltipKey);
        }
      }}
      onBlur={(event) => {
        const nextFocus =
          event.relatedTarget instanceof Node
            ? event.relatedTarget
            : null;

        if (!event.currentTarget.contains(nextFocus)) {
          setOpenTooltip(null);
        }
      }}
    >
      {href === null || unavailable ? (
        <span
          role="link"
          tabIndex={0}
          aria-disabled="true"
          aria-label={`${label}. No disponible, próximamente.`}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
            }
          }}
          className={itemClasses}
        >
          {content}
        </span>
      ) : (
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={accessibleLabel}
          onClick={() => {
            setOpenTooltip(null);
            onNavigate?.();
          }}
          className={itemClasses}
        >
          {content}
        </Link>
      )}
    </li>
  );
}

interface SectionRowProps {
  section: SidebarNavSection;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  openTooltip: string | null;
  setOpenTooltip: (key: string | null) => void;
}

/** Sección desplegable; en colapso se muestran sus hijos como iconos. */
function SectionRow({
  section,
  pathname,
  collapsed,
  open,
  onToggle,
  onNavigate,
  openTooltip,
  setOpenTooltip,
}: SectionRowProps) {
  const listId = useId();
  const activeChild = getActiveChild(section, pathname);
  const active = activeChild !== null;

  const renderChild = (
    child: SidebarNavSection["children"][number],
    options: { collapsed: boolean; indent: boolean },
  ) => (
    <NavLinkRow
      key={child.label}
      label={child.label}
      icon={child.icon}
      href={child.href}
      enabled={child.enabled}
      match={child.match}
      pathname={pathname}
      activeOverride={activeChild?.href === child.href}
      collapsed={options.collapsed}
      indent={options.indent}
      tooltipKey={`${section.label}-${child.label}-${child.icon}`}
      openTooltip={openTooltip}
      setOpenTooltip={setOpenTooltip}
      onNavigate={onNavigate}
    />
  );

  if (collapsed) {
    return (
      <>
        {section.children.map((child) =>
          renderChild(child, { collapsed: true, indent: false }),
        )}
      </>
    );
  }

  const headerClasses = [
    "relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
    active
      ? "bg-azul-institucional/10 font-semibold text-azul-institucional"
      : "text-texto-principal hover:bg-fondo-app",
    FOCUS_RING_CLASSES,
  ].join(" ");

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className={headerClasses}
      >
        <Image
          src={getSidebarIconPath(section.icon)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
        />
        <span className="min-w-0 flex-1 break-words text-sm leading-tight">
          {section.label}
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {open ? "▾" : "▸"}
        </span>
      </button>

      <ul className="mt-1 space-y-1" id={listId} hidden={!open}>
        {section.children.map((child) =>
          renderChild(child, { collapsed: false, indent: true }),
        )}
      </ul>
    </li>
  );
}

/** Navegación principal con secciones, estado activo y opciones no disponibles. */
export default function SidebarNav({
  items,
  pathname,
  collapsed,
  isSectionOpen,
  onToggleSection,
  onNavigate,
}: SidebarNavProps) {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  return (
    <nav aria-label="Menú principal" className="px-2 py-2">
      <ul className="space-y-1">
        {items.map((item) =>
          isSectionItem(item) ? (
            <SectionRow
              key={item.label}
              section={item}
              pathname={pathname}
              collapsed={collapsed}
              open={isSectionOpen(item.label)}
              onToggle={() => onToggleSection(item.label)}
              onNavigate={onNavigate}
              openTooltip={openTooltip}
              setOpenTooltip={setOpenTooltip}
            />
          ) : (
            <NavLinkRow
              key={`${item.label}-${item.icon}`}
              label={item.label}
              icon={item.icon}
              href={item.href}
              enabled={item.enabled}
              match={item.match}
              pathname={pathname}
              collapsed={collapsed}
              indent={false}
              badge={item.badge}
              tooltipKey={`${item.label}-${item.icon}`}
              openTooltip={openTooltip}
              setOpenTooltip={setOpenTooltip}
              onNavigate={onNavigate}
            />
          ),
        )}
      </ul>
    </nav>
  );
}
