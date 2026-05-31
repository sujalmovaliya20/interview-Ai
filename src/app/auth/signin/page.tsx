import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">InterviewAI</h1>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
