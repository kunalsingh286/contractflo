/** Shared TypeScript types for the ContractFlo frontend. */

export type HealthStatus = {
  status: string;
  service: string;
  version: string;
};

export type ApiError = {
  detail: string;
};
