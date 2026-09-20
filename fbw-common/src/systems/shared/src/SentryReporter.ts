// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import { parseSentryStack, SentryStackFrame, StackFrameFallback } from './SentryStackParser';
import { SentryEvent, sentrySdkInfo, SentryTransport } from './SentryTransport';

type ConsoleMethod = (...data: unknown[]) => void;
type SentryLevel = 'warning' | 'error';

interface ErrorLike {
  name: string;
  message: string;
  stack?: string;
  stacktrace?: string;
  sourceURL?: string;
  fileName?: string;
  line?: number;
  lineNumber?: number;
  column?: number;
  columnNumber?: number;
}

interface RateLimitEntry {
  fingerprint: string;
  windowStarted: number;
  count: number;
}

const CONSOLE_SAMPLE_RATE = 0.1;
const MAX_STRING_LENGTH = 2_000;
const MAX_OBJECT_DEPTH = 3;
const MAX_OBJECT_PROPERTIES = 20;
const MAX_ARRAY_LENGTH = 20;
const MAX_EVENTS_PER_MINUTE = 30;
const MAX_EVENTS_PER_FINGERPRINT_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 100;
const REDACTED_KEY_PATTERN = /authorization|cookie|password|secret|token/i;

/** Captures browser errors and console calls and forwards them to Sentry. */
export class SentryReporter {
  private readonly originalConsoleWarn: ConsoleMethod;

  private readonly originalConsoleError: ConsoleMethod;

  private readonly transport: SentryTransport;

  private readonly release: string;

  private readonly sdkInfo: Record<string, unknown>;

  private sessionId?: string;

  private active = false;

  private isCapturing = false;

  private globalWindowStarted = Date.now();

  private globalEventCount = 0;

  private readonly rateLimitEntries: RateLimitEntry[] = [];

  private readonly consoleWarnWrapper: ConsoleMethod;

  private readonly consoleErrorWrapper: ConsoleMethod;

  private readonly errorListener: EventListener;

  private readonly unhandledRejectionListener: EventListener;

  constructor(dsn: string, release: string, clientVersion: string) {
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
    this.release = release;
    this.sdkInfo = sentrySdkInfo(clientVersion);
    this.transport = new SentryTransport(dsn, clientVersion, this.originalConsoleWarn);

    this.consoleWarnWrapper = (...data) => this.captureConsole('warning', data, this.originalConsoleWarn);
    this.consoleErrorWrapper = (...data) => this.captureConsole('error', data, this.originalConsoleError);
    this.errorListener = (event) => this.captureWindowError(event);
    this.unhandledRejectionListener = (event) => this.captureUnhandledRejection(event);
  }

