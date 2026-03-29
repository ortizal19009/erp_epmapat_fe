export type EmailTransportType = 'SMTP' | 'API_HTTP';
export type EmailSecurityType = 'NONE' | 'STARTTLS' | 'SSL_TLS';
export type EmailDefaultUse = 'FACTURACION' | 'NOTIFICACION' | 'CUSTOM' | 'GENERAL';
export type EmailMessageState = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
export type EmailMessageType = 'DOC_ELECTRONICO' | 'NOTIFICACION' | 'CUSTOM';
export type BlacklistEntryType = 'DOMAIN' | 'HOST' | 'EMAIL';
export type ApiKeyAccessLevel = 'FULL' | 'CUSTOM';

export interface EmailAccount {
  id: number;
  code: string;
  name: string;
  provider: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
  transportType: EmailTransportType;
  host?: string;
  port?: number;
  protocol?: string;
  securityType?: EmailSecurityType;
  authRequired?: boolean;
  username?: string;
  password?: string;
  apiKeyName?: string;
  apiKey?: string;
  apiAccessLevel?: ApiKeyAccessLevel;
  apiRestrictedAccess?: boolean;
  apiKeyEnabled?: boolean;
  apiCreatedAt?: string;
  apiLastActivityAt?: string;
  apiExpiresAt?: string;
  active: boolean;
  defaultAccount: boolean;
  defaultForType: EmailDefaultUse;
  lastConnectionCheck?: string;
}

export interface EmailAttachment {
  name: string;
  sizeLabel: string;
}

export interface EmailLog {
  id: string;
  subject: string;
  type: EmailMessageType;
  state: EmailMessageState;
  fromAddress: string;
  accountId: number;
  accountCode: string;
  accountName?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  attempts: number;
  correlationId: string;
  lastError: string;
  createdAt: string;
  sentAt?: string;
  body: string;
  attachments: EmailAttachment[];
}

export interface EmailBlacklistEntry {
  id: number;
  type: BlacklistEntryType;
  value: string;
  reason: string;
  active: boolean;
  createdAt: string;
}

export interface EmailAccountFormValue {
  code: string;
  name: string;
  provider: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
  transportType: EmailTransportType;
  host: string;
  port: number | null;
  protocol: string;
  securityType: EmailSecurityType;
  authRequired: boolean;
  username: string;
  password: string;
  apiKeyName: string;
  apiKey: string;
  apiAccessLevel: ApiKeyAccessLevel;
  apiRestrictedAccess: boolean;
  apiKeyEnabled: boolean;
  apiCreatedAt: string;
  apiLastActivityAt: string;
  apiExpiresAt: string;
  active: boolean;
  defaultAccount: boolean;
  defaultForType: EmailDefaultUse;
}

export interface EmailComposeFormValue {
  accountId: number | null;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

export interface BlacklistFormValue {
  type: BlacklistEntryType;
  value: string;
  reason: string;
  active: boolean;
}

export const EMAIL_TRANSPORT_OPTIONS: EmailTransportType[] = ['SMTP', 'API_HTTP'];
export const EMAIL_SECURITY_OPTIONS: EmailSecurityType[] = ['NONE', 'STARTTLS', 'SSL_TLS'];
export const EMAIL_DEFAULT_USE_OPTIONS: EmailDefaultUse[] = ['FACTURACION', 'NOTIFICACION', 'CUSTOM', 'GENERAL'];
export const EMAIL_STATE_OPTIONS: EmailMessageState[] = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'];
export const EMAIL_TYPE_OPTIONS: EmailMessageType[] = ['DOC_ELECTRONICO', 'NOTIFICACION', 'CUSTOM'];
export const BLACKLIST_TYPE_OPTIONS: BlacklistEntryType[] = ['DOMAIN', 'HOST', 'EMAIL'];
export const API_KEY_ACCESS_LEVEL_OPTIONS: ApiKeyAccessLevel[] = ['FULL', 'CUSTOM'];
