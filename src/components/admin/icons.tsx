/**
 * Small generic stroke icons for the admin UI — plain geometric shapes, not
 * sourced from any design file, so no vector-fidelity concerns.
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

export function NewsBlogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="2.5" width="14" height="15" rx="1.5" />
      <path d="M6.5 6.5h7M6.5 10h7M6.5 13.5h4" />
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

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 4v12M4 10h12" />
    </IconBase>
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

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12.5 3.5l4 4L6 18H2v-4l10.5-10.5z" />
    </IconBase>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 5.5h14M8 5.5V3.8c0-.7.6-1.3 1.3-1.3h1.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="M5.5 5.5V16a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V5.5" />
      <path d="M8.3 9v5M11.7 9v5" />
    </IconBase>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="7.2" cy="6.5" r="2.8" />
      <path d="M2.2 16.5c.7-3 2.5-4.5 5-4.5s4.3 1.5 5 4.5" />
      <path d="M12.8 4.3a2.8 2.8 0 010 4.4" />
      <path d="M14.5 12.3c2 .4 3.2 1.8 3.8 4.2" />
    </IconBase>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 2.5l6.5 2.4v4.6c0 4-2.7 7.2-6.5 8-3.8-.8-6.5-4-6.5-8V4.9L10 2.5z" strokeLinejoin="round" />
      <path d="M7.2 10l2 2 3.6-4" />
    </IconBase>
  );
}

export function BrandStoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 5.2C8.3 4 6 3.5 3.5 3.5v11.8c2.5 0 4.8.5 6.5 1.7" />
      <path d="M10 5.2c1.7-1.2 4-1.7 6.5-1.7v11.8c-2.5 0-4.8.5-6.5 1.7" />
      <path d="M10 5.2V17" />
    </IconBase>
  );
}

export function BeerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="6" width="9.5" height="11.5" rx="1.2" />
      <path d="M13 8.7h1.8a1.7 1.7 0 011.7 1.7v2a1.7 1.7 0 01-1.7 1.7H13" />
      <path d="M3.5 9.7h9.5" />
    </IconBase>
  );
}

export function HeroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="1.5" y="4" width="17" height="12" rx="1.5" />
      <path d="M1.5 13l4.5-4 3.5 3L13 8l5.5 5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="8" r="1.2" />
    </svg>
  );
}
