import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

export function PricingSection() {
  return (
    <div id="pricing" className="bg-muted/40 py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
        <p className="text-muted-foreground mb-16 max-w-xl mx-auto">
          Start for free, then upgrade when you land your dream interviews.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          {/* Free Tier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Starter</CardTitle>
              <CardDescription>To try out the platform</CardDescription>
              <div className="mt-4 text-4xl font-bold">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> 10 free credits</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Basic transcription</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Standard AI models</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button nativeButton={false} className="w-full" variant="outline" render={<Link href="/auth/signin" />}>Get Started</Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="border-primary shadow-lg relative">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro Candidate</CardTitle>
              <CardDescription>Everything you need to ace it</CardDescription>
              <div className="mt-4 text-4xl font-bold">$49<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Unlimited interview sessions</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Ultra-low latency models</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Invisible floating overlay</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Upload up to 10 resumes</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button nativeButton={false} className="w-full" render={<Link href="/auth/signin" />}>Start Free Trial</Button>
            </CardFooter>
          </Card>

          {/* Elite Tier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Elite</CardTitle>
              <CardDescription>For serious job seekers</CardDescription>
              <div className="mt-4 text-4xl font-bold">$99<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Everything in Pro</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Access to GPT-5 & Claude 3.5 Opus</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /> Priority support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button nativeButton={false} className="w-full" variant="outline" render={<Link href="/auth/signin" />}>Get Started</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
