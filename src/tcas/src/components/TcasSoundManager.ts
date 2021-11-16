/* eslint-disable no-underscore-dangle */
import { TcasComponent } from '@tcas/lib/TcasComponent';
import { RaSound } from '@tcas/lib/TcasConstants';

// TODO: Turn into abstract SoundManager singleton for all .ts components

class PeriodicSound {
    public timeSinceLastPlayed: number;

    constructor(
        public sound: RaSound,
        public period: number,
    ) {
        this.timeSinceLastPlayed = NaN;
    }
}

export class TcasSoundManager implements TcasComponent {
    private static _instance?: TcasSoundManager;

    public static get instance(): TcasSoundManager {
        if (!this._instance) {
            this._instance = new TcasSoundManager();
        }
        return this._instance;
    }

    private periodicList: PeriodicSound[];

    private soundQueue: RaSound[];

    private playingSound: RaSound | null;

    private playingSoundRemaining: number;

    constructor() {
        this.periodicList = [];
        this.soundQueue = [];

        this.playingSound = null;
        this.playingSoundRemaining = NaN;
    }

    init(): void {
        // do nothing
    }

    update(deltaTime: number): void {
        if (this.playingSoundRemaining <= 0) {
            this.playingSound = null;
            this.playingSoundRemaining = NaN;
        } else if (this.playingSoundRemaining > 0) {
            this.playingSoundRemaining -= deltaTime / 1000;
        }

        if (this.playingSound === null && this.soundQueue.length > 0) {
            const _sound: RaSound = this.soundQueue.shift();
            this.tryPlaySound(_sound);
        }

        this.periodicList.forEach((element: PeriodicSound) => {
            if (Number.isNaN(element.timeSinceLastPlayed) || element.timeSinceLastPlayed >= element.period) {
                if (this.tryPlaySound(element.sound)) {
                    element.timeSinceLastPlayed = 0;
                }
            } else {
                element.timeSinceLastPlayed += deltaTime / 1000;
            }
        });
    }

    addPeriodicSound(sound: RaSound, period: number = NaN) {
        if (!sound) {
            return;
        }

        let useLengthForPeriod: boolean = false;
        if (period < sound.length) {
            console.error("TcasSoundManager ERROR: Sound period can't be smaller than sound length. Using sound length instead.");
            useLengthForPeriod = true;
        }

        let found: boolean = false;
        this.periodicList.forEach((element: PeriodicSound) => {
            if (element.sound.name === sound.name) {
                found = true;
            }
        });

        if (!found) {
            this.periodicList.push(new PeriodicSound(sound, useLengthForPeriod ? sound.length : period));
        }
    }

    removePeriodicSound(sound: RaSound) {
        if (!sound) {
            return;
        }

        for (let i = 0; i < this.periodicList.length; i++) {
            if (this.periodicList[i].sound.name === sound.name) {
                this.periodicList.splice(i, 1);
            }
        }
    }

    tryPlaySound(sound: RaSound, retry: boolean = false, repeatOnce: boolean = false): boolean | null {
        if (this.playingSound === null) {
            this.playingSound = sound;
            this.playingSoundRemaining = sound.length;
            console.log('SOUND: playing ', sound);
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
}
