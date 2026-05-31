import { Header } from '@/components/dashboard/Header'

export default function SessionsPage() {
  return (
    <>
      <Header title="Sessions History" />
      <div className="p-6">
        <p className="text-muted-foreground">List of all historical sessions will appear here.</p>
      </div>
    </>
  )
}
