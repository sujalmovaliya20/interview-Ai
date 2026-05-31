'use client'

interface AudioLevelMeterProps {
  level: number // 0 to 100
  isRecording: boolean
  isPaused: boolean
}

export function AudioLevelMeter({ level, isRecording, isPaused }: AudioLevelMeterProps) {
  // We use 20 bars
  const BARS = 20

  return (
    <div 
      className="flex items-end h-6 gap-[2px] px-2"
      role="meter"
      aria-label="Audio level meter"
      aria-valuenow={level}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: BARS }).map((_, i) => {
        // Base height calculation depending on the level to create a realistic spectrum effect
        let heightPercent = 10
        let colorClass = 'bg-muted'
        
        if (isRecording && !isPaused) {
          // Add some randomization to individual bars based on the general level
          // A bit of sine wave logic for spectrum-like shape
          const factor = Math.sin((i / BARS) * Math.PI) 
          const targetLevel = level * factor
          
          heightPercent = Math.max(10, targetLevel)
          
          if (level > 20) {
            colorClass = 'bg-green-500'
          } else if (level > 5) {
            colorClass = 'bg-amber-500'
          } else {
            colorClass = 'bg-muted-foreground/30'
          }
        } else {
          // Reset to default flat gray state if paused or stopped
          heightPercent = 15
        }

        return (
          <div
            key={i}
            className={`w-1 rounded-sm transition-all duration-100 ${colorClass}`}
            style={{ height: `${heightPercent}%` }}
          />
        )
      })}
    </div>
  )
}
