// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface SentryStackFrame {
  filename?: string;
  function: string;
  lineno?: number;
  colno?: number;
  in_app: boolean;
}

export interface StackFrameFallback {
  filename?: string;
  lineno?: number;
  colno?: number;
}

const MAX_STACK_FRAMES = 50;

/**
 * Parses an Error stack into the oldest-first order expected by Sentry.
 *
 * JavaScriptCore/WebKit stack lines are attempted before V8-style lines because Coherent GT uses an old WebKit.
 */
export function parseSentryStack(error: unknown, fallback?: StackFrameFallback): SentryStackFrame[] {
  const errorRecord = asRecord(error);
  const stack = errorRecord
    ? readStringProperty(errorRecord, 'stack') || readStringProperty(errorRecord, 'stacktrace')
    : '';
  const frames: SentryStackFrame[] = [];

  if (stack) {
    for (const line of stack.split('\n')) {
      const frame = parseWebKitFrame(line) || parseV8Frame(line);

      if (frame) {
        frames.push(frame);
      }

      if (frames.length === MAX_STACK_FRAMES) {
        break;
      }
    }
  }

  if (frames.length > 0) {
    // Error stacks list the faulting frame first. Sentry expects it last.
    return frames.reverse();
  }

  const legacyFallback = errorRecord ? legacyErrorLocation(errorRecord) : undefined;
  const location = mergeFallbacks(fallback, legacyFallback);

  if (!location || (!location.filename && location.lineno === undefined && location.colno === undefined)) {
    return [];
  }

  return [createFrame(location.filename, '?', location.lineno, location.colno)];
}

function parseWebKitFrame(line: string): SentryStackFrame | undefined {
  const trimmed = line.trim();

  if (!trimmed || trimmed === '[native code]') {
    return undefined;
  }

  // JavaScriptCore: functionName@url:line:column (the function name may be empty).
  const lineAndColumnMatch = /^(.*?)@(.*):(\d+):(\d+)$/.exec(trimmed);
  if (lineAndColumnMatch) {
    return createFrame(
      lineAndColumnMatch[2],
      normaliseFunctionName(lineAndColumnMatch[1]),
      Number(lineAndColumnMatch[3]),
      Number(lineAndColumnMatch[4]),
    );
  }

  const lineOnlyMatch = /^(.*?)@(.*):(\d+)$/.exec(trimmed);
  if (lineOnlyMatch) {
    return createFrame(lineOnlyMatch[2], normaliseFunctionName(lineOnlyMatch[1]), Number(lineOnlyMatch[3]), undefined);
  }

  return undefined;
}

function parseV8Frame(line: string): SentryStackFrame | undefined {
  const match = /^\s*at (?:(.*?)\s+\()?(.+):(\d+):(\d+)\)?\s*$/.exec(line);

  if (!match) {
    return undefined;
  }

  return createFrame(match[2], normaliseFunctionName(match[1]), Number(match[3]), Number(match[4]));
}

function createFrame(
  filename: string | undefined,
  functionName: string,
  lineno: number | undefined,
  colno: number | undefined,
): SentryStackFrame {
  const frame: SentryStackFrame = {
    function: functionName,
    in_app: true,
  };

  if (filename) {
    frame.filename = filename;
  }
  if (lineno !== undefined && Number.isFinite(lineno)) {
    frame.lineno = lineno;
  }
  if (colno !== undefined && Number.isFinite(colno)) {
    frame.colno = colno;
  }

  return frame;
}

function normaliseFunctionName(functionName: string | undefined): string {
  if (!functionName || functionName === 'global code') {
    return '?';
  }

  return functionName;
}

function legacyErrorLocation(error: Record<string, unknown>): StackFrameFallback | undefined {
  const filename = readStringProperty(error, 'sourceURL') || readStringProperty(error, 'fileName');
  const lineno = readNumberProperty(error, 'line') ?? readNumberProperty(error, 'lineNumber');
  const colno = readNumberProperty(error, 'column') ?? readNumberProperty(error, 'columnNumber');

  if (!filename && lineno === undefined && colno === undefined) {
    return undefined;
  }

  return { filename, lineno, colno };
}

function mergeFallbacks(
  preferred: StackFrameFallback | undefined,
  secondary: StackFrameFallback | undefined,
): StackFrameFallback | undefined {
  if (!preferred) {
    return secondary;
  }
  if (!secondary) {
    return preferred;
  }

  return {
    filename: preferred.filename || secondary.filename,
    lineno: preferred.lineno ?? secondary.lineno,
    colno: preferred.colno ?? secondary.colno,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return (typeof value === 'object' && value !== null) || typeof value === 'function'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readStringProperty(record: Record<string, unknown>, key: string): string | undefined {
  try {
    const value = record[key];
    return typeof value === 'string' ? value : undefined;
  } catch (_error) {
    return undefined;
  }
}

function readNumberProperty(record: Record<string, unknown>, key: string): number | undefined {
  try {
    const value = record[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  } catch (_error) {
    return undefined;
  }
}
