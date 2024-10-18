import { UpdateThrottler } from '@flybywiresim/fbw-sdk';

class PeriodicSound {
  timeSinceLastPlayed: number;

  constructor(
    public sound: LegacySound,
    public period: number,
  ) {
    this.sound = sound;
    this.period = period;
    this.timeSinceLastPlayed = NaN;
  }
}

export class LegacySoundManager {
  private updateThrottler = new UpdateThrottler(50);

  periodicList: PeriodicSound[];

  soundQueue: LegacySound[];

  playingSound: LegacySound;

  playingSoundRemaining: number;

  constructor() {
    this.periodicList = [];

    this.playingSound = null;
    this.playingSoundRemaining = NaN;
  }

  addPeriodicSound(sound: LegacySound, period = NaN) {
    if (!sound) {
      return;
    }

    let useLengthForPeriod = false;
    if (period < sound.length) {
      console.error(
        "A32NXSoundManager ERROR: Sound period can't be smaller than sound length. Using sound length instead.",
      );
      useLengthForPeriod = true;
    }

    let found = false;
    this.periodicList.forEach((element) => {
      if (element.sound.name === sound.name) {
        found = true;
      }
    });

    if (!found) {
      this.periodicList.push(new PeriodicSound(sound, useLengthForPeriod ? sound.length : period));
    }
  }

  removePeriodicSound(sound: LegacySound) {
    if (!sound) {
      return;
    }

    for (let i = 0; i < this.periodicList.length; i++) {
      if (this.periodicList[i].sound.name === sound.name) {
        this.periodicList.splice(i, 1);
      }
    }
  }

  tryPlaySound(sound: LegacySound, retry = false, repeatOnce = false) {
    if (this.playingSound === null) {
      this.playingSound = sound;
      this.playingSoundRemaining = sound.length;

      Coherent.call('PLAY_INSTRUMENT_SOUND', sound.name).catch(console.error);
      if (repeatOnce) {
        this.soundQueue.push(sound);
      }
      return true;
    }
    if (retry) {
      this.soundQueue.push(sound);
      if (repeatOnce) {
        this.soundQueue.push(sound);
      }
      return false;
    }
    return false;
  }

  update(deltaTime: number) {
    const throttledT = this.updateThrottler.canUpdate(deltaTime);

    if (throttledT <= 0) {
      return;
    }

    if (this.playingSoundRemaining <= 0) {
      this.playingSound = null;
      this.playingSoundRemaining = NaN;
    } else if (this.playingSoundRemaining > 0) {
      this.playingSoundRemaining -= throttledT / 1000;
    }

    this.periodicList.forEach((element) => {
      if (Number.isNaN(element.timeSinceLastPlayed) || element.timeSinceLastPlayed >= element.period) {
        if (this.tryPlaySound(element.sound)) {
          element.timeSinceLastPlayed = 0;
        }
      } else {
        element.timeSinceLastPlayed += throttledT / 1000;
      }
    });
  }
}

// many lengths are approximate until we can get them accuratly (when boris re-makes them and we have the sources)
interface LegacySound {
  name: string;
  length: number;
}

export const soundList: Record<string, LegacySound> = {
  pull_up: {
    name: 'aural_pullup_new',
    length: 0.9,
  },
  sink_rate: {
    name: 'aural_sink_rate_new',
    length: 0.9,
  },
  dont_sink: {
    name: 'aural_dontsink_new',
    length: 0.9,
  },
  too_low_gear: {
    name: 'aural_too_low_gear',
    length: 0.8,
  },
  too_low_flaps: {
    name: 'aural_too_low_flaps',
    length: 0.8,
  },
  too_low_terrain: {
    name: 'aural_too_low_terrain',
    length: 0.9,
  },
  minimums: {
    name: 'aural_minimumnew',
    length: 0.67,
  },
  hundred_above: {
    name: 'aural_100above',
    length: 0.72,
  },
  retard: {
    name: 'new_retard',
    length: 0.9,
  },
  alt_2500: {
    name: 'new_2500',
    length: 1.1,
  },
  alt_2500b: {
    name: 'new_2_500',
    length: 1.047,
  },
  alt_2000: {
    name: 'new_2000',
    length: 0.72,
  },
  alt_1000: {
    name: 'new_1000',
    length: 0.9,
  },
  alt_500: {
    name: 'new_500',
    length: 0.6,
  },
  alt_400: {
    name: 'new_400',
    length: 0.6,
  },
  alt_300: {
    name: 'new_300',
    length: 0.6,
  },
  alt_200: {
    name: 'new_200',
    length: 0.6,
  },
  alt_100: {
    name: 'new_100',
    length: 0.6,
  },
  alt_90: {
    name: '90_380',
    length: 0.4,
  },
  alt_80: {
    name: '80_380',
    length: 0.4,
  },
  alt_70: {
    name: '70_380',
    length: 0.4,
  },
  alt_60: {
    name: '60_380',
    length: 0.4,
  },
  alt_50: {
    name: '50_380',
    length: 0.4,
  },
  alt_40: {
    name: '40_380',
    length: 0.4,
  },
  alt_30: {
    name: '30_380',
    length: 0.4,
  },
  alt_20: {
    name: '20_380',
    length: 0.4,
  },
  alt_10: {
    name: '10_380',
    length: 0.3,
  },
  alt_5: {
    name: '5_380',
    length: 0.3,
  },
};
