import { Button } from '@/components/ui/button'
import { Check, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '',
      description: 'Perfect for trying out the platform features.',
      features: [
        '10 free credits upon signup',
        'Basic live audio transcription',
        'Standard response generation models',
        'Upload 1 resume & job profile',
      ],
      cta: 'Get Started',
      href: '/auth/signin',
      variant: 'outline' as const,
      popular: false,
    },
    {
      name: 'Pro Candidate',
      price: '$49',
      period: '/mo',
      description: 'Everything you need to ace your upcoming interviews.',
      features: [
        'Unlimited live interview sessions',
        'Ultra-low latency models (GPT-4o / Claude 3.5)',
        'Real-time conceptual assistant feedback',
        'Upload up to 10 resumes & job profiles',
        'Advanced system design & coding hints',
        'Priority API queues',
      ],
      cta: 'Start Pro Trial',
      href: '/auth/signin',
      variant: 'default' as const,
      popular: true,
    },
    {
      name: 'Elite',
      price: '$99',
      period: '/mo',
      description: 'For candidates aiming for top-tier staff & FAANG roles.',
      features: [
        'Everything in Pro Candidate',
        'Access to custom-fine-tuned Llama-3 models',
        '1-on-1 technical resume audit (monthly)',
        'Dedicated server instance with sub-300ms latency',
        '24/7 priority developer support',
      ],
      cta: 'Go Elite',
      href: '/auth/signin',
      variant: 'outline' as const,
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[#030303] border-t border-zinc-900">
      
      {/* Glow backgrounds */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[35rem] w-[45rem] rounded-full bg-radial-gradient from-violet-600/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[30rem] w-[40rem] rounded-full bg-radial-gradient from-indigo-600/5 to-transparent blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-semibold text-violet-400">
            💎 Plans & Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg md:text-xl leading-relaxed px-2 sm:px-0">
            Choose the perfect plan to boost your confidence and land your dream job offer.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col justify-between rounded-2xl border bg-zinc-950/40 p-6 sm:p-8 backdrop-blur-md hover:bg-zinc-950/80 transition-all duration-300 ${
                plan.popular
                  ? 'border-violet-500/50 shadow-[0_0_30px_-5px_rgba(139,92,246,0.25)] ring-1 ring-violet-500/30 md:-translate-y-2'
                  : 'border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md shadow-violet-500/20">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Top Section */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-xs leading-normal min-h-[32px] mb-6">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline mb-6 border-b border-zinc-900 pb-6">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-semibold text-zinc-500 ml-1">
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8 text-sm">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start text-zinc-300">
                      <div className="h-5 w-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                <Button
                  nativeButton={false}
                  variant={plan.variant}
                  className={`w-full rounded-xl font-semibold transition-all h-11 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/15'
                      : 'border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                  render={<Link href={plan.href} />}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs prompt */}
        <div className="mt-16 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-violet-500/60" />
          <span>Have questions about custom features or team licensing? <a href="mailto:support@interviewai.com" className="text-violet-400 hover:underline">Contact our sales team</a>.</span>
        </div>

      </div>
    </section>
  )
}
