import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function LogoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="16 10 70 79"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="logo-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* The stylized geometric Möbius Ribbon 'A' / Speech bubble */}
      <path
        d="M 25 76 L 50 20 L 75 76 C 80 83, 68 85, 58 78 C 48 70, 48 54, 58 48 C 68 42, 78 48, 78 58 C 78 68, 68 72, 50 72 L 26 72"
        stroke="url(#logo-ribbon-grad)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logo-glow)"
      />

      {/* Center AI processor node */}
      <circle cx="63" cy="60" r="4" fill="#ffffff" filter="url(#logo-glow)" />
    </svg>
  )
}

export function UploadIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="upload-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      {/* File Tray Container */}
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="currentColor" />
      <path d="M4 15h6l1.5 2h5l1.5-2h4" stroke="currentColor" opacity="0.4" />
      
      {/* Floating Data Bits */}
      <circle cx="5" cy="8" r="0.75" fill="#818cf8" />
      <circle cx="19" cy="6" r="1.25" fill="#c084fc" opacity="0.6" />
      <circle cx="18" cy="11" r="0.75" fill="#a78bfa" />

      {/* Rising Upload Arrow */}
      <g className="translate-y-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
        <path d="M12 3v11" stroke="url(#upload-grad)" strokeWidth="2" />
        <path d="m17 8-5-5-5 5" stroke="url(#upload-grad)" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function MonitorOverlayIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="monitor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Monitor Stand */}
      <path d="M8 21h8" stroke="currentColor" />
      <path d="M12 17v4" stroke="currentColor" />
      
      {/* Base Monitor Frame */}
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" />
      
      {/* Overlay Pane (Perspective offset) */}
      <g className="translate-x-0 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300">
        <rect
          x="11"
          y="6"
          width="9"
          height="8"
          rx="1"
          fill="#09090b"
          stroke="url(#monitor-grad)"
          strokeWidth="1.5"
          className="shadow-lg shadow-blue-500/10"
        />
        {/* Hologram details */}
        <line x1="13" y1="9" x2="18" y2="9" stroke="url(#monitor-grad)" strokeWidth="1" />
        <line x1="13" y1="11" x2="16" y2="11" stroke="url(#monitor-grad)" strokeWidth="1" />
      </g>

      {/* Screen grid lines in background */}
      <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" opacity="0.3" />
      <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" opacity="0.3" />
      <line x1="4" y1="10" x2="9" y2="10" stroke="currentColor" opacity="0.3" />
    </svg>
  )
}

export function AudioPulseIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="audio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      
      {/* Concentric Audio Pulse Rings */}
      <circle cx="12" cy="12" r="9" stroke="url(#audio-grad)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
      <circle
        cx="12"
        cy="12"
        r="6"
        stroke="url(#audio-grad)"
        strokeWidth="1"
        className="animate-pulse"
        style={{ animationDuration: '2.5s' }}
      />
      <circle cx="12" cy="12" r="3" stroke="url(#audio-grad)" strokeWidth="1.5" />
      
      {/* Wave Indicators */}
      <path d="M12 9v-3" stroke="url(#audio-grad)" strokeWidth="1.5" />
      <path d="M12 18v-3" stroke="url(#audio-grad)" strokeWidth="1.5" />
      <path d="M9 12H6" stroke="url(#audio-grad)" strokeWidth="1.5" />
      <path d="M18 12h-3" stroke="url(#audio-grad)" strokeWidth="1.5" />
      
      {/* Core glowing dot */}
      <circle cx="12" cy="12" r="1" fill="#22d3ee" />
    </svg>
  )
}

export function SparkleSolutionsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      {/* Main Sparkle */}
      <path
        d="M12 3c0 4.5 1.5 6 6 6-4.5 0-6 1.5-6 6 0-4.5-1.5-6-6-6 4.5 0 6-1.5 6-6z"
        fill="url(#sparkle-grad)"
        stroke="url(#sparkle-grad)"
        strokeWidth="0.5"
        className="group-hover:scale-110 origin-center transition-transform duration-300"
      />

      {/* Side Sparkles */}
      <g className="translate-y-[-1px] group-hover:translate-x-0.5 transition-transform duration-300">
        <path
          d="M19 15c0 2 0.7 2.7 2.7 2.7-2 0-2.7 0.7-2.7 2.7 0-2-0.7-2.7-2.7-2.7 2 0 2.7-0.7 2.7-2.7z"
          fill="#34d399"
          opacity="0.8"
        />
      </g>
      
      <g className="translate-x-[-1px] group-hover:-translate-y-0.5 transition-transform duration-300">
        <path
          d="M6 7c0 1.2 0.4 1.6 1.6 1.6-1.2 0-1.6 0.4-1.6 1.6 0-1.2-0.4-1.6-1.6-1.6 1.2 0 1.6-0.4 1.6-1.6z"
          fill="#6ee7b7"
          opacity="0.6"
        />
      </g>
      
      {/* Orbit light arc */}
      <path d="M3 17a9 9 0 0 1 6-7.5" stroke="#a7f3d0" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  )
}

export function MicTranscriptionIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="mic-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      
      {/* Mic Capsule */}
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="url(#mic-grad)" strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="10" stroke="#ffffff" strokeWidth="1" />
      
      {/* Mic stand holder */}
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" />
      
      {/* Soundwave bars on the sides */}
      <line x1="2" y1="10" x2="2" y2="14" stroke="#818cf8" strokeWidth="2" className="animate-pulse" style={{ animationDuration: '1s' }} />
      <line x1="22" y1="9" x2="22" y2="15" stroke="#a78bfa" strokeWidth="2" className="animate-pulse" style={{ animationDuration: '1.2s' }} />
    </svg>
  )
}

export function ShieldInvisibleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      
      {/* Layered Shield Outline */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shield-grad)" strokeWidth="2" />
      
      {/* Invisibility Slit (diagonal refraction) */}
      <path
        d="M6 13h12"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="3 1"
        className="translate-y-[-1px] group-hover:translate-y-[1px] transition-transform duration-500"
      />
      <path
        d="M8 9h8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2 2"
        className="translate-y-[1px] group-hover:translate-y-[-1px] transition-transform duration-500"
      />
      
      {/* Central eye or radar vector */}
      <circle cx="12" cy="11" r="2" stroke="url(#shield-grad)" strokeWidth="1.5" fill="#09090b" />
      <circle cx="12" cy="11" r="0.75" fill="#a78bfa" />
    </svg>
  )
}

export function CodeDsaIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="code-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      
      {/* HTML / DSA brackets */}
      <polyline points="7 8 3 12 7 16" stroke="url(#code-grad)" strokeWidth="2" />
      <polyline points="17 8 21 12 17 16" stroke="url(#code-grad)" strokeWidth="2" />
      
      {/* Central Slash line (glowing code pointer) */}
      <line
        x1="14"
        y1="4"
        x2="10"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        className="group-hover:rotate-6 origin-center transition-transform duration-300"
      />

      {/* Small floating variables/dots */}
      <rect x="4" y="4" width="2" height="2" rx="0.5" fill="#22d3ee" opacity="0.6" />
      <rect x="18" y="20" width="2" height="2" rx="0.5" fill="#0d9488" opacity="0.8" />
    </svg>
  )
}