  start(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    console.warn = this.consoleWarnWrapper;
    console.error = this.consoleErrorWrapper;
    window.addEventListener('error', this.errorListener);
    window.addEventListener('unhandledrejection', this.unhandledRejectionListener);
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  close(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    window.removeEventListener('error', this.errorListener);
    window.removeEventListener('unhandledrejection', this.unhandledRejectionListener);

    if (console.warn === this.consoleWarnWrapper) {
      console.warn = this.originalConsoleWarn;
    }
    if (console.error === this.consoleErrorWrapper) {
      console.error = this.originalConsoleError;
    }

    this.transport.close();
  }

  private captureConsole(level: SentryLevel, data: unknown[], originalMethod: ConsoleMethod): void {
    try {
      originalMethod.apply(console, data);
    } catch (_error) {
      // Some old browser consoles expose methods which cannot be invoked with apply.
    }

    if (!this.active || this.isCapturing || Math.random() > CONSOLE_SAMPLE_RATE) {
      return;
    }

    this.runCapture(() => {
      const firstError = level === 'error' ? asErrorLike(data[0]) : undefined;
      const extra = { arguments: normaliseValue(data) };

      if (firstError) {
        this.sendException(firstError, level, 'console', true, undefined, extra);
      } else {
        const message = truncate(data.map(formatConsoleArgument).join(' ') || `console.${level}`);
        this.sendEvent(
          {
            ...this.createBaseEvent(level, 'console'),
            message,
            extra,
          },
          `console:${level}:${message}`,
        );
      }
    });
  }

  private captureWindowError(event: Event): void {
    if (!this.active || this.isCapturing) {
      return;
    }

    const errorEvent = event as Event & {
      message?: unknown;
      filename?: unknown;
      lineno?: unknown;
      colno?: unknown;
      error?: unknown;
    };

    if (typeof errorEvent.message !== 'string') {
      return;
    }

    this.runCapture(() => {
      const error = asErrorLike(errorEvent.error) || {
        name: 'Error',
        message: errorEvent.message as string,
      };
      const fallback: StackFrameFallback = {
        filename: typeof errorEvent.filename === 'string' ? errorEvent.filename : undefined,
        lineno: typeof errorEvent.lineno === 'number' ? errorEvent.lineno : undefined,
        colno: typeof errorEvent.colno === 'number' ? errorEvent.colno : undefined,
      };

      this.sendException(error, 'error', 'onerror', false, fallback);
    });
  }

  private captureUnhandledRejection(event: Event): void {
    if (!this.active || this.isCapturing) {
      return;
    }

    this.runCapture(() => {
      const reason = (event as Event & { reason?: unknown }).reason;
      const error = asErrorLike(reason);

      if (error) {
        this.sendException(error, 'error', 'onunhandledrejection', false);
        return;
      }

      const message = truncate(`Unhandled promise rejection: ${formatConsoleArgument(reason)}`);
      this.sendEvent(
        {
          ...this.createBaseEvent('error', 'onunhandledrejection'),
          exception: {
            values: [
              {
                type: 'UnhandledRejection',
                value: message,
                mechanism: { type: 'onunhandledrejection', handled: false, synthetic: true },
              },
            ],
          },
          extra: { reason: normaliseValue(reason) },
        },
        `onunhandledrejection:${message}`,
      );
    });
  }

  private sendException(
    error: ErrorLike,
    level: SentryLevel,
    mechanismType: string,
    handled: boolean,
    fallback?: StackFrameFallback,
    extra?: Record<string, unknown>,
  ): void {
    const frames = parseSentryStack(error, fallback);
    const exception: Record<string, unknown> = {
      type: error.name || 'Error',
      value: truncate(error.message || 'No error message'),
      mechanism: { type: mechanismType, handled },
    };

    if (frames.length > 0) {
      exception.stacktrace = { frames };
    }

    const event: SentryEvent = {
      ...this.createBaseEvent(level, mechanismType),
      exception: { values: [exception] },
    };

    if (extra) {
      event.extra = extra;
    }

    this.sendEvent(event, exceptionFingerprint(mechanismType, error, frames));
  }

  private createBaseEvent(level: SentryLevel, source: string): SentryEvent {
    const tags: Record<string, string> = { capture_source: source };
    if (this.sessionId) {
      tags.session_id = this.sessionId;
    }

    return {
      event_id: createEventId(),
      timestamp: Date.now() / 1_000,
      platform: 'javascript',
      level,
      logger: source === 'console' ? 'console' : 'javascript',
      release: this.release,
      sdk: this.sdkInfo,
      tags,
    };
  }

  private sendEvent(event: SentryEvent, fingerprint: string): void {
    if (this.isRateLimited(fingerprint)) {
      return;
    }

    this.transport.send(event);
  }

  private isRateLimited(fingerprint: string): boolean {
    const now = Date.now();

    if (now - this.globalWindowStarted >= RATE_LIMIT_WINDOW_MS) {
      this.globalWindowStarted = now;
      this.globalEventCount = 0;
    }

    if (this.globalEventCount >= MAX_EVENTS_PER_MINUTE) {
      return true;
    }

    let entry = this.rateLimitEntries.find((candidate) => candidate.fingerprint === fingerprint);
    if (!entry) {
      entry = { fingerprint, windowStarted: now, count: 0 };
      this.rateLimitEntries.push(entry);

      if (this.rateLimitEntries.length > MAX_RATE_LIMIT_ENTRIES) {
        this.rateLimitEntries.shift();
      }
    } else if (now - entry.windowStarted >= RATE_LIMIT_WINDOW_MS) {
      entry.windowStarted = now;
      entry.count = 0;
    }

    if (entry.count >= MAX_EVENTS_PER_FINGERPRINT_PER_MINUTE) {
      return true;
    }

    entry.count += 1;
    this.globalEventCount += 1;
    return false;
  }

  private runCapture(callback: () => void): void {
    this.isCapturing = true;
    try {
      callback();
    } catch (_error) {
      // Error reporting must never affect the instrument.
    } finally {
      this.isCapturing = false;
    }
  }
}

function asErrorLike(value: unknown): ErrorLike | undefined {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  try {
    const message = record.message;
    if (typeof message !== 'string') {
      return undefined;
    }

    return {
      name: typeof record.name === 'string' ? record.name : 'Error',
      message,
      stack: readString(record, 'stack'),
      stacktrace: readString(record, 'stacktrace'),
      sourceURL: readString(record, 'sourceURL'),
      fileName: readString(record, 'fileName'),
      line: readNumber(record, 'line'),
      lineNumber: readNumber(record, 'lineNumber'),
      column: readNumber(record, 'column'),
      columnNumber: readNumber(record, 'columnNumber'),
    };
  } catch (_error) {
    return undefined;
  }
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function formatConsoleArgument(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  const error = asErrorLike(value);
  if (error) {
    return `${error.name}: ${error.message}`;
  }

  const normalised = normaliseValue(value);

  if (typeof normalised === 'string') {
    return normalised;
  }

  try {
    return JSON.stringify(normalised);
  } catch (_error) {
    return '[Unserializable]';
  }
}

function normaliseValue(value: unknown, depth = 0, seen: unknown[] = []): unknown {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return truncate(value);
  }
  if (typeof value === 'undefined') {
    return '[undefined]';
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (typeof value === 'symbol') {
    return String(value);
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  if (seen.indexOf(value) !== -1) {
    return '[Circular]';
  }

  const error = asErrorLike(value);
  if (error) {
    return {
      name: truncate(error.name),
      message: truncate(error.message),
      stack: error.stack ? truncate(error.stack) : undefined,
    };
  }

  if (depth >= MAX_OBJECT_DEPTH) {
    return objectType(value);
  }

  const nextSeen = seen.concat([value]);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((entry) => normaliseValue(entry, depth + 1, nextSeen));
  }

  const result: Record<string, unknown> = {};
  let keys: string[];

  try {
    keys = Object.keys(value as Record<string, unknown>).slice(0, MAX_OBJECT_PROPERTIES);
  } catch (_error) {
    return objectType(value);
  }

  for (const key of keys) {
    if (REDACTED_KEY_PATTERN.test(key)) {
      result[key] = '[Filtered]';
      continue;
    }

    try {
      result[key] = normaliseValue((value as Record<string, unknown>)[key], depth + 1, nextSeen);
    } catch (_error) {
      result[key] = '[Thrown while reading property]';
    }
  }

  return result;
}

function objectType(value: object): string {
  try {
    return Object.prototype.toString.call(value);
  } catch (_error) {
    return '[Object]';
  }
}

function exceptionFingerprint(mechanismType: string, error: ErrorLike, frames: SentryStackFrame[]): string {
  const faultingFrame = frames.length > 0 ? frames[frames.length - 1] : undefined;
  const location = faultingFrame
    ? `${faultingFrame.filename || ''}:${faultingFrame.lineno || ''}:${faultingFrame.colno || ''}`
    : '';

  return `${mechanismType}:${error.name}:${error.message}:${location}`;
}

function createEventId(): string {
  let eventId = '';
  for (let index = 0; index < 32; index += 1) {
    eventId += Math.floor(Math.random() * 16).toString(16);
  }

  return eventId;
}

function truncate(value: string): string {
  return value.length <= MAX_STRING_LENGTH ? value : `${value.slice(0, MAX_STRING_LENGTH)}…`;
}
