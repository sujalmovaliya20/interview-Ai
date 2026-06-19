'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { FileText, Plus, Brain, Sparkles, X, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourStep {
  targetId: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-my-resume',
    title: '1. My Resume',
    description: 'Upload your resume first. The AI Coach will parse your projects and tech stack to generate personalized interview questions matching your background.',
    icon: FileText,
  },
  {
    targetId: 'tour-new-interview',
    title: '2. New Interview',
    description: 'Start a live mock interview with real-time Speech-to-Text. Speak your answers naturally and receive instant metrics and delivery analysis.',
    icon: Plus,
  },
  {
    targetId: 'tour-mock-interview',
    title: '3. Mock Interview',
    description: 'Practice specific, structured sessions (behavioral, technical, or rapid-fire) tailored dynamically to address your tracked weaknesses.',
    icon: Brain,
  },
]

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [elementRect, setElementRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Check if target element is visible on viewport
  const checkVisibility = useCallback((el: HTMLElement | null) => {
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0
  }, [])

  // Recalculate target position
  const updatePosition = useCallback(() => {
    if (!isOpen) return

    const step = TOUR_STEPS[currentStep]
    const el = document.getElementById(step.targetId)
    
    if (el && checkVisibility(el)) {
      setElementRect(el.getBoundingClientRect())
      setIsMobile(false)
    } else {
      setElementRect(null)
      setIsMobile(true)
    }
  }, [isOpen, currentStep, checkVisibility])

  // Initialize and check localStorage
  useEffect(() => {
    const isCompleted = localStorage.getItem('interview_tour_completed')
    if (!isCompleted) {
      // Small timeout to allow DOM layout to settle before calculating bounding boxes
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Position listeners
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, currentStep, updatePosition])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('interview_tour_completed', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const stepInfo = TOUR_STEPS[currentStep]
  const Icon = stepInfo.icon

  // Calculate tooltip placement styles
  let tooltipStyle: React.CSSProperties = {}
  if (elementRect && !isMobile) {
    const spaceToRight = window.innerWidth - elementRect.right
    // If there is enough room on the right, place it to the right of the element
    if (spaceToRight > 320) {
      tooltipStyle = {
        position: 'fixed',
        left: `${elementRect.right + 16}px`,
        top: `${Math.max(16, elementRect.top + (elementRect.height / 2) - 100)}px`,
        width: '320px',
      }
    } else {
      // Otherwise, position below it
      tooltipStyle = {
        position: 'fixed',
        left: `${Math.max(16, elementRect.left + (elementRect.width / 2) - 160)}px`,
        top: `${elementRect.bottom + 16}px`,
        width: '320px',
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-none">
      {/* ── SPOTLIGHT OVERLAYS ── */}
      {elementRect && !isMobile && (
        <div className="absolute inset-0 pointer-events-auto">
          {/* Top segment overlay */}
          <div 
            className="absolute bg-black/60 backdrop-blur-[1px] transition-all duration-300 left-0 right-0 top-0" 
            style={{ height: `${elementRect.top}px` }} 
          />
          {/* Bottom segment overlay */}
          <div 
            className="absolute bg-black/60 backdrop-blur-[1px] transition-all duration-300 left-0 right-0 bottom-0" 
            style={{ top: `${elementRect.bottom}px` }} 
          />
          {/* Left segment overlay */}
          <div 
            className="absolute bg-black/60 backdrop-blur-[1px] transition-all duration-300 left-0" 
            style={{ 
              top: `${elementRect.top}px`, 
              height: `${elementRect.height}px`,
              width: `${elementRect.left}px` 
            }} 
          />
          {/* Right segment overlay */}
          <div 
            className="absolute bg-black/60 backdrop-blur-[1px] transition-all duration-300 right-0" 
            style={{ 
              top: `${elementRect.top}px`, 
              height: `${elementRect.height}px`,
              left: `${elementRect.right}px` 
            }} 
          />

          {/* Spotlight Active Border Box */}
          <div 
            className="absolute border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.6)] rounded-xl transition-all duration-300 pointer-events-none animate-pulse"
            style={{
              top: `${elementRect.top - 4}px`,
              left: `${elementRect.left - 4}px`,
              width: `${elementRect.width + 8}px`,
              height: `${elementRect.height + 8}px`
            }}
          />
        </div>
      )}

      {/* Full screen backdrop for mobile fallback */}
      {(isMobile || !elementRect) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" />
      )}

      {/* ── TOOLTIP CONTAINER ── */}
      <div 
        ref={tooltipRef}
        style={!isMobile && elementRect ? tooltipStyle : undefined}
        className={`pointer-events-auto z-50 transition-all duration-300 ${
          isMobile || !elementRect
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm'
            : ''
        }`}
      >
        <div className="glass-card p-6 border-violet-500/25 shadow-2xl relative space-y-4 animate-scale-in">
          {/* Tour Progress Dots */}
          <div className="flex items-center justify-between pb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
              <Sparkles className="h-3 w-3 animate-pulse" /> Quick Tour
            </span>
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    idx === currentStep ? 'bg-violet-500 w-3' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tour Close/Skip Button */}
          <button 
            onClick={handleComplete} 
            className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-foreground text-sm tracking-tight">{stepInfo.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{stepInfo.description}</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
            <button 
              onClick={handleComplete} 
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Skip Tour
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs font-semibold border-border hover:bg-accent cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              <Button 
                onClick={handleNext}
                size="sm"
                className="h-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-500/10 hover:shadow-lg cursor-pointer"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Got it <ArrowRight className="h-3 w-3 ml-1" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4 ml-0.5" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
