export const STEPS = [
  'spec_parsed',
  'db_created',
  'auth_created',
  'storage_created',
  'migration_done',
  'functions_deployed',
  'code_generated',
  'app_deployed',
] as const;

export type AgentEventStep = typeof STEPS[number] | 'error';

export interface AgentEvent {
  step: AgentEventStep;
  message: string;
  data?: Record<string, unknown>;
  ts: number;
}

export interface SaaSSpec {
  name: string;
  template: 'taskboard' | 'crm' | 'saas-starter';
  entities: string[];
  features: string[];
}

export interface BuildState {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  events: AgentEvent[];
  spec?: SaaSSpec;
  deployedUrl?: string;
  qrCodeDataUrl?: string;
  error?: string;
}

export interface BuildCredentials {
  anthropicApiKey?: string;
  insforgeBaseUrl?: string;
  insforgeAnonKey?: string;
  insforgeAccessToken?: string;
  insforgeProjectId?: string;
}

export interface BuildRequestPayload {
  prompt: string;
  credentials?: BuildCredentials;
}
