interface EmptyStateIllustrationProps {
  type: "calculator" | "feed" | "analytics" | "default"
  className?: string
}

export function EmptyStateIllustration({ type, className = "" }: EmptyStateIllustrationProps) {
  const baseClasses = "w-48 h-48 mx-auto mb-4"

  switch (type) {
    case "calculator":
      return (
        <svg
          className={`${baseClasses} ${className}`}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Calculator illustration"
        >
          <rect x="50" y="40" width="100" height="120" rx="8" fill="#E5E7EB" />
          <rect x="60" y="50" width="80" height="30" rx="4" fill="#F3F4F6" />
          <circle cx="75" cy="100" r="10" fill="#9CA3AF" />
          <circle cx="100" cy="100" r="10" fill="#9CA3AF" />
          <circle cx="125" cy="100" r="10" fill="#9CA3AF" />
          <circle cx="75" cy="125" r="10" fill="#9CA3AF" />
          <circle cx="100" cy="125" r="10" fill="#9CA3AF" />
          <circle cx="125" cy="125" r="10" fill="#9CA3AF" />
          <path d="M90 65L110 65" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )

    case "feed":
      return (
        <svg
          className={`${baseClasses} ${className}`}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Feed illustration"
        >
          <rect x="40" y="50" width="120" height="20" rx="4" fill="#E5E7EB" />
          <rect x="40" y="80" width="100" height="10" rx="2" fill="#F3F4F6" />
          <rect x="40" y="100" width="120" height="20" rx="4" fill="#E5E7EB" />
          <rect x="40" y="130" width="100" height="10" rx="2" fill="#F3F4F6" />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <path
            d="M100 70V100L120 120"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case "analytics":
      return (
        <svg
          className={`${baseClasses} ${className}`}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Analytics illustration"
        >
          <rect x="40" y="120" width="20" height="40" rx="2" fill="#E5E7EB" />
          <rect x="70" y="100" width="20" height="60" rx="2" fill="#D1D5DB" />
          <rect x="100" y="80" width="20" height="80" rx="2" fill="#E5E7EB" />
          <rect x="130" y="90" width="20" height="70" rx="2" fill="#D1D5DB" />
          <path d="M30 170H170" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M50 60L80 80L110 50L140 70"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 3"
          />
        </svg>
      )

    default:
      return (
        <svg
          className={`${baseClasses} ${className}`}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Empty state illustration"
        >
          <rect
            x="50"
            y="50"
            width="100"
            height="100"
            rx="8"
            fill="#E5E7EB"
            strokeDasharray="5 5"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <circle cx="100" cy="100" r="30" fill="#F3F4F6" />
          <path d="M100 85V95M100 110V115" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="105" r="3" fill="#9CA3AF" />
        </svg>
      )
  }
}
