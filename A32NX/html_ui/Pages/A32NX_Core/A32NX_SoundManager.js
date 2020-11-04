class PeriodicSound {
    constructor(name, period) {
        this.sound = name;
        this.period = period;
        this.timeSinceLastPlayed = NaN;
    }
}

class A32NX_SoundManager {
    constructor() {
        this.soundList = {
            pull_up: {
                name: "aural_pull_up",
                length: 1
            },
            sink_rate: {
                name: "aural_sink_rate",
                length: 1
            },
            dont_sink:{
                name: "aural_dont_sink",
                length: 1
            },
            too_low_gear:{
                name: "aural_too_low_gear",
                length: 1.3
            },
            too_low_flaps:{
                name: "aural_too_low_flaps",
                length: 1.3
            },
            too_low_terrain: {
                name: "aural_too_low_terrain",
                length: 1.3
            },
            minimums: {
                name: "aural_minimumnew",
                length: 0.67
            },
            hundred_above: {
                name: "aural_100above",
                length: 0.72
            }
        };

        this.periodicList = [];

        this.playingSound = null;
        this.playingSoundRemaining = NaN;
    }

    addPeriodicSound(sound, period = NaN) {
        if (period < sound.length) {
            console.log("A32NXSoundManager ERROR: Sound period can't be smaller than sound length.");
            return;
        }

        let found = false;
        this.periodicList.forEach((element) => {
            if (element.name === sound.name) {
                found = true;
            }
        });

        if (!found) {
            this.periodicList.push(new PeriodicSound(sound, period));
        }
    }

    removePeriodicSound(sound) {
        for (let i = 0; i < this.periodicList.length; i++) {
            if (this.periodicList[i].sound.name === sound.name) {
                this.periodicList.splice(i, 1);
            }
        }
    }

    tryPlaySound(sound) {
        if (this.playingSound === null) {
            this.playingSound = sound;
            this.playingSoundRemaining = sound.length;

            Coherent.call("PLAY_INSTRUMENT_SOUND", sound.name);
        }
    }

    update(deltaTime, _core) {
        if (this.playingSoundRemaining <= 0) {
            this.playingSound = null;
            this.playingSoundRemaining = NaN;
        } else if (this.playingSoundRemaining > 0) {
            this.playingSoundRemaining -= deltaTime / 1000;
        }

        this.periodicList.forEach((element) => {
            if (isNaN(element.timeSinceLastPlayed) || element.timeSinceLastPlayed >= element.period) {
                this.tryPlaySound(element.sound);
                element.timeSinceLastPlayed = 0;
            } else {
                element.timeSinceLastPlayed += deltaTime / 1000;
            }
        });
    }
}