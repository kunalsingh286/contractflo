'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Missing_credentials')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Invalid_credentials')
  }

  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || !name) {
    redirect('/signup?error=Missing_credentials')
  }

  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  })

  if (error) {
    console.error("Supabase Auth Error:", error)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  // If email confirmation is off, we are logged in. Let's auto-create an organization.
  if (data.session || data.user) {
    // Generate a random slug
    const orgSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 10000);
    const rpcRes = await supabase.rpc('create_organization', { org_name: `${name}'s Company`, org_slug: orgSlug });
    if (rpcRes.error) {
      console.error("Failed to create org:", rpcRes.error);
    }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
