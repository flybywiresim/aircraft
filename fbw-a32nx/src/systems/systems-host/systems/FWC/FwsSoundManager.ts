// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { EventBus, SimVarValueType, Subscribable } from '@microsoft/msfs-sdk';

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

export enum FwsSyntheticVoiceAural {
  None = 0,
  AutobrakeOff,
  RunwayTooShort,
  KeepMaxReverse,
  SetMaxReverse,
  BrakeMaxBraking,
  PitchPitch,
  SpeedSpeedSpeed,
  Minimums,
  HundredAbove,
  TwoThousandFiveHundred,
  TwentyFiveHundred,
  TwoThousand,
  OneThousand,
  FiveHundred,
  FourHundred,
  FourHundredIntermediate,
  ThreeHundred,
  ThreeHundredIntermediate,
  TwoHundred,
  TwoHundredIntermediate,
  OneHundred,
  OneHundredIntermediate,
  HundredAnd,
  Ninety,
  Eighty,
  Seventy,
  Sixty,
  Fifty,
  Forty,
  Thirty,
  Twenty,
  Nineteen,
  Eighteen,
  Seventeen,
  Sixteen,
  Fifteen,
  Fourteen,
  Thirteen,
  Twelve,
  Eleven,
  Ten,
  Nine,
  Eight,
  Seven,
  Six,
  Five,
  Four,
  Three,
  Two,
  One,
  Zero,
  Retard,
}

interface FwsSyntheticVoice extends FwsAural {
  id: FwsSyntheticVoiceAural;

  /** If this is set, this sound is repeated for the specified number of times */
  repeatFor?: number;

  /** If this is set, this sound is repeated periodically with the specified pause in seconds */
  periodicWithPause?: number;
}

interface FwsAuralWarning extends FwsAural {
  /** The LocalVar which triggers the playback. Not prefixed by L: here. Either localVarName or wwiseEventName has to be defined. */
  localVarName?: string;
  /** The Wwise event which triggers the playback. Either localVarName or wwiseEventName has to be defined. */
  wwiseEventName?: string;

  type: FwsAuralWarningType.AuralWarning | FwsAuralWarningType.SingleChime;
}

interface FwsAural {
  /** Sounds are queued based on type and priority (highest priority = gets queued first within same type) */
  priority?: number;
  type: FwsAuralWarningType;
  /** Length of audio in seconds, if non-repetitive */
  length?: number;

  continuous?: boolean;
}

