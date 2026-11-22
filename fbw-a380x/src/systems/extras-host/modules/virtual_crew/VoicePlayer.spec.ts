// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it, vi } from 'vitest';
import { VoicePlayer, wwiseEventName } from './VoicePlayer';
import voiceLines from './voice-lines.json';
import durations from './voice-line-durations.json';
import { CrewVoice, VoiceLineId } from './VirtualCrewTypes';

describe('virtual crew voice player', () => {
  it('names the Wwise events like the voice generator', () => {
    expect(wwiseEventName('male', 'v1')).toBe('vcrew_male_v_1');
    expect(wwiseEventName('female', 'oneHundredKnots')).toBe('vcrew_female_one_hundred_knots');
    expect(wwiseEventName('male', 'takeoff')).toBe('vcrew_male_takeoff');
  });

  it('knows the duration of every phrase of every voice', () => {
    for (const voice of voiceLines.voices as CrewVoice[]) {
      for (const line of Object.keys(voiceLines.lines) as VoiceLineId[]) {
        expect(durations[voice][line], `${voice} ${line}`).toBeGreaterThan(0);
      }
    }
  });

  it('plays the phrases one after the other', () => {
    const play = vi.fn();
    const onStart = vi.fn();
    const player = new VoicePlayer(play);

    player.enqueue({ voice: 'male', line: 'gearUp' });
    player.enqueue({ voice: 'female', line: 'gearUp', onStart });

    player.update(0);
    expect(play).toHaveBeenLastCalledWith('vcrew_male_gear_up');
    expect(onStart).not.toHaveBeenCalled();

    // the first phrase is still playing
    player.update(durations.male.gearUp - 1);
    expect(play).toHaveBeenCalledTimes(1);

    player.update(durations.male.gearUp + 1000);
    expect(play).toHaveBeenLastCalledWith('vcrew_female_gear_up');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('drops the queued phrases on clear', () => {
    const play = vi.fn();
    const player = new VoicePlayer(play);
    player.enqueue({ voice: 'male', line: 'v1' });
    player.clear();
    player.update(0);
    expect(play).not.toHaveBeenCalled();
  });
});
