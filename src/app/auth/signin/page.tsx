import { SignInForm } from '@/components/auth/SignInForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string }>
}) {
  const isDesktop = (await searchParams).desktop === 'true'

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">InterviewAI</h1>
        </div>
        <SignInForm isDesktop={isDesktop} />
      </div>
    </div>
  )
}
