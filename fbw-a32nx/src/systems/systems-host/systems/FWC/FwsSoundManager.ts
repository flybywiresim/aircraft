// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, Subscribable } from '@microsoft/msfs-sdk';

const MINIMUM_LOCAL_VAR = 'A32NX_FWS_AUDIO_MINIMUMS';
const HUNDRED_ABOVE_LOCAL_VAR = 'A32NX_FWS_AUDIO_100_ABOVE';
const PITCH_PITCH_LOCAL_VAR = 'A32NX_FWS_AUDIO_PITCH';
const SPEED_SPEED_SPEED_LOCAL_VAR = 'A32NX_FWS_AUDIO_SPEED';

export interface FwsSoundManagerControlEvents {
  enqueueSound: string;
  dequeueSound: string;
}

// Synthetic voice has priority over everything, SC is least important
enum FwsAuralWarningType {
  SingleChime,
  AuralWarning,
  SyntheticVoice,
}

export enum FwsAuralVolume {
  Full, // 0 dB
  Attenuated, // -6dB
  Silent, // -200 dB
}

interface FwsAural {
  /** The LocalVar which triggers the playback. Not prefixed by L: here. Either localVarName or wwiseEventName has to be defined. */
  localVarName?: string;
  /** The Wwise event which triggers the playback. Either localVarName or wwiseEventName has to be defined. */
  wwiseEventName?: string;
  /** Sounds are queued based on type and priority (highest priority = gets queued first within same type) */
  priority: number;
  type: FwsAuralWarningType;
  /** Length of audio in seconds, if non-repetitive */
  length?: number;
  /** If this is set, this sound is repeated periodically with the specified pause in seconds */
  periodicWithPause?: number;
  continuous?: boolean;
  /** If this is set, this sound is repeated for the specified number of times */
  repeatFor?: number;
}

