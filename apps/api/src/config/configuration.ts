/**
 * Strongly-typed view over the environment, consumed via Nest's ConfigService.
 *
 * Keep all `process.env` access funnelled through here so the rest of the app
 * reads typed values and defaults live in one place.
 */
export interface AppConfig {
  port: number;
  databaseUrl: string;
  zoomWebhookSecretToken: string;
  zoomClientId: string;
  zoomClientSecret: string;
  resendApiKey: string;
  emailFrom: string;
  adminNotificationEmail: string;
  appPublicUrl: string;
  apiPublicUrl: string;
  adminAccessCode: string;
  defaultLinkExpirationDays: number;
  corsOrigins: string[];
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  zoomWebhookSecretToken: process.env.ZOOM_WEBHOOK_SECRET_TOKEN ?? '',
  zoomClientId: process.env.ZOOM_CLIENT_ID ?? '',
  zoomClientSecret: process.env.ZOOM_CLIENT_SECRET ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom:
    process.env.EMAIL_FROM ??
    'ZoomVault <onboarding@resend.dev>',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',
  apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',
  adminAccessCode: process.env.ADMIN_ACCESS_CODE ?? '',
  defaultLinkExpirationDays: parseInt(
    process.env.DEFAULT_LINK_EXPIRATION_DAYS ?? '14',
    10,
  ),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
