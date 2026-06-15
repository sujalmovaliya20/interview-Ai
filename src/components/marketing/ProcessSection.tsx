import { UploadIcon, MonitorOverlayIcon, AudioPulseIcon, SparkleSolutionsIcon } from '@/components/marketing/CustomIcons'

export function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Configure & Upload',
      description: 'Upload your resumes and add target job descriptions. Customize the AI persona (e.g., Tech Lead, System Architect, or behavioral specialist) to fit the specific role.',
      icon: UploadIcon,
      color: 'from-violet-500/20 to-purple-500/5',
      iconColor: 'text-violet-400',
      borderColor: 'group-hover:border-violet-500/30',
      glowColor: 'group-hover:shadow-violet-500/5',
    },
    {
      number: '02',
      title: 'Launch Desktop Overlay',
      description: 'Start our secure, lightweight desktop companion app. It floats as an undetectable translucent window just beneath your webcam, ensuring you maintain direct eye contact.',
      icon: MonitorOverlayIcon,
      color: 'from-indigo-500/20 to-blue-500/5',
      iconColor: 'text-indigo-400',
      borderColor: 'group-hover:border-indigo-500/30',
      glowColor: 'group-hover:shadow-indigo-500/5',
    },
    {
      number: '03',
      title: 'Real-Time Audio Capture',
      description: 'The overlay automatically captures and transcribes incoming question audio from the interviewer (system audio) and your response (microphone) with sub-second latency.',
      icon: AudioPulseIcon,
      color: 'from-cyan-500/20 to-teal-500/5',
      iconColor: 'text-cyan-400',
      borderColor: 'group-hover:border-cyan-500/30',
      glowColor: 'group-hover:shadow-cyan-500/5',
    },
    {
      number: '04',
      title: 'Receive Instant Solutions',
      description: 'As they speak, the AI generates talking points, code snippets, and custom hints optimized against your background, appearing progressively on your overlay.',
      icon: SparkleSolutionsIcon,
      color: 'from-emerald-500/20 to-green-500/5',
      iconColor: 'text-emerald-400',
      borderColor: 'group-hover:border-emerald-500/30',
      glowColor: 'group-hover:shadow-emerald-500/5',
    },
  ]

  return (
    <section id="process" className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[#030303]">
      
      {/* Background glow orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[45rem] w-[45rem] rounded-full bg-radial-gradient from-violet-600/5 to-transparent blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-semibold text-violet-400">
            ⚡ Workflow Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            How InterviewAI Works
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg md:text-xl leading-relaxed px-2 sm:px-0">
            From session preparation to live answers, our seamless automated pipeline gets you prepared for success.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 md:p-8 hover:bg-zinc-950/80 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                style={{
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* Glow effect back drop */}
                <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-600/5 via-transparent to-transparent" />
                
                <div>
                  {/* Icon & Step Number */}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${step.color} border border-zinc-800/80 flex items-center justify-center`}>
                      <IconComponent className={`h-6 w-6 ${step.iconColor}`} />
                    </div>
                    <span className="text-4xl font-extrabold text-zinc-800 font-mono group-hover:text-violet-500/20 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom line decorator */}
                <div className="mt-8 h-[2px] w-12 bg-zinc-800 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-indigo-500 transition-all duration-300" />
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
