interface LogoProps {
  className?: string;
  tone?: "dark" | "light";
}

export default function Logo({ className = "", tone = "dark" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`logo-${tone}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B4DDB" />
            <stop offset="1" stopColor="#0FA89C" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#logo-${tone})`} />
        <path
          d="M9 11.5h8.5M9 16h14M9 20.5h6.5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`text-lg font-extrabold tracking-tight ${tone === "light" ? "text-white" : "text-ink"}`}
      >
        TaskFlow
      </span>
    </span>
  );
}