export const FwsAuralsList: Record<string, FwsAural> = {
  continuousRepetitiveChime: {
    localVarName: 'A32NX_FWC_CRC',
    priority: 5,
    type: FwsAuralWarningType.AuralWarning,
    continuous: true,
  },
  singleChime: {
    localVarName: 'A32NX_FWC_SC',
    length: 0.54,
    priority: 0,
    type: FwsAuralWarningType.SingleChime,
    continuous: false,
  },
  cavalryCharge: {
    localVarName: 'A32NX_FWC_CAVALRY_CHARGE',
    length: 1,
    priority: 4,
    type: FwsAuralWarningType.AuralWarning,
    periodicWithPause: 3,
  },
  tripleClick: {
    wwiseEventName: '3click',
    length: 0.62,
    priority: 3,
    type: FwsAuralWarningType.AuralWarning,
    continuous: false,
  },
  pause0p8s: {
    localVarName: 'A32NX_AUDIO_PAUSE',
    length: 0.8,
    priority: 4,
    type: FwsAuralWarningType.AuralWarning,
    continuous: false,
  },
  autoBrakeOff: {
    localVarName: 'A32NX_AUDIO_AUTOBRAKE_OFF',
    length: 1.5,
    priority: 17,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  runwayTooShort: {
    localVarName: 'A32NX_AUDIO_ROW_RWY_TOO_SHORT',
    length: 1.6,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: true,
  },
  keepMaxReverse: {
    localVarName: 'A32NX_AUDIO_ROP_KEEP_MAX_REVERSE',
    length: 1.4,
    priority: 18,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  setMaxReverse: {
    localVarName: 'A32NX_AUDIO_ROW_SET_MAX_REVERSE',
    length: 1.62,
    priority: 19,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  brakeMaxBraking: {
    localVarName: 'A32NX_AUDIO_ROP_MAX_BRAKING',
    length: 3.1,
    priority: 20,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: true,
  },
  cChordCont: {
    localVarName: 'A32NX_FWC_CCHORD',
    priority: 3,
    type: FwsAuralWarningType.AuralWarning,
    continuous: true,
  },
  pitchPitch: {
    localVarName: PITCH_PITCH_LOCAL_VAR,
    priority: 25,
    length: 0.48,
    type: FwsAuralWarningType.SyntheticVoice,
    repeatFor: 2,
  },
  speedSpeedSpeed: {
    localVarName: SPEED_SPEED_SPEED_LOCAL_VAR,
    priority: 26,
    length: 0.56,
    repeatFor: 3,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  // Altitude callouts
  minimums: {
    localVarName: MINIMUM_LOCAL_VAR,
    length: 0.67,
    priority: 15,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  hundred_above: {
    localVarName: HUNDRED_ABOVE_LOCAL_VAR,
    length: 0.72,
    priority: 16,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  retard: {
    // Workaround till we have 10/20ret audio
    localVarName: 'A32NX_FWS_AUDIO_RETARD',
    length: 1.1, // Add a bit of silence before new retard can play
    priority: 22,
    continuous: false,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  retard_continuous: {
    localVarName: 'A32NX_FWS_AUDIO_RETARD',
    priority: 21,
    length: 0.72,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
    periodicWithPause: 0.4,
  },
  alt_2500: {
    localVarName: 'A32NX_FWS_AUDIO_2500',
    length: 1.1,
    priority: 0,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2500b: {
    localVarName: 'A32NX_FWS_AUDIO_25_00',
    length: 1.047,
    priority: 1,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2000: {
    localVarName: 'A32NX_FWS_AUDIO_2000',
    length: 0.72,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_1000: {
    localVarName: 'A32NX_FWS_AUDIO_1000',
    length: 0.9,
    priority: 3,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_500: {
    localVarName: 'A32NX_FWS_AUDIO_500',
    length: 0.6,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_400: {
    localVarName: 'A32NX_FWS_AUDIO_400',
    length: 0.6,
    priority: 5,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_300: {
    localVarName: 'A32NX_FWS_AUDIO_300',
    length: 0.6,
    priority: 6,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_200: {
    localVarName: 'A32NX_FWS_AUDIO_200',
    length: 0.6,
    priority: 7,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_100: {
    localVarName: 'A32NX_FWS_AUDIO_100',
    length: 0.6,
    priority: 8,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_50: {
    localVarName: 'A32NX_FWS_AUDIO_50',
    length: 0.4,
    priority: 9,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_40: {
    localVarName: 'A32NX_FWS_AUDIO_40',
    length: 0.4,
    priority: 10,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_30: {
    localVarName: 'A32NX_FWS_AUDIO_30',
    length: 0.4,
    priority: 11,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_20: {
    localVarName: 'A32NX_FWS_AUDIO_20',
    length: 0.4,
    priority: 12,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_twenty_retard: {
    localVarName: 'A32NX_FWS_AUDIO_20', // TODO these should include 20 + retard once the audio supports it.
    length: 0.4,
    priority: 23,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_10: {
    localVarName: 'A32NX_FWS_AUDIO_10',
    length: 0.3,
    priority: 13,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_ten_retard: {
    localVarName: 'A32NX_FWS_AUDIO_10', // TODO these should include 10 + retard once the audio supports it.
    length: 0.3,
    priority: 24,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_5: {
    localVarName: 'A32NX_FWS_AUDIO_5',
    length: 0.3,
    priority: 14,
    type: FwsAuralWarningType.SyntheticVoice,
  },
};

// FIXME Not all sounds are added to this yet (e.g. CIDS chimes), consider adding them in the future
// Also, single chimes are not filtered (in RL only once every two seconds)
export class FwsSoundManager {
  private readonly soundQueue = new Set<keyof typeof FwsAuralsList>();

  private singleChimesPending = 0;

  private currentSoundPlaying: keyof typeof FwsAuralsList | null = null;

  /** The sound to be repeated next cycle (only for non continuous sounds). Cannot be interrupted */
  private repeatNextCycleSound: keyof typeof FwsAuralsList | null = null;
  /* The number of times the sound shall be repeated after the initial play  */
  private numberOfTimesToRepeatSound: number | null = null;

  /** in seconds */
  private currentSoundPlayTimeRemaining = 0;
  /** in seconds */
  private soundToRepeatDelay: number | null = null;
  private soundToRepeat: keyof typeof FwsAuralsList | null = null;

  public hundredAboveEmitted = false;
  public minimumEmitted = false;
  public pitchEmitted = false;
  public speedEmitted = false;

  constructor(
    private bus: EventBus,
    private startupCompleted: Subscribable<boolean>,
  ) {
    // Stop all sounds
    Object.values(FwsAuralsList).forEach((a) => {
      if (a.localVarName) {
        SimVar.SetSimVarValue(`L:${a.localVarName}`, SimVarValueType.Bool, false);
      }
    });

    const sub = this.bus.getSubscriber<FwsSoundManagerControlEvents>();
    sub.on('enqueueSound').handle((s) => this.enqueueSound(s));
    sub.on('dequeueSound').handle((s) => this.dequeueSound(s));
  }

  /** Get the current emitted sound or the sound which is about to be repeated, for example for the AP OFF logic computation. */
  getCurrentSoundPlaying() {
    return this.currentSoundPlaying ?? this.soundToRepeat;
  }

  /** Add sound to queue. Don't add if already playing */
  enqueueSound(soundKey: keyof typeof FwsAuralsList) {
    const sound = FwsAuralsList[soundKey];
    if (!sound || this.currentSoundPlaying === soundKey) {
      return;
    }

    if (sound.type === FwsAuralWarningType.SyntheticVoice || sound.type === FwsAuralWarningType.AuralWarning) {
      this.soundQueue.add(soundKey);
    } else if (sound.type === FwsAuralWarningType.SingleChime) {
      this.singleChimesPending++;
    }
  }

  /** Remove sound from queue, e.g. when condition doesn't apply anymore. If sound is currently playing, stops sound immediately */
  dequeueSound(soundKey: keyof typeof FwsAuralsList) {
    // Check if this sound is currently playing
    if (this.currentSoundPlaying === soundKey && FwsAuralsList[this.currentSoundPlaying]?.continuous) {
      this.stopCurrentSound();
    }
    this.soundQueue.delete(soundKey);
    if (soundKey === this.soundToRepeat) {
      this.soundToRepeatDelay = null;
      this.soundToRepeat = null;
    }
  }

  private stopCurrentSound() {
    // Only LVar sounds which are continuous can be stopped
    if (this.currentSoundPlaying) {
      const currentSound = FwsAuralsList[this.currentSoundPlaying];
      if (!currentSound.continuous || !currentSound.localVarName) {
        return;
      }
      SimVar.SetSimVarValue(`L:${currentSound.localVarName}`, SimVarValueType.Bool, false);
      this.currentSoundPlaying = null;
      this.currentSoundPlayTimeRemaining = 0;
      this.setFwsAudioOutputs(currentSound.localVarName, false);
    }
  }

  /**
   * Convenience function for FWS: If condition true and sound not already playing, add to queue. If not, dequeue sound
   * */
  handleSoundCondition(soundKey: keyof typeof FwsAuralsList, condition: boolean) {
    if (condition && this.currentSoundPlaying !== soundKey) {
      this.enqueueSound(soundKey);
    } else if (!condition) {
      this.dequeueSound(soundKey);
    }
  }

  /** This only has an effect on sounds defining WwiseRTPC behavior/var for volume */
  setVolume(volume: FwsAuralVolume) {
    SimVar.SetSimVarValue('L:A32NX_FWS_AUDIO_VOLUME', SimVarValueType.Enum, volume);
  }

  /** Play now, not to be called from the outside */
  private playSound(soundKey: keyof typeof FwsAuralsList) {
    const sound = FwsAuralsList[soundKey];
    if (!sound) {
      return;
    }
    const localVar = sound.localVarName;

    if (localVar) {
      SimVar.SetSimVarValue(`L:${localVar}`, SimVarValueType.Bool, true);
      this.setFwsAudioOutputs(localVar, true);
    } else if (sound.wwiseEventName) {
      Coherent.call('PLAY_INSTRUMENT_SOUND', sound.wwiseEventName);
    }

    this.currentSoundPlaying = soundKey;
    this.currentSoundPlayTimeRemaining = sound.continuous ? Infinity : sound.length!;
    this.soundToRepeat = sound.periodicWithPause ? soundKey : null;
    this.soundToRepeatDelay = sound.periodicWithPause ?? null;
    if (this.numberOfTimesToRepeatSound === null && !sound.continuous) {
      this.numberOfTimesToRepeatSound = sound.repeatFor ? sound.repeatFor - 1 : null; // Subtract one for subsequent plays
    }
    this.soundQueue.delete(soundKey);
  }
  /** Find most important sound from soundQueue and play */
  private selectAndPlayMostImportantSound(deltaTime: number): keyof typeof FwsAuralsList | null {
    if (!this.startupCompleted.get()) {
      return null;
    }

    if (this.soundToRepeatDelay !== null && this.soundToRepeat !== null) {
      this.soundToRepeatDelay -= deltaTime / 1_000;
      if (this.soundToRepeatDelay <= 0) {
        this.soundQueue.add(this.soundToRepeat);
        this.soundToRepeatDelay = null;
        this.soundToRepeat = null;
      }
    }

    // Logic for scheduling new sounds: Take sound from soundQueue of most important type
    // (SyntheticVoice > AuralWarning > SingleChime) with highest priority, and play it
    // TODO SyntheticVoice should not be interrupted by SC/CRC
    let selectedSoundKey: keyof typeof FwsAuralsList | null = null;
    this.soundQueue.forEach((sk) => {
      const s = FwsAuralsList[sk];
      if (
        selectedSoundKey === null ||
        s.type > FwsAuralsList[selectedSoundKey].type ||
        (s.type === FwsAuralsList[selectedSoundKey].type && s.priority > FwsAuralsList[selectedSoundKey].priority)
      ) {
        selectedSoundKey = sk;
      }
    });

    if (selectedSoundKey) {
      this.playSound(selectedSoundKey);
      return selectedSoundKey;
    }

    // See if single chimes are left
    if (this.singleChimesPending) {
      this.playSound('singleChime');
      this.singleChimesPending--;
      return 'singleChime';
    }

    // Ok, nothing to play
    return null;
  }

  onUpdate(deltaTime: number) {
    // Enforce one cycle delay before repeating
    if (this.repeatNextCycleSound) {
      const soundKey = this.repeatNextCycleSound;
      this.repeatNextCycleSound = null;
      this.playSound(soundKey);
      return;
    }
    // Either wait for the current sound to finish, or schedule the next sound
    const currentSound = this.currentSoundPlaying ? FwsAuralsList[this.currentSoundPlaying] : null;
    const playingSoundKey = this.currentSoundPlaying;
    if (this.currentSoundPlaying && this.currentSoundPlayTimeRemaining > 0) {
      if (this.currentSoundPlayTimeRemaining - deltaTime / 1_000 > 0) {
        // Wait for sound to be finished
        this.currentSoundPlayTimeRemaining -= deltaTime / 1_000;
      } else {
        // Sound finishes in this cycle
        if (currentSound?.localVarName) {
          SimVar.SetSimVarValue(`L:${currentSound.localVarName}`, SimVarValueType.Bool, false);
          this.setFwsAudioOutputs(currentSound.localVarName, false);
        }
        this.currentSoundPlaying = null;
        this.currentSoundPlayTimeRemaining = 0;
        // Enforce one cycle delay before repeating the sound if applicable, otherwise sim won't interrupt the sound.
        if (
          !currentSound?.continuous &&
          this.numberOfTimesToRepeatSound !== null &&
          this.numberOfTimesToRepeatSound > 0
        ) {
          this.numberOfTimesToRepeatSound--;
          this.repeatNextCycleSound = playingSoundKey;
          return;
        } else {
          this.numberOfTimesToRepeatSound = null;
          this.setFwsAudioOutputs(currentSound?.localVarName ?? '', false);
        }
      }

      // Interrupt if sound with higher category is present in queue and current sound is continuous
      let shouldInterrupt = false;
      let rescheduleSound: keyof typeof FwsAuralsList | null = null;
      if (currentSound?.continuous) {
        this.soundQueue.forEach((sk) => {
          const s = FwsAuralsList[sk];
          if (
            s &&
            (s.type > currentSound.type || (s.type === currentSound.type && s.priority > currentSound.priority))
          ) {
            shouldInterrupt = true;
          }
        });
      }

      if (shouldInterrupt) {
        if (this.currentSoundPlaying && currentSound!.continuous) {
          rescheduleSound = this.currentSoundPlaying;
          this.stopCurrentSound();
          if (rescheduleSound) {
            this.enqueueSound(rescheduleSound);
          }
        }
      }
    } else {
      // Play next sound
      this.selectAndPlayMostImportantSound(deltaTime);
    }
  }

  private setFwsAudioOutputs(localVarName: string, value: boolean) {
    if (localVarName === HUNDRED_ABOVE_LOCAL_VAR) {
      this.hundredAboveEmitted = value;
    } else if (localVarName === MINIMUM_LOCAL_VAR) {
      this.minimumEmitted = value;
    } else if (localVarName === PITCH_PITCH_LOCAL_VAR) {
      this.pitchEmitted = value;
    } else if (localVarName === SPEED_SPEED_SPEED_LOCAL_VAR) {
      this.speedEmitted = value;
    }
  }
}
