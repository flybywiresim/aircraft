// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface SentryEvent {
  event_id: string;
  [key: string]: unknown;
}

interface ParsedDsn {
  endpoint: string;
  publicKey: string;
}

const SENTRY_PROTOCOL_VERSION = '7';
const SDK_NAME = 'fbw.aircraft';
const MAX_CONCURRENT_REQUESTS = 10;
const FAILURE_LOG_INTERVAL_MS = 60_000;

/** Sends Sentry envelopes without depending on a Sentry SDK. */
export class SentryTransport {
  private readonly endpoint: string;

  private readonly originalConsoleWarn: (...data: unknown[]) => void;

  private readonly sdkInfo: Record<string, unknown>;

  private active = true;

  private pendingRequests = 0;

  private disabledUntil = 0;

  private lastFailureLog = 0;

  constructor(dsn: string, clientVersion: string, originalConsoleWarn: (...data: unknown[]) => void) {
    const parsedDsn = parseDsn(dsn);
    this.sdkInfo = sentrySdkInfo(clientVersion);
    this.endpoint = `${parsedDsn.endpoint}?sentry_key=${encodeURIComponent(
      parsedDsn.publicKey,
    )}&sentry_version=${SENTRY_PROTOCOL_VERSION}&sentry_client=${encodeURIComponent(`${SDK_NAME}/${clientVersion}`)}`;
    this.originalConsoleWarn = originalConsoleWarn;
  }

  send(event: SentryEvent): void {
    if (!this.active || this.pendingRequests >= MAX_CONCURRENT_REQUESTS || Date.now() < this.disabledUntil) {
      return;
    }

    let envelope: string;
    try {
      envelope = serializeEnvelope(event, this.sdkInfo);
    } catch (error) {
      this.logFailure('Could not serialize an error report', error);
      return;
    }

    this.pendingRequests += 1;

    void fetch(this.endpoint, {
      method: 'POST',
      body: envelope,
    })
      .then((response) => {
        this.updateRateLimit(response);

        if (!response.ok && response.status !== 429) {
          this.logFailure(`Error report request failed with status ${response.status}`);
        }
      })
      .catch((error) => this.logFailure('Could not send an error report', error))
      .then(() => {
        this.pendingRequests -= 1;
      });
  }

  close(): void {
    this.active = false;
  }

  private updateRateLimit(response: Response): void {
    const sentryRateLimits = response.headers.get('X-Sentry-Rate-Limits');
    const retryAfter = response.headers.get('Retry-After');
    let delaySeconds = 0;

    if (sentryRateLimits) {
      const firstLimit = sentryRateLimits.split(',')[0];
      delaySeconds = Number(firstLimit.split(':')[0]);
    } else if (response.status === 429) {
      delaySeconds = retryAfter ? Number(retryAfter) : 60;
    }

    if (Number.isFinite(delaySeconds) && delaySeconds > 0) {
      this.disabledUntil = Date.now() + delaySeconds * 1_000;
    }
  }

  private logFailure(message: string, error?: unknown): void {
    const now = Date.now();
    if (now - this.lastFailureLog < FAILURE_LOG_INTERVAL_MS) {
      return;
    }

    this.lastFailureLog = now;

    try {
      if (error === undefined) {
        this.originalConsoleWarn.call(console, `[SentryClient] ${message}`);
      } else {
        this.originalConsoleWarn.call(console, `[SentryClient] ${message}`, error);
      }
    } catch (_error) {
      // Reporting failures must never affect the instrument.
    }
  }
}

export function sentrySdkInfo(version: string): Record<string, unknown> {
  return {
    name: SDK_NAME,
    version,
  };
}

function parseDsn(dsn: string): ParsedDsn {
  const match = /^(https?):\/\/([^@/]+)@([^/]+)(\/.*)$/.exec(dsn);

  if (!match) {
    throw new Error('Invalid Sentry DSN');
  }

  const protocol = match[1];
  const credentials = match[2];
  const host = match[3];
  const pathParts = match[4].split('/').filter((part) => part.length > 0);
  const projectId = pathParts.pop();
  const publicKey = credentials.split(':')[0];

  if (!publicKey || !projectId) {
    throw new Error('Invalid Sentry DSN');
  }

  const pathPrefix = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';

  return {
    endpoint: `${protocol}://${host}${pathPrefix}/api/${projectId}/envelope/`,
    publicKey,
  };
}

function serializeEnvelope(event: SentryEvent, sdkInfo: Record<string, unknown>): string {
  const envelopeHeader = {
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    sdk: sdkInfo,
  };

  return `${JSON.stringify(envelopeHeader)}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;
}
