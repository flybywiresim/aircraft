// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

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
  cavalryChargeOnce: {
    localVarName: 'A32NX_FWC_CAVALRY_CHARGE',
    length: 0.9,
    priority: 4,
    type: FwsAuralWarningType.AuralWarning,
    continuous: false,
  },
  cavalryChargeCont: {
    localVarName: 'A32NX_FWC_CAVALRY_CHARGE',
    priority: 4,
    type: FwsAuralWarningType.AuralWarning,
    continuous: true,
  },
  tripleClick: {
    localVarName: 'A32NX_FMA_TRIPLE_CLICK',
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
    priority: 2,
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
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  setMaxReverse: {
    localVarName: 'A32NX_AUDIO_ROW_SET_MAX_REVERSE',
    length: 1.62,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: false,
  },
  brakeMaxBraking: {
    localVarName: 'A32NX_AUDIO_ROP_MAX_BRAKING',
    length: 3.1,
    priority: 4,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: true,
  },
  stall: {
    localVarName: 'A32NX_AUDIO_ROP_MAX_BRAKING',
    length: 3.0,
    priority: 5,
    type: FwsAuralWarningType.SyntheticVoice,
    continuous: true,
  },
  cChordOnce: {
    localVarName: 'A32NX_ALT_DEVIATION',
    length: 1.0,
    priority: 3,
    type: FwsAuralWarningType.AuralWarning,
    continuous: false,
  },
  cChordCont: {
    localVarName: 'A32NX_ALT_DEVIATION',
    priority: 3,
    type: FwsAuralWarningType.AuralWarning,
    continuous: true,
  },
  // Altitude callouts
  minimums: {
    wwiseEventName: 'aural_minimumnew',
    length: 0.67,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  hundred_above: {
    wwiseEventName: 'aural_100above',
    length: 0.72,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  retard: {
    wwiseEventName: 'new_retard',
    length: 0.9,
    periodicWithPause: 0.2,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2500: {
    wwiseEventName: 'new_2500',
    length: 1.1,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2500b: {
    wwiseEventName: 'new_2_500',
    length: 1.047,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_2000: {
    wwiseEventName: 'new_2000',
    length: 0.72,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_1000: {
    wwiseEventName: 'new_1000',
    length: 0.9,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_500: {
    wwiseEventName: 'new_500',
    length: 0.6,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_400: {
    wwiseEventName: 'new_400',
    length: 0.6,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_300: {
    wwiseEventName: 'new_300',
    length: 0.6,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_200: {
    wwiseEventName: 'new_200',
    length: 0.6,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_100: {
    wwiseEventName: 'new_100',
    length: 0.6,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_50: {
    wwiseEventName: 'new_50',
    length: 0.4,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_40: {
    wwiseEventName: 'new_40',
    length: 0.4,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_30: {
    wwiseEventName: 'new_30',
    length: 0.4,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_20: {
    wwiseEventName: 'new_20',
    length: 0.4,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_10: {
    wwiseEventName: 'new_10',
    length: 0.3,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
  alt_5: {
    wwiseEventName: 'new_5',
    length: 0.3,
    priority: 2,
    type: FwsAuralWarningType.SyntheticVoice,
  },
};

// FIXME Not all sounds are added to this yet (e.g. CIDS chimes), consider adding them in the future
// Also, single chimes are not filtered (in RL only once every two seconds)
export class FwsSoundManager {
  private readonly soundQueue = new Set<keyof typeof FwsAuralsList>();

  private singleChimesPending = 0;

  private currentSoundPlaying: keyof typeof FwsAuralsList | null = null;

  /** in seconds */
  private currentSoundPlayTimeRemaining = 0;

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
  }

  private stopCurrentSound() {
    // Only LVar sounds which are continuous can be stopped
    if (
      this.currentSoundPlaying &&
      FwsAuralsList[this.currentSoundPlaying].localVarName &&
      FwsAuralsList[this.currentSoundPlaying]?.continuous
    ) {
      SimVar.SetSimVarValue(`L:${FwsAuralsList[this.currentSoundPlaying].localVarName}`, SimVarValueType.Bool, false);
      this.currentSoundPlaying = null;
      this.currentSoundPlayTimeRemaining = 0;
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

    if (sound.localVarName) {
      SimVar.SetSimVarValue(`L:${sound.localVarName}`, SimVarValueType.Bool, true);
    } else if (sound.wwiseEventName) {
      Coherent.call('PLAY_INSTRUMENT_SOUND', sound.wwiseEventName);
    }
    this.currentSoundPlaying = soundKey;
    this.currentSoundPlayTimeRemaining = sound.continuous ? Infinity : sound.length;
    this.soundQueue.delete(soundKey);
  }
  /** Find most important sound from soundQueue and play */
  private selectAndPlayMostImportantSound(): keyof typeof FwsAuralsList | null {
    if (!this.startupCompleted.get()) {
      return;
    }

    // Logic for scheduling new sounds: Take sound from soundQueue of most important type
    // (SyntheticVoice > AuralWarning > SingleChime) with highest priority, and play it
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
    // Either wait for the current sound to finish, or schedule the next sound
    if (this.currentSoundPlaying && this.currentSoundPlayTimeRemaining > 0) {
      if (this.currentSoundPlayTimeRemaining - deltaTime / 1_000 > 0) {
        // Wait for sound to be finished
        this.currentSoundPlayTimeRemaining -= deltaTime / 1_000;
      } else {
        // Sound finishes in this cycle
        if (FwsAuralsList[this.currentSoundPlaying].localVarName) {
          SimVar.SetSimVarValue(
            `L:${FwsAuralsList[this.currentSoundPlaying].localVarName}`,
            SimVarValueType.Bool,
            false,
          );
        }
        this.currentSoundPlaying = null;
        this.currentSoundPlayTimeRemaining = 0;
      }

      // Interrupt if sound with higher category is present in queue and current sound is continuous
      let shouldInterrupt = false;
      let rescheduleSound: keyof typeof FwsAuralsList | null = null;
      this.soundQueue.forEach((sk) => {
        const s = FwsAuralsList[sk];
        if (
          s &&
          this.currentSoundPlaying &&
          FwsAuralsList[this.currentSoundPlaying]?.continuous &&
          s.type > FwsAuralsList[this.currentSoundPlaying].type
        ) {
          shouldInterrupt = true;
        }
      });

      if (shouldInterrupt) {
        if (this.currentSoundPlaying && FwsAuralsList[this.currentSoundPlaying]?.continuous) {
          rescheduleSound = this.currentSoundPlaying;
          this.stopCurrentSound();
          if (rescheduleSound) {
            this.enqueueSound(rescheduleSound);
          }
        }
      }
    } else {
      // Play next sound
      this.selectAndPlayMostImportantSound();
    }
  }
}