export const FwsAuralsList: Record<string, FwsAuralWarning | FwsSyntheticVoice> = {
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
    id: FwsSyntheticVoiceAural.AutobrakeOff,
    length: 1.5,
    priority: 17,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  runwayTooShort: {
    id: FwsSyntheticVoiceAural.RunwayTooShort,
    length: 1.6,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: true,
  },
  keepMaxReverse: {
    id: FwsSyntheticVoiceAural.KeepMaxReverse,
    length: 1.4,
    priority: 18,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  setMaxReverse: {
    id: FwsSyntheticVoiceAural.SetMaxReverse,
    length: 1.62,
    priority: 19,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  brakeMaxBraking: {
    id: FwsSyntheticVoiceAural.BrakeMaxBraking,
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
    id: FwsSyntheticVoiceAural.PitchPitch,
    priority: 25,
    length: 0.48,
    type: FwsAuralWarningType.SyntheticVoice,
    repeatFor: 2,
  },
  speedSpeedSpeed: {
    id: FwsSyntheticVoiceAural.SpeedSpeedSpeed,
    priority: 26,
    length: 0.56,
    repeatFor: 3,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  // Altitude callouts
  minimums: {
    id: FwsSyntheticVoiceAural.Minimums,
    length: 0.67,
    priority: 15,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  hundred_above: {
    id: FwsSyntheticVoiceAural.HundredAbove,
    length: 0.72,
    priority: 16,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  retard: {
    // Workaround till we have 10/20ret audio
    id: FwsSyntheticVoiceAural.Retard,
    length: 1.1, // Add a bit of silence before new retard can play
    priority: 22,
    continuous: false,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  retard_continuous: {
    id: FwsSyntheticVoiceAural.Retard,
    priority: 21,
    length: 0.72,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
    periodicWithPause: 0.4,
  },
  alt_2500: {
    id: FwsSyntheticVoiceAural.TwoThousandFiveHundred,
    length: 1.1,
    priority: 0,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2500b: {
    id: FwsSyntheticVoiceAural.TwentyFiveHundred,
    length: 1.047,
    priority: 1,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2000: {
    id: FwsSyntheticVoiceAural.TwoThousand,
    length: 0.72,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_1000: {
    id: FwsSyntheticVoiceAural.OneThousand,
    length: 0.9,
    priority: 3,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_500: {
    id: FwsSyntheticVoiceAural.FiveHundred,
    length: 0.6,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_400: {
    id: FwsSyntheticVoiceAural.FourHundred,
    length: 0.6,
    priority: 5,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  intermediate_400: {
    id: FwsSyntheticVoiceAural.FourHundredIntermediate,
    length: 0.28,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_300: {
    id: FwsSyntheticVoiceAural.ThreeHundred,
    length: 0.6,
    priority: 6,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  intermediate_300: {
    id: FwsSyntheticVoiceAural.ThreeHundredIntermediate,
    length: 0.25,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_200: {
    id: FwsSyntheticVoiceAural.TwoHundred,
    length: 0.6,
    priority: 7,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  intermediate_200: {
    id: FwsSyntheticVoiceAural.TwoHundredIntermediate,
    length: 0.22,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_100: {
    id: FwsSyntheticVoiceAural.OneHundred,
    length: 0.6,
    priority: 8,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  intermediate_100: {
    id: FwsSyntheticVoiceAural.OneHundredIntermediate,
    length: 0.22,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  hundred_and: {
    id: FwsSyntheticVoiceAural.HundredAnd,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.44,
  },

  alt_90: {
    id: FwsSyntheticVoiceAural.Ninety,
    length: 0.47,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_80: {
    id: FwsSyntheticVoiceAural.Eighty,
    length: 0.39,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_70: {
    id: FwsSyntheticVoiceAural.Seventy,
    length: 0.53,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_60: {
    id: FwsSyntheticVoiceAural.Sixty,
    length: 0.5,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_50: {
    id: FwsSyntheticVoiceAural.Fifty,
    length: 0.4,
    priority: 9,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_40: {
    id: FwsSyntheticVoiceAural.Forty,
    length: 0.4,
    priority: 10,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_30: {
    id: FwsSyntheticVoiceAural.Thirty,
    length: 0.4,
    priority: 11,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_20: {
    id: FwsSyntheticVoiceAural.Twenty,
    length: 0.4,
    priority: 12,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_twenty_retard: {
    id: FwsSyntheticVoiceAural.Twenty, // TODO these should include 20 + retard once the audio supports it.
    length: 0.4,
    priority: 23,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_19: {
    id: FwsSyntheticVoiceAural.Nineteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.83,
  },
  alt_18: {
    id: FwsSyntheticVoiceAural.Eighteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.7,
  },

  alt_17: {
    id: FwsSyntheticVoiceAural.Seventeen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.81,
  },

  alt_16: {
    id: FwsSyntheticVoiceAural.Sixteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.76,
  },

  alt_15: {
    id: FwsSyntheticVoiceAural.Fifteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.71,
  },

  alt_14: {
    id: FwsSyntheticVoiceAural.Fourteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.77,
  },

  alt_13: {
    id: FwsSyntheticVoiceAural.Thirteen,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.73,
  },

  alt_12: {
    id: FwsSyntheticVoiceAural.Twelve,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.58,
  },

  alt_11: {
    id: FwsSyntheticVoiceAural.Eleven,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.66,
  },

  alt_10: {
    id: FwsSyntheticVoiceAural.Ten,
    length: 0.3,
    priority: 13,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_ten_retard: {
    id: FwsSyntheticVoiceAural.Ten, // TODO these should include 10 + retard once the audio supports it.
    length: 0.3,
    priority: 24,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_9: {
    id: FwsSyntheticVoiceAural.Nine,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.44,
  },

  alt_8: {
    id: FwsSyntheticVoiceAural.Eight,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.4,
  },

  alt_7: {
    id: FwsSyntheticVoiceAural.Seven,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.54,
  },

  alt_6: {
    id: FwsSyntheticVoiceAural.Six,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.53,
  },

  alt_5: {
    id: FwsSyntheticVoiceAural.Five,
    length: 0.3,
    priority: 14,
    type: FwsAuralWarningType.SyntheticVoice,
  },

  alt_4: {
    id: FwsSyntheticVoiceAural.Four,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.48,
  },

  alt_3: {
    id: FwsSyntheticVoiceAural.Three,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.44,
  },
  alt_2: {
    id: FwsSyntheticVoiceAural.Two,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.44,
  },
  alt_1: {
    id: FwsSyntheticVoiceAural.One,
    type: FwsAuralWarningType.SyntheticVoice,
    length: 0.34,
  },
};

// FIXME single chimes are not filtered (in RL only once every two seconds).
// It should also be possible to play a sythenthic voice and aural warning simultaneously
export class FwsSoundManager {
  private static readonly AUDIO_SYNTHETIC_VOICE_REGISTERED_SIM_VAR = RegisteredSimVar.create(
    'L:1:A32NX_FWS_AUDIO_SYNTHETIC_VOICE',
    SimVarValueType.Enum,
  );
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

  private intermediateSoundKeys: string[] = [];
  public intermediateGenerated = false;

  public hundredAboveEmitted = false;
  public minimumEmitted = false;
  public pitchEmitted = false;
  public speedEmitted = false;
  public autoCalloutEmitted = false;

  constructor(
    private bus: EventBus,
    private startupCompleted: Subscribable<boolean>,
  ) {
    // Stop all sounds

    FwsSoundManager.AUDIO_SYNTHETIC_VOICE_REGISTERED_SIM_VAR.set(FwsSyntheticVoiceAural.None);
    Object.values(FwsAuralsList).forEach((a) => {
      if (this.isAuralWarning(a)) {
        if (a.localVarName) {
          SimVar.SetSimVarValue(`L:${a.localVarName}`, SimVarValueType.Bool, false);
        }
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
      const isAuralWarning = this.isAuralWarning(currentSound);
      if (!currentSound.continuous) {
        return;
      }
      if (isAuralWarning && currentSound.localVarName) {
        SimVar.SetSimVarValue(`L:${currentSound.localVarName}`, SimVarValueType.Bool, false);
      } else if (!isAuralWarning) {
        FwsSoundManager.AUDIO_SYNTHETIC_VOICE_REGISTERED_SIM_VAR.set(FwsSyntheticVoiceAural.None);
        this.setFwsSynthethicVoiceOutputs(currentSound.id, false);
      }
      this.currentSoundPlaying = null;
      this.currentSoundPlayTimeRemaining = 0;
    }
  }

  /**
   * Convenience function for FWS: If condition true and sound not already playing, add to queue. If not, dequeue sound
   * */
  handleSoundCondition(soundKey: keyof typeof FwsAuralsList, condition: boolean) {
    if (!condition) {
      this.dequeueSound(soundKey);
    } else {
      if (condition && this.currentSoundPlaying !== soundKey) {
        this.enqueueSound(soundKey);
      }
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

    const isAuralWarning = this.isAuralWarning(sound);
    if (isAuralWarning) {
      const localVar = sound.localVarName;
      if (localVar) {
        SimVar.SetSimVarValue(`L:${localVar}`, SimVarValueType.Bool, true);
      } else if (sound.wwiseEventName) {
        Coherent.call('PLAY_INSTRUMENT_SOUND', sound.wwiseEventName);
      }
    } else {
      console.log(`Playing synthetic voice sound ${soundKey}`);
      FwsSoundManager.AUDIO_SYNTHETIC_VOICE_REGISTERED_SIM_VAR.set(sound.id);
      if (sound.periodicWithPause !== undefined) {
        this.soundToRepeat = soundKey;
        this.soundToRepeatDelay = sound.periodicWithPause;
      }
      if (this.numberOfTimesToRepeatSound === null && !sound.continuous) {
        this.numberOfTimesToRepeatSound = sound.repeatFor ? sound.repeatFor - 1 : null; // Subtract one for subsequent plays
      }
      this.setFwsSynthethicVoiceOutputs(sound.id, true);
    }

    this.currentSoundPlaying = soundKey;
    this.currentSoundPlayTimeRemaining = sound.continuous ? Infinity : sound.length!;

    this.soundQueue.delete(soundKey);
  }
  /** Find most important sound from soundQueue and play */
  private selectAndPlayMostImportantSound(deltaTime: number): keyof typeof FwsAuralsList | null {
    if (!this.startupCompleted.get()) {
      return null;
    }

    let selectedSoundKey: keyof typeof FwsAuralsList | null = null;
    if (!this.intermediateGenerated) {
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

      this.soundQueue.forEach((sk) => {
        const s = FwsAuralsList[sk];
        if (
          selectedSoundKey === null ||
          s.type > FwsAuralsList[selectedSoundKey].type ||
          (s.type === FwsAuralsList[selectedSoundKey].type &&
            (s.priority ?? 0) > (FwsAuralsList[selectedSoundKey].priority ?? 0))
        ) {
          selectedSoundKey = sk;
        }
      });
    } else {
      // Intermediate audio is in progress, select the next sound for the intermediate callout.
      selectedSoundKey = this.intermediateSoundKeys[0];
    }

    if (selectedSoundKey) {
      if (this.intermediateGenerated && this.intermediateSoundKeys.includes(selectedSoundKey)) {
        this.intermediateGenerated = true;
      }
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
    if (!this.intermediateGenerated && this.repeatNextCycleSound) {
      const soundKey = this.repeatNextCycleSound;
      this.repeatNextCycleSound = null;
      this.playSound(soundKey);
      return;
    }
    // Either wait for the current sound to finish, or schedule the next sound
    const currentSound = this.currentSoundPlaying ? FwsAuralsList[this.currentSoundPlaying] : null;
    const playingSoundKey = this.currentSoundPlaying;
    if (currentSound && this.currentSoundPlayTimeRemaining > 0) {
      if (this.currentSoundPlayTimeRemaining - deltaTime / 1_000 > 0) {
        // Wait for sound to be finished
        this.currentSoundPlayTimeRemaining -= deltaTime / 1_000;
      } else {
        // Sound finishes in this cycle
        const isAuralWarning = this.isAuralWarning(currentSound);
        if (isAuralWarning) {
          if (currentSound.localVarName) {
            SimVar.SetSimVarValue(`L:${currentSound.localVarName}`, SimVarValueType.Bool, false);
          }
        } else {
          FwsSoundManager.AUDIO_SYNTHETIC_VOICE_REGISTERED_SIM_VAR.set(FwsSyntheticVoiceAural.None);
          this.setFwsSynthethicVoiceOutputs(currentSound.id, false);
        }
        this.currentSoundPlaying = null;
        this.currentSoundPlayTimeRemaining = 0;

        if (this.intermediateGenerated) {
          this.intermediateSoundKeys.splice(this.intermediateSoundKeys.indexOf(playingSoundKey!), 1);
          if (this.intermediateSoundKeys.length === 0) {
            this.intermediateGenerated = false;
          }
        }

        if (!this.intermediateGenerated) {
          if (!isAuralWarning) {
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
              this.setFwsSynthethicVoiceOutputs(currentSound.id, false);
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
                (s.type > currentSound.type ||
                  (s.type === currentSound.type && (s.priority ?? 0) > (currentSound.priority ?? 0)))
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
        }
      }
    } else {
      // Play next sound
      this.selectAndPlayMostImportantSound(deltaTime);
    }
  }

  public generateIntermediateCallout(height: number | null) {
    console.log(`Generating intermediate callout for height ${height}`);
    if (height === null || height > 410 || this.intermediateGenerated) {
      return;
    }

    const heightRounded = Math.round(height);

    if (heightRounded >= 100) {
      this.intermediateGenerated = true;
      console.log(`Generating intermediate callout for height ${heightRounded}`);
      // Abv 100 feet. Round to nearest 10 foot to get the closest callout.
      const tens = Math.trunc(heightRounded % 100);
      const hundredSingle = Math.trunc(heightRounded / 100);
      const tensRounded = Math.trunc(tens / 10) * 10;
      const reminderToAdd = Math.trunc(heightRounded % 10) >= 5 ? 10 : 0;
      const calloutHeightToPlay = hundredSingle * 100 + tensRounded + reminderToAdd;
      if (calloutHeightToPlay % 100 === 0) {
        // We can play the whole callout.
        this.intermediateSoundKeys.push(`alt_${calloutHeightToPlay}`);
      } else {
        // Build the hundred and callout.
        const hundredToPlay = Math.trunc(calloutHeightToPlay / 100) * 100;
        const tensToPlay = calloutHeightToPlay % 100;
        this.intermediateSoundKeys.push(`intermediate_${hundredToPlay}`);
        this.intermediateSoundKeys.push('hundred_and');
        this.intermediateSoundKeys.push(`alt_${tensToPlay}`);
      }
    } else {
      console.log(`Generating intermediate callout for height ${heightRounded}`);
      if (heightRounded >= 20) {
        this.intermediateGenerated = true;
        const tens = Math.trunc(heightRounded / 10) * 10;
        this.intermediateSoundKeys.push(`alt_${tens}`);
        const single = Math.trunc(heightRounded % 10);
        if (single > 0) {
          this.intermediateSoundKeys.push(`alt_${single}`);
        }
      } else if (heightRounded > 0) {
        this.intermediateGenerated = true;
        this.intermediateSoundKeys.push(`alt_${heightRounded}`);
      }
    }
  }

  private setFwsSynthethicVoiceOutputs(id: FwsSyntheticVoiceAural, value: boolean) {
    if (id === FwsSyntheticVoiceAural.HundredAbove) {
      this.hundredAboveEmitted = value;
    } else if (id === FwsSyntheticVoiceAural.Minimums) {
      this.minimumEmitted = value;
    } else if (id === FwsSyntheticVoiceAural.PitchPitch) {
      this.pitchEmitted = value;
    } else if (id === FwsSyntheticVoiceAural.SpeedSpeedSpeed) {
      this.speedEmitted = value;
    }
    if (
      id === FwsSyntheticVoiceAural.TwoThousandFiveHundred ||
      id === FwsSyntheticVoiceAural.TwentyFiveHundred ||
      id === FwsSyntheticVoiceAural.TwoThousand ||
      id === FwsSyntheticVoiceAural.OneThousand ||
      id === FwsSyntheticVoiceAural.FiveHundred ||
      id === FwsSyntheticVoiceAural.FourHundred ||
      id === FwsSyntheticVoiceAural.ThreeHundred ||
      id === FwsSyntheticVoiceAural.TwoHundred ||
      id === FwsSyntheticVoiceAural.OneHundred ||
      id === FwsSyntheticVoiceAural.Fifty ||
      id === FwsSyntheticVoiceAural.Forty ||
      id === FwsSyntheticVoiceAural.Thirty ||
      id === FwsSyntheticVoiceAural.Twenty ||
      id === FwsSyntheticVoiceAural.Ten ||
      id === FwsSyntheticVoiceAural.Five ||
      id === FwsSyntheticVoiceAural.Retard
    ) {
      this.autoCalloutEmitted = value || this.hundredAboveEmitted || this.minimumEmitted;
    }
  }

  private isAuralWarning(sound: FwsAural): sound is FwsAuralWarning {
    return sound.type === FwsAuralWarningType.AuralWarning || sound.type === FwsAuralWarningType.SingleChime;
  }
}
