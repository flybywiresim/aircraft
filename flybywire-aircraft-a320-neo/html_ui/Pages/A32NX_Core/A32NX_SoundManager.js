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
        this.soundQueue = [];

        this.playingSound = null;
        this.playingSoundRemaining = NaN;
    }

    addPeriodicSound(sound, period = NaN) {
        if (!sound) {
            return;
        }

        let useLengthForPeriod = false;
        if (period < sound.length) {
            console.error("A32NXSoundManager ERROR: Sound period can't be smaller than sound length. Using sound length instead.");
            useLengthForPeriod = true;
        }

        let found = false;
        this.periodicList.forEach((element) => {
            if (element.name === sound.name) {
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
            console.log("SOUND: playing ", sound);
            Coherent.call("PLAY_INSTRUMENT_SOUND", sound.name).catch(console.error);
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
    }

    update(deltaTime, _core) {
        if (this.playingSoundRemaining <= 0) {
            this.playingSound = null;
            this.playingSoundRemaining = NaN;
        } else if (this.playingSoundRemaining > 0) {
            this.playingSoundRemaining -= deltaTime / 1000;
        }

        if (this.playingSound === null && this.soundQueue.length > 0) {
            const _sound = this.soundQueue.shift();
            this.tryPlaySound(_sound);
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
        name: "aural_pullup_new",
        length: 0.9
    },
    sink_rate: {
        name: "aural_sink_rate_new",
        length: 0.9
    },
    dont_sink:{
        name: "aural_dontsink_new",
        length: 0.9
    },
    too_low_gear:{
        name: "aural_too_low_gear",
        length: 0.8
    },
    too_low_flaps:{
        name: "aural_too_low_flaps",
        length: 0.8
    },
    too_low_terrain: {
        name: "aural_too_low_terrain",
        length: 0.9
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
        name: "new_retard",
        length: 0.9
    },
    alt_2500: {
        name: "new_2500",
        length: 1.1
    },
    alt_1000: {
        name: "new_1000",
        length: 0.9
    },
    alt_500: {
        name: "new_500",
        length: 0.6
    },
    alt_400: {
        name: "new_400",
        length: 0.6
    },
    alt_300: {
        name: "new_300",
        length: 0.6
    },
    alt_200: {
        name: "new_200",
        length: 0.6
    },
    alt_100: {
        name: "new_100",
        length: 0.6
    },
    alt_50: {
        name: "new_50",
        length: 0.4
    },
    alt_40: {
        name: "new_40",
        length: 0.4
    },
    alt_30: {
        name: "new_30",
        length: 0.4
    },
    alt_20: {
        name: "new_20",
        length: 0.4
    },
    alt_10: {
        name: "new_10",
        length: 0.3
    },
    alt_5: {
        name: "new_5",
        length: 0.3
    },
    climb_climb: {
        name: "climb_climb",
        length: 1.6
    },
    climb_crossing_climb: {
        name: "climb_crossing_climb",
        length: 1.7
    },
    increase_climb: {
        name: "increase_climb",
        length: 1.2
    },
    climb_climb_now: {
        name: "climb_climb_now",
        length: 1.9
    },
    clear_of_conflict: {
        name: "clear_of_conflict",
        length: 1.5
    },
    descend_descend: {
        name: "descend_descend",
        length: 2.1
    },
    descend_crossing_descend: {
        name: "descend_crossing_descend",
        length: 1.9
    },
    increase_descent: {
        name: "increase_descent",
        length: 1.3
    },
    descend_descend_now: {
        name: "descend_descend_now",
        length: 2.2
    },
    monitor_vs: {
        name: "monitor_vs",
        length: 1.7
    },
    maint_vs_maint: {
        name: "maint_vs_maint",
        length: 3.2
    },
    maint_vs_crossing_maint: {
        name: "maint_vs_crossing_maint",
        length: 3.2
    },
    level_off_level_off: {
        name: "level_off_level_off",
        length: 2.3
    },
    traffic_traffic: {
        name: "traffic_traffic",
        length: 1.5
    }
};
