// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CrewVoice, VoiceLineId } from './VirtualCrewTypes';
import durations from './voice-line-durations.json';

/** Pause between two phrases, in milliseconds */
const PAUSE_BETWEEN_PHRASES_MS = 250;

/** Duration used when the duration of a phrase is unknown, in milliseconds */
const DEFAULT_PHRASE_DURATION_MS = 1500;

interface QueuedPhrase {
  voice: CrewVoice;
  line: VoiceLineId;
  /** Called when the phrase starts, e.g. to execute an action along with the confirmation */
  onStart?: () => void;
  /** Pause after the phrase, in milliseconds, {@link PAUSE_BETWEEN_PHRASES_MS} if not defined */
  pauseAfterMs?: number;
}

/**
 * Name of the Wwise event of a phrase, must match event_name() in tools/virtual-crew-voices/generate_voices.py
 * @param voice the voice
 * @param line the phrase
 * @returns the Wwise event name
 */
export function wwiseEventName(voice: CrewVoice, line: VoiceLineId): string {
  // line identifiers start with a lower case letter (camelCase), no lookbehind as it is not supported by Coherent GT
  return `vcrew_${voice}_${line.replace(/([A-Z0-9])/g, '_$1').toLowerCase()}`;
}

/**
 * Plays the phrases of the virtual crew one after the other, so that the crew members do not speak at the same time.
 */
export class VoicePlayer {
  private readonly queue: QueuedPhrase[] = [];

  private busyUntil = 0;

  constructor(private readonly play: (wwiseEvent: string) => void) {}

  public enqueue(phrase: QueuedPhrase): void {
    this.queue.push(phrase);
  }

  /** Drops the phrases which were not played yet */
  public clear(): void {
    this.queue.length = 0;
  }

  /**
   * Starts the next phrase when the previous one is finished
   * @param now the current time in milliseconds
   */
  public update(now: number): void {
    if (now < this.busyUntil) {
      return;
    }

    const phrase = this.queue.shift();
    if (phrase === undefined) {
      return;
    }

    phrase.onStart?.();
    this.play(wwiseEventName(phrase.voice, phrase.line));
    this.busyUntil =
      now + VoicePlayer.duration(phrase.voice, phrase.line) + (phrase.pauseAfterMs ?? PAUSE_BETWEEN_PHRASES_MS);
  }

  private static duration(voice: CrewVoice, line: VoiceLineId): number {
    return (
      (durations as Partial<Record<CrewVoice, Partial<Record<VoiceLineId, number>>>>)[voice]?.[line] ??
      DEFAULT_PHRASE_DURATION_MS
    );
  }
}
