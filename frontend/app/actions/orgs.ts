'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name') as string
  
  if (!name) {
    redirect('/organization/create?error=Name_required')
  }
  
  // Generate a basic slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Call the secure RPC function to create org and assign admin
  const { error } = await supabase.rpc('create_organization', {
    org_name: name,
    org_slug: slug,
  })

  if (error) {
    redirect('/organization/create?error=Failed_to_create')
  }

  redirect('/dashboard')
}
