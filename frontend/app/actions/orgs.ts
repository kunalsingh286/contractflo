'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name') as string
  
  if (!name) {
    return { error: 'Organization name is required' }
  }
  
  // Generate a basic slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Call the secure RPC function to create org and assign admin
  const { data, error } = await supabase.rpc('create_organization', {
    org_name: name,
    org_slug: slug,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
