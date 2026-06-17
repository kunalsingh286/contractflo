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
