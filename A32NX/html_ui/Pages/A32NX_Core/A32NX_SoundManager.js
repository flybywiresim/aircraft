class PeriodicSound {
    constructor(sound, period) {
        this.sound = sound;
        this.period = period;
        this.timeSinceLastPlayed = NaN;
    }
}

class A32NX_SoundManager {
    constructor() {
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
            return true;
        }
        return false;
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
const soundList = {
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
    },
    retard: {
        name: "aural_retard",
        length: 0.9
    },
    alt_2500: {
        name: "aural_2500ft",
        length: 1.1
    },
    alt_1000: {
        name: "aural_1000ft",
        length: 0.9
    },
    alt_500: {
        name: "aural_500ft",
        length: 0.6
    },
    alt_400: {
        name: "aural_400ft",
        length: 0.6
    },
    alt_300: {
        name: "aural_300ft",
        length: 0.6
    },
    alt_200: {
        name: "aural_200ft",
        length: 0.6
    },
    alt_100: {
        name: "aural_100ft",
        length: 0.6
    },
    alt_50: {
        name: "aural_50ft",
        length: 0.4
    },
    alt_40: {
        name: "aural_40ft",
        length: 0.4
    },
    alt_30: {
        name: "aural_30ft",
        length: 0.4
    },
    alt_20: {
        name: "aural_20ft",
        length: 0.4
    },
    alt_10: {
        name: "aural_10ft",
        length: 0.3
    },
    alt_5: {
        name: "aural_5ft",
        length: 0.3
    }
};