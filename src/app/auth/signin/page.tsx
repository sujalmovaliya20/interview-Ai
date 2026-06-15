import { SignInForm } from '@/components/auth/SignInForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string }>
}) {
  const isDesktop = (await searchParams).desktop === 'true'

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-[#09090b]">
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/5 blur-[100px] pointer-events-none" />

      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <SignInForm isDesktop={isDesktop} />
      </div>
    </div>
  )
}
