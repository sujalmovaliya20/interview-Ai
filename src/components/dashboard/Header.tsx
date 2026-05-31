export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6">
      <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
    </header>
  )
}
