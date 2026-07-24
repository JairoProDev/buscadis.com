'use client';

/** Icono Envíos: moto + caja (header CTA) */
export default function IconEnvios({
  size = 18,
  color = 'currentColor',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M5 17a2 2 0 1 0 0.001 0.001"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M16.5 17a2.5 2.5 0 1 0 0.001 0.001"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 17h7.5M5 17H3.5V12.5L5.5 9h4l1.5 3H14l2.5 3.5H17"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 9V7.5A1.5 1.5 0 0 1 12.5 6H15a1 1 0 0 1 1 1v2"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* caja detrás */}
      <rect
        x="15.5"
        y="3.5"
        width="5"
        height="4.5"
        rx="0.75"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M18 3.5v4.5M15.5 5.75h5" stroke={color} strokeWidth="1.25" />
    </svg>
  );
}
