import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Activity, LogOut } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('role, organizations(name)')
    .eq('user_id', user.id)
    .single()

  if (!memberData) {
    redirect('/organization/create')
  }

  const orgName = (memberData.organizations as { name: string }).name
  const role = memberData.role

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{orgName}</h1>
          <p className="text-sm text-neutral-400">{user.email} &bull; <span className="capitalize">{role}</span></p>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit" className="text-neutral-400 hover:text-white hover:bg-neutral-800">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">Total Contracts</CardTitle>
              <FileText className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">142</div>
              <p className="text-xs text-neutral-500 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">Recent Activity</CardTitle>
              <Activity className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-neutral-500 mt-1">Pending reviews</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
