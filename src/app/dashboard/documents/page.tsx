import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentsManager } from '@/components/documents/DocumentsManager'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch initial documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
      <DocumentsManager initialDocuments={documents || []} userId={user.id} />
    </div>
  )
}
