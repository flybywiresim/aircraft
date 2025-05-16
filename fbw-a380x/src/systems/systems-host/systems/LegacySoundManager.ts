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
};
