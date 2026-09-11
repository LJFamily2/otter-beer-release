/**
 * Generic stroke icons shared by the reusable UI kit (src/components/ui/*).
 * Plain geometric shapes, not sourced from any design file — mirrors the
 * same convention used by src/components/admin/icons.tsx.
 */
import type { SVGProps } from "react";

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M16.5 16.5l-3.6-3.6" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 7.5l5 5 5-5" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12.5 4.5l-5 5.5 5 5.5" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7.5 4.5l5 5.5-5 5.5" />
    </IconBase>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 5l10 10M15 5L5 15" />
    </IconBase>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M7 10.2l2 2 4-4.4" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3.3l8 14H2l8-14z" strokeLinejoin="round" />
      <path d="M10 8.3v3.4" />
      <circle cx="10" cy="14.4" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.5v4.2" />
      <circle cx="10" cy="13.4" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function InfoCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9.3v4.2" />
      <circle cx="10" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 2.5l6.5 2.4v4.6c0 4-2.7 7.2-6.5 8-3.8-.8-6.5-4-6.5-8V4.9L10 2.5z" strokeLinejoin="round" />
      <path d="M7.2 10l2 2 3.6-4" />
    </IconBase>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M3.5 17c1-3.3 3.8-5 6.5-5s5.5 1.7 6.5 5" />
    </IconBase>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.1 5.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 5.1l-1.4 1.4M6.5 13.5l-1.4 1.4" />
    </IconBase>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8" />
      <path d="M13 13.5L17 10l-4-3.5" />
      <path d="M17 10H8" />
    </IconBase>
  );
}

export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 4h1.7l1.6 9.3a1.5 1.5 0 001.5 1.2h6a1.5 1.5 0 001.5-1.2l1.2-6.3H5.4" />
      <circle cx="8.3" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="17" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </IconBase>
  );
}

export function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="4.5" y="3.5" width="11" height="14" rx="1.3" />
      <path d="M7.5 3.5h5v2h-5z" />
      <path d="M7 9h6M7 12h6M7 15h3" />
    </IconBase>
  );
}

export function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3l7 3.6v6.8L10 17l-7-3.6V6.6L10 3z" strokeLinejoin="round" />
      <path d="M3 6.6l7 3.6 7-3.6M10 10.2V17" />
    </IconBase>
  );
}

export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 16.5V11M10 16.5V4M16 16.5v-7.5" />
    </IconBase>
  );
}
