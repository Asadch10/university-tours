import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardCheck,
  ListChecks,
  Percent,
  Receipt,
  RotateCcw,
  Users,
  Store,
  CalendarClock,
  Star,
  GraduationCap,
  LayoutTemplate,
  SlidersHorizontal,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import type { Permission } from './rbac';

export interface NavItem {
  /** Route segment under /(console) */
  href: string;
  label: string;
  icon: LucideIcon;
  /** Module is visible if the role has ANY of these. Empty = always visible. */
  permissions: Permission[];
  /** Short description for command palette / cards. */
  desc: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * The fifteen functional modules (Part II §5), grouped for the sidebar.
 * Each module's `permissions` drives navigation gating; pages re-check on mount.
 */
export const NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permissions: ['dashboard.view'],
        desc: 'Revenue, commission, bookings, pending queues, top universities & guides',
      },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      {
        href: '/applications',
        label: 'Applications',
        icon: ClipboardCheck,
        permissions: ['applications.decide'],
        desc: 'Approve / reject / request-changes; document & answer viewer',
      },
      {
        href: '/questionnaire',
        label: 'Questionnaire',
        icon: ListChecks,
        permissions: ['questionnaires.manage'],
        desc: 'Build & publish questionnaire versions; no code',
      },
      {
        href: '/universities',
        label: 'Universities',
        icon: GraduationCap,
        permissions: ['universities.manage'],
        desc: 'Add/edit, logo, location, SEO content, enable/disable',
      },
      {
        href: '/listings',
        label: 'Listings',
        icon: Store,
        permissions: ['listings.moderate'],
        desc: 'Moderate / edit / disable listings',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        href: '/bookings',
        label: 'Bookings',
        icon: CalendarClock,
        permissions: ['bookings.view'],
        desc: 'View, filter by state, force-cancel',
      },
      {
        href: '/users',
        label: 'Users',
        icon: Users,
        permissions: ['users.manage'],
        desc: 'Search, view, suspend/ban, reset password',
      },
      {
        href: '/reviews',
        label: 'Reviews',
        icon: Star,
        permissions: ['reviews.moderate'],
        desc: 'Hide / moderate reviews',
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        href: '/transactions',
        label: 'Transactions & Payouts',
        icon: Receipt,
        permissions: ['transactions.view'],
        desc: 'Ledger, per-guide balance, record manual payout, CSV',
      },
      {
        href: '/refunds',
        label: 'Refunds',
        icon: RotateCcw,
        permissions: ['refunds.issue'],
        desc: 'Full/partial refund via Stripe; ledger auto-adjust',
      },
      {
        href: '/commission',
        label: 'Commission',
        icon: Percent,
        permissions: ['commission.set'],
        desc: 'Set the single global commission %',
      },
    ],
  },
  {
    title: 'Content & Platform',
    items: [
      {
        href: '/cms',
        label: 'CMS',
        icon: LayoutTemplate,
        permissions: ['cms.edit'],
        desc: 'Homepage, FAQs, pages, testimonials — served to web & mobile',
      },
      {
        href: '/templates',
        label: 'Notification Templates',
        icon: Mail,
        permissions: ['templates.edit'],
        desc: 'Edit email + push templates',
      },
      {
        href: '/app-config',
        label: 'App Configuration',
        icon: SlidersHorizontal,
        permissions: ['appconfig.manage'],
        desc: 'Feature flags, min version + force-update, maintenance, push',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        href: '/roles',
        label: 'Roles & Audit',
        icon: ShieldCheck,
        permissions: ['admins.manage', 'audit.view'],
        desc: 'Manage admin accounts/roles; immutable audit log',
      },
    ],
  },
];

/** Flat list of all nav items (for route-guard lookup & command palette). */
export const ALL_NAV_ITEMS: NavItem[] = NAV.flatMap((s) => s.items);

/** Find the nav item that owns a given pathname. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
}
