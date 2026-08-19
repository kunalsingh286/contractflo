import { API_BASE_URL } from "@/lib/constants";
import type { HealthStatus } from "@/types";

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json() as Promise<HealthStatus>;
}

import { createClient } from '@/lib/supabase/client'

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(options.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const basePath = endpoint.startsWith('/api/v1') ? '' : '/api/v1'
  const response = await fetch(`${API_BASE_URL}${basePath}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
