/**
 * Envelope shared by every Zoom webhook delivery.
 *
 * Zoom posts a JSON body with a stable top-level shape regardless of the
 * specific event. The `payload` differs per event type, so it is intentionally
 * left as an open record here and narrowed by individual event handlers.
 *
 * @see https://developers.zoom.us/docs/api/webhooks/
 */
export interface ZoomWebhookEvent<TPayload = Record<string, unknown>> {
  /** Event identifier, e.g. `endpoint.url_validation`, `recording.completed`. */
  event: string;
  /** Epoch milliseconds at which Zoom emitted the event. */
  event_ts: number;
  /** Event-specific data. */
  payload: TPayload;
}

/**
 * Payload Zoom sends for the CRC (Challenge-Response Check) handshake that runs
 * when validating an endpoint URL or sending a test event.
 */
export interface ZoomUrlValidationPayload {
  plainToken: string;
}

/** Response Zoom expects back from a successful CRC handshake. */
export interface ZoomUrlValidationResponse {
  plainToken: string;
  encryptedToken: string;
}

export type ZoomUrlValidationEvent = ZoomWebhookEvent<ZoomUrlValidationPayload>;
