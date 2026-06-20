'use client'

export function OverlaySimulator() {
  return (
    <div className="relative mx-auto max-w-4xl w-full rounded-2xl border border-zinc-800 bg-[#070709] p-1.5 sm:p-2.5 shadow-2xl shadow-violet-500/5 overflow-hidden">

      {/* Top OS-Style Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-950/80 rounded-t-xl select-none">
        <div className="flex space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] block"></span>
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] block"></span>
          <span className="w-3 h-3 rounded-full bg-[#27c93f] block"></span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
          {/* Shield lock icon */}
          <svg className="h-3 w-3 text-violet-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">secure-overlay-session.local</span>
          <span className="sm:hidden">overlay.local</span>
        </div>
        <div className="h-4 w-4" />
      </div>

      {/* Full Video Frame Canvas */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60 rounded-b-xl">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/overlay-video.mp4" type="video/mp4" />
        </video>
      </div>

    </div>
  )
}
