export interface SoundDefinition {
  name: string;
  length: number;
}

class PeriodicSound {
  public timeSinceLastPlayed = NaN;

  constructor(
    public sound: SoundDefinition,
    public period: number,
  ) {}
}

export class A32NX_SoundManager {
  private periodicList: PeriodicSound[] = [];
  private soundQueue: SoundDefinition[] = [];

  private playingSound = null;
  private playingSoundRemaining = NaN;

  addPeriodicSound(sound, period = NaN) {
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

  removePeriodicSound(sound) {
    if (!sound) {
      return;
    }

    for (let i = 0; i < this.periodicList.length; i++) {
      if (this.periodicList[i].sound.name === sound.name) {
        this.periodicList.splice(i, 1);
      }
    }
  }

  tryPlaySound(sound, retry = false, repeatOnce = false) {
    if (this.playingSound === null) {
      this.playingSound = sound;
      this.playingSoundRemaining = sound.length;

      Coherent.call('PLAY_INSTRUMENT_SOUND', sound.name).catch(console.error);
      if (repeatOnce) {
        this.soundQueue.push(sound);
      }
      return true;
    } else if (retry) {
      this.soundQueue.push(sound);
      if (repeatOnce) {
        this.soundQueue.push(sound);
      }
      return false;
    }
    return false;
  }

  update(deltaTime: number) {
    if (this.playingSoundRemaining <= 0) {
      this.playingSound = null;
      this.playingSoundRemaining = NaN;
    } else if (this.playingSoundRemaining > 0) {
      this.playingSoundRemaining -= deltaTime / 1000;
    }

    this.periodicList.forEach((element) => {
      if (isNaN(element.timeSinceLastPlayed) || element.timeSinceLastPlayed >= element.period) {
        if (this.tryPlaySound(element.sound)) {
          element.timeSinceLastPlayed = 0;
        }
      } else {
        element.timeSinceLastPlayed += deltaTime / 1000;
      }
    });
  }
}

// many lengths are approximate until we can get them accuratly (when boris re-makes them and we have the sources)
export const soundList: Record<string, SoundDefinition> = {
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
  alt_50: {
    name: 'new_50',
    length: 0.4,
  },
  alt_40: {
    name: 'new_40',
    length: 0.4,
  },
  alt_30: {
    name: 'new_30',
    length: 0.4,
  },
  alt_20: {
    name: 'new_20',
    length: 0.4,
  },
  alt_10: {
    name: 'new_10',
    length: 0.3,
  },
  alt_5: {
    name: 'new_5',
    length: 0.3,
  },
};
