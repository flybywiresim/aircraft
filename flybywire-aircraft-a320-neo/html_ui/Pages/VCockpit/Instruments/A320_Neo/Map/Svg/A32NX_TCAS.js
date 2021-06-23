const CONSTANTS = {
    MIN_VS: -6000,
    MAX_VS: 6000,
    INHIBIT_CLB_RA: 39000, // for all climb RA's
    INHIBIT_INC_DES_RA_AGL: 1450, // for increase descent RA's
    INHIBIT_ALL_DES_RA_AGL: 1200, // 1200 takeoff, 1000 approach
    INHIBIT_ALL_RA: 1000, // 1100 in climb, 900 in descent
    REALLY_BIG_NUMBER: 1000000
};

const taraCallouts = {
    climb: "climb_climb",
    climb_cross: "climb_crossing_climb",
    climb_increase: "increase_climb",
    climb_now: "climb_climb_now",
    clear_of_conflict: "clear_of_conflict",
    descend: "descend_descend",
    descend_cross: "descend_crossing_descend",
    descend_increase: "increase_descent",
    descend_now: "descend_descend_now",
    monitor_vs: "monitor_vs",
    maintain_vs: "maint_vs_maint",
    maintain_vs_cross: "maint_vs_crossing_maint",
    level_off: "level_off_level_off",
    traffic: "traffic_traffic"
};

const raSense = {
    initial: 0,
    level: 1,
    up: 2,
    down: 3
};

const raStrength = {
    initial: 0,
    level_off: 1,
    change: 2,
    change_crossing: 3,
    maintain_change: 4,
    maintain_change_crossing: 5,
    level_off: 6,
    reverse_change: 7,
    increase_change: 8,
    preventative: 9,
    removed: 10
};

const raType = {
    corrective: 0,
    preventative: 1
};

const tcasState = {
    none: 0,
    TA: 1,
    RA: 2
};

/**
 *  callout: warning annunciation to be made
 *  sense: up (climb) or down (descend)
 *  type: corrective or preventative
 *
 */
const raVariants = {
    // PREVENTIVE RA's
    // TODO: don't display green band as green on PFD for preventative
    monitor_vs_level: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.level,
        type: raType.preventative,
        vs: {
            condition: [-100, 100],
            green: [-100, 100],
            red: [
                [CONSTANTS.MIN_VS, -100],
                [100, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_climb_0: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.up,
        type: raType.preventative,
        vs: {
            condition: [0, CONSTANTS.MAX_VS],
            green: [0, CONSTANTS.MAX_VS],
            red: [
                [CONSTANTS.MIN_VS, 0]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_climb_500: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.up,
        type: raType.preventative,
        vs: {
            condition: [-500, CONSTANTS.MAX_VS],
            green: [-500, CONSTANTS.MAX_VS],
            red: [
                [CONSTANTS.MIN_VS, -500]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_climb_1000: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.up,
        type: raType.preventative,
        vs: {
            condition: [-1000, CONSTANTS.MAX_VS],
            green: [-1000, CONSTANTS.MAX_VS],
            red: [
                [CONSTANTS.MIN_VS, -1000]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_climb_2000: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.up,
        type: raType.preventative,
        vs: {
            condition: [-2000, CONSTANTS.MAX_VS],
            green: [-2000, CONSTANTS.MAX_VS],
            red: [
                [CONSTANTS.MIN_VS, -2000]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },

    monitor_vs_descend_0: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.down,
        type: raType.preventative,
        vs: {
            condition: [CONSTANTS.MIN_VS, 0],
            green: [CONSTANTS.MIN_VS, 0],
            red: [
                [0, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_descend_500: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.down,
        type: raType.preventative,
        vs: {
            condition: [CONSTANTS.MIN_VS, 500],
            green: [CONSTANTS.MIN_VS, 500],
            red: [
                [500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_descend_1000: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.down,
        type: raType.preventative,
        vs: {
            condition: [CONSTANTS.MIN_VS, 1000],
            green: [CONSTANTS.MIN_VS, 1000],
            red: [
                [1000, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    monitor_vs_descend_2000: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.down,
        type: raType.preventative,
        vs: {
            condition: [CONSTANTS.MIN_VS, 2000],
            green: [CONSTANTS.MIN_VS, 2000],
            red: [
                [2000, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    // CORRECTIVE RA's
    // CLIMB
    climb: {
        callout: taraCallouts.climb,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [1500, 2000],
            red: [
                [CONSTANTS.MIN_VS, 1500]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    climb_cross: {
        callout: taraCallouts.climb_cross,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [1500, 2000],
            red: [
                [CONSTANTS.MIN_VS, 1500]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: true,
            forbids_crossing: false
        }
    },
    climb_increase: {
        callout: taraCallouts.climb_increase,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [500, CONSTANTS.MAX_VS],
            green: [2500, 4400],
            red: [
                [CONSTANTS.MIN_VS, 2500]
            ]
        },
        conditions: {
            can_be_initial: false,
            can_be_followup: true,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    // CORRECTIVE RA's
    // DESCEND
    descend: {
        callout: taraCallouts.descend,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [-2000, -1500],
            red: [
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    descend_cross: {
        callout: taraCallouts.descend_cross,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [-2000, -1500],
            red: [
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: true,
            forbids_crossing: false
        }
    },
    descend_increase: {
        callout: taraCallouts.descend_increase,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, -500],
            green: [-4400, -2500],
            red: [
                [-2500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: false,
            can_be_followup: true,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: false
        }
    },
    // CORRECTIVE RA's
    // LEVEL OFF
    level_off_250_both: {
        callout: taraCallouts.level_off,
        sense: raSense.level,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [-250, 250],
            red: [
                [CONSTANTS.MIN_VS, -250],
                [250, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    level_off_300_below: {
        callout: taraCallouts.level_off,
        sense: raSense.level,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [-300, 0],
            red: [
                [CONSTANTS.MIN_VS, -300],
                [0, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    level_off_300_above: {
        callout: taraCallouts.level_off,
        sense: raSense.level,
        type: raType.corrective,
        vs: {
            condition: [CONSTANTS.MIN_VS, CONSTANTS.MAX_VS],
            green: [0, 300],
            red: [
                [CONSTANTS.MIN_VS, 0],
                [300, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: true,
            can_be_reversed: true,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    // CORRECTIVE RA's
    // MAINTAIN VS, CLIMB
    climb_maintain_vs: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [1500, 2000],
            green: [1500, 2000],
            red: [
                [CONSTANTS.MIN_VS, 1500],
                [2000, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    climb_maintain_vs_crossing: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [1500, 2000],
            green: [1500, 2000],
            red: [
                [CONSTANTS.MIN_VS, 1500],
                [2000, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: true,
            forbids_crossing: false
        }
    },
    climb_maintain_vs_steep: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [1500, 4400],
            green: [1500, 4400],
            red: [
                [CONSTANTS.MIN_VS, 1500],
                [4400, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    climb_maintain_vs_steep_crossing: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.up,
        type: raType.corrective,
        vs: {
            condition: [1500, 4400],
            green: [1500, 4400],
            red: [
                [CONSTANTS.MIN_VS, 1500],
                [4400, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: true,
            forbids_crossing: false
        }
    },
    // CORRECTIVE RA's
    // MAINTAIN VS, DESCEND
    descend_maintain_vs: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [-2000, -1500],
            green: [-2000, -1500],
            red: [
                [CONSTANTS.MIN_VS, -2000],
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    descend_maintain_vs_crossing: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [-2000, -1500],
            green: [-2000, -1500],
            red: [
                [CONSTANTS.MIN_VS, -2000],
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: true,
            forbids_crossing: false
        }
    },
    descend_maintain_vs_steep: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [-4400, -1500],
            green: [-4400, -1500],
            red: [
                [CONSTANTS.MIN_VS, -4400],
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: false,
            forbids_crossing: true
        }
    },
    descend_maintain_vs_steep_crossing: {
        callout: taraCallouts.maintain_vs,
        sense: raSense.down,
        type: raType.corrective,
        vs: {
            condition: [-4400, -1500],
            green: [-4400, -1500],
            red: [
                [CONSTANTS.MIN_VS, -4400],
                [-1500, CONSTANTS.MAX_VS]
            ]
        },
        conditions: {
            can_be_initial: true,
            can_be_followup: false,
            can_be_reversed: false,
            requires_crossing: true,
            forbids_crossing: false
        }
    }
};

class A32NX_TCAS_Manager {
    constructor() {
        console.log("TCAS: in constructor beginning");
        this.TrafficUpdateTimer = 0.2;
        this.TrafficAircraft = [];
        this.sensitivityLevel = 1;

        // Holds an object dictating the active RA's state, if there is an RA
        this.activeRA = null;

        // Aircraft's vertical speed at time of initial RA
        this.vsAtInitialRA = null;

        // Overall TCAS state for callout latching (None, TA, or RA)
        this.advisoryState = tcasState.none;

        // Timekeeping
        this.secondsSinceLastTA = 100;
        this.secondsSinceLastRA = 100;
        this.secondsSinceStartOfRA = 0;
        console.log("TCAS: in constructor ending");
    }

    // This is called from the MFD JS file, because the MapInstrument doesn't have a deltaTime
    update(_deltaTime) {
        console.log("TCAS: in update beginning");
        const TCASSwitchPos = SimVar.GetSimVarValue("L:A32NX_SWITCH_TCAS_Position", "number");
        const TransponderStatus = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        const TCASThreatSetting = SimVar.GetSimVarValue("L:A32NX_SWITCH_TCAS_Traffic_Position", "number");
        const ALT_RPTG = 0; // haven't found the simvar for that

        // if tcas is off, do not update and wipe the traffic list
        if (TCASSwitchPos === 0 || TransponderStatus === 1) {
            this.TrafficAircraft = [];
            return;
        }

        // TODO Add more TA only conditions here (i.e GPWS active, Windshear warning active, stall)
        const TCASMode = TCASSwitchPos;

        // update our own position and velocities
        const altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        const radioAltitude = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet");
        const groundAlt = altitude - radioAltitude; // altitude of the terrain

        const vertSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

        this.updateSensitivityLevel(altitude, radioAltitude, TCASMode);

        const TaRaTau = this.getTaRaTau(this.sensitivityLevel);
        const TaRaDMOD = this.getTaRaDMOD(this.sensitivityLevel);
        const TaRaZTHR = this.getTaRaZTHR(this.sensitivityLevel);
        const ALIM = this.getALIM(this.sensitivityLevel);
        const TVTHR = this.getTVTHR(this.sensitivityLevel);

        // update traffic aircraft
        this.TrafficUpdateTimer += _deltaTime / 1000;

        //Update every 0.1 seconds. Also need to use this timer as deltatime inside this if block
        if (this.TrafficUpdateTimer >= 0.1) {
            // using this to get around the fact that the coherent call is a promise, and likely executed later(not sure). this results in this.TrafficUpdateTimer
            // to be 0, which is kinda bad
            const localDeltaTime = this.TrafficUpdateTimer;

            // gets traffic. obj is an array, which contains the NPC aircraft data.
            // The aircraft data is: uID, name, latitude in degrees, longitude in degrees, altitude in meters, heading in degrees.
            Coherent.call("GET_AIR_TRAFFIC").then((obj) => {
                for (const aircraft of this.TrafficAircraft) {
                    aircraft.alive = false;
                }
                for (const traffic of obj) {
                    let aircraft = this.TrafficAircraft.find(p => {
                        return p.ID === traffic.uId.toFixed(0);
                    });
                    if (!aircraft) {
                        aircraft = new A32NX_TCAS_Airplane(traffic.uId.toFixed(0), traffic.lat, traffic.lon, traffic.alt * 3.281, traffic.heading, lat, lon, altitude);
                        this.TrafficAircraft.push(aircraft);
                    } else {
                        aircraft.update(localDeltaTime, traffic.lat, traffic.lon, traffic.alt * 3.281, traffic.heading, lat, lon, altitude, vertSpeed, TaRaDMOD);
                    }
                    aircraft.alive = true;
                }

                for (let i = 0; i < this.TrafficAircraft.length; i++) {
                    if (this.TrafficAircraft[i].alive === false) {
                        this.TrafficAircraft.splice(i, 1);
                        i--;
                    }
                }

            });

            this.TrafficUpdateTimer = 0;
        }

        // Check for collisions
        for (const traffic of this.TrafficAircraft) {
            // horzontal distance in nautical miles
            const horizontalDistance = Avionics.Utils.computeDistance(new LatLong(traffic.lat, traffic.lon), new LatLong(lat, lon));

            traffic.updateIsDisplayed(TCASThreatSetting);

            // check if aircraft is in detection range
            // skip if not
            if (horizontalDistance > 35 && Math.abs(traffic.relativeAlt) > 9900) {
                traffic.isDisplayed = false;
                traffic.TaTAU = Infinity;
                traffic.RaTAU = Infinity;
                continue;
            }

            // check if traffic is on ground. Mode-s transponders would transmit that information themselves, but since Asobo doesn't provide that
            // information, we need to rely on the fallback method
            // this also leads to problems above 1750 ft (the threshold for ground detection), since the aircraft on ground are then shown again.
            if (altitude < 1750 && traffic.alt < groundAlt + 360) {
                traffic.TaTAU = Infinity;
                traffic.RaTAU = Infinity;
                traffic.verticalTAU = Infinity;
                traffic.onGround = true;
                continue;
            } else {
                traffic.onGround = false;
            }

            let verticalIntrusionLevel = 0;
            let rangeIntrusionLevel = 0;

            if (traffic.RaTAU < TaRaTau[1] || traffic.slantDistance < TaRaDMOD[1]) {
                rangeIntrusionLevel = 3;
            } else if (traffic.TaTAU < TaRaTau[0] || traffic.slantDistance < TaRaDMOD[0]) {
                // console.log("TCAS: RANGE INTRUSION TA!");
                rangeIntrusionLevel = 2;
            } else if (horizontalDistance < 6) {
                // console.log("TAU: ", traffic.TaTAU, "; Slant distance: ", traffic.slantDistance);
                // console.log("Desired TAU: ", TaRaTau[0], "; Desired DMOD: ", TaRaDMOD[0]);
                rangeIntrusionLevel = 1;
            } else {
                rangeIntrusionLevel = 0;
            }

            if (traffic.verticalTAU < TaRaTau[1] || Math.abs(traffic.relativeAlt) < TaRaZTHR[1]) {
                verticalIntrusionLevel = 3;
            } else if (traffic.verticalTAU < TaRaTau[0] || Math.abs(traffic.relativeAlt) < TaRaZTHR[0]) {
                // console.log("TCAS: VERTICAL INTRUSION TA!");
                verticalIntrusionLevel = 2;
            } else if (Math.abs(traffic.relativeAlt) < 1200) {
                verticalIntrusionLevel = 1;
            } else {
                verticalIntrusionLevel = 0;
            }

            traffic.intrusionLevel = Math.min(verticalIntrusionLevel, rangeIntrusionLevel);
        }

        // console.log("TCAS: in update near end");
        const ra = this.raLogic(_deltaTime, vertSpeed, altitude, radioAltitude, ALIM, false); // Placeholder value for onlyPreventative
        this.updateAdvisoryState(_deltaTime, ra);
        // console.log("TCAS: in update end");
    }

    /**
     * Handles updating this.advisoryState, elapsed timers, and playing sounds
     */
    updateAdvisoryState(_deltaTime, _ra) {
        const taThreatCount = this.TrafficAircraft.reduce((acc, aircraft) => {
            return acc + (aircraft.intrusionLevel === 2 ? 1 : 0);
        }, 0);
        const raThreatCount = this.TrafficAircraft.reduce((acc, aircraft) => {
            return acc + (aircraft.intrusionLevel === 3 ? 1 : 0);
        }, 0);

        switch (this.advisoryState) {
            case tcasState.TA:
                if (raThreatCount > 0) {
                    this.advisoryState = tcasState.RA;
                    this.secondsSinceStartOfRA = 0;
                    console.log("TCAS: TA UPGRADED TO RA");
                    console.log("_ra:", _ra);
                } else if (taThreatCount === 0) {
                    this.advisoryState = tcasState.none;
                    this.secondsSinceLastTA = 0;
                    console.log("TCAS: TA RESOLVED");
                }
                break;
            case tcasState.RA:
                if (raThreatCount === 0) {
                    this.secondsSinceLastRA = 0;
                    if (taThreatCount > 0) {
                        this.secondsSinceLastTA = 0;
                        this.advisoryState = tcasState.TA;
                    } else {
                        this.advisoryState = tcasState.none;
                    }
                    console.log("TCAS: CLEAR OF CONFLICT");
                    Coherent.call("PLAY_INSTRUMENT_SOUND", "clear_of_conflict");
                    this.activeRA = null;
                } else {
                    this.secondsSinceStartOfRA += _deltaTime / 1000;
                }
                break;
            default:
                if (raThreatCount > 0) {
                    this.advisoryState = tcasState.RA;
                    this.secondsSinceStartOfRA = 0;
                } else {
                    if (taThreatCount > 0) {
                        this.advisoryState = tcasState.TA;
                        console.log("TCAS: TA GENERATED");
                        if (this.secondsSinceLastTA >= 5) {
                            console.log("TCAS: TA GENERATED 2");
                            Coherent.call("PLAY_INSTRUMENT_SOUND", "traffic_traffic");
                        }
                    } else {
                        if (this.secondsSinceLastTA < 10) {
                            this.secondsSinceLastTA += _deltaTime / 1000;
                        }
                    }

                    if (this.secondsSinceLastRA < 10) {
                        this.secondsSinceLastRA += _deltaTime / 1000;
                    }
                }
                break;
        }

        if (_ra !== null && this.advisoryState === tcasState.RA) {
            this.activeRA = _ra;
            Coherent.call("PLAY_INSTRUMENT_SOUND", this.activeRA.info.callout);
            console.log("TCAS: RA GENERATED: ", this.activeRA.info.callout);
        }
    }

    /**
     * Iterates through each RA threat (and its associated CPA data),
     * and filters out all inapplicable RA variants.
     * Then, perform computation for each applicable RA, and
     * pick one with best vertical separation and other criteria
     */
    raLogic(_deltaTime, selfVertSpeed, selfAlt, selfRadioAlt, ALIM, onlyPreventative) {
        // Get all active, valid RA threats, sorted by lowest TAU first
        const raTraffic = this.TrafficAircraft
            .filter((aircraft) => {
                return aircraft.intrusionLevel === 3 && aircraft.RaTAU != Infinity;
            })
            .sort((a, b) => {
                return a.RaTAU - b.RaTAU;
            });

        // No RA's found
        if (raTraffic.length === 0) {
            return null;
        }

        const previousRA = this.activeRA;
        const validRaVariants = Object.values(raVariants).filter((ra) => {
            const isInitial = previousRA === null ? true : false;
            const lastCallout = isInitial ? null : previousRA.info.callout;
            const lastSense = isInitial ? raSense.level_off : previousRA.info.sense;
            const lastType = isInitial ? null : previousRA.info.type;
            const isReversal = (previousRA === null) && lastSense !== ra.sense;

            // If we're below 1000 ft AGL, inhibit all RA's
            const check1000 = selfRadioAlt > CONSTANTS.INHIBIT_ALL_RA;
            // Check whether the RA variant agrees with initial or followup RA status
            const a = (isInitial && ra.conditions.can_be_initial) || (!isInitial && ra.conditions.can_be_followup);
            // Make sure our own VS falls within this RA's required initial VS
            const b = (selfVertSpeed > ra.vs.condition[0] && selfVertSpeed < ra.vs.condition[1]);
            // Make sure the RA allows reversals if needed
            const c = isReversal ? ra.conditions.can_be_reversed : true;
            // Only allow preventative RA's if requested
            const d = onlyPreventative ? ra.type === raType.preventative : true;
            // Inhibit climb RA's above service ceiling
            const e = (selfAlt >= CONSTANTS.INHIBIT_CLB_RA) ? ra.sense !== raSense.up : true;
            // Inhibit all descend RA's below predefined altitude
            const f = (selfRadioAlt <= CONSTANTS.INHIBIT_ALL_DES_RA_AGL) ? ra.sense !== raSense.down : true;
            // Inhibit increase descent RA's below predefined altitude
            const g = (selfRadioAlt <= CONSTANTS.INHIBIT_INC_DES_RA_AGL) ? ra.callout !== taraCallouts.descend_increase : true;
            // Proper RA weakening for increase climb & descent RA's
            const h = (lastCallout !== null && lastCallout === taraCallouts.climb_increase) ? ra.callout !== taraCallouts.climb || ra.callout !== taraCallouts.climb_cross : true;
            const i = (lastCallout !== null && lastCallout === taraCallouts.descend_increase) ? ra.callout !== taraCallouts.descend || ra.callout !== taraCallouts.descend_cross : true;
            // Inhibit level off RA's following preventive RA's
            const j = (lastType !== null && lastType === raType.preventative) ? ra.callout !== taraCallouts.level_off : true;

            return check1000 && a && b && c && d && e && f && g && h && i && j;
        });

        const raAttempts = [];
        for (const ra of validRaVariants) {
            const isInitial = previousRA === null ? true : false;
            const lastSense = isInitial ? raSense.level_off : previousRA.info.sense;
            // Assume reaction time of 5 seconds for first RA, 2.5 seconds for follow-ups
            const delay = isInitial ? 5 : 2.5;
            // Assume acceleration of 0.25G (8.044 f/s^2) for first RA, 0.33G (10.62) for follow-ups
            const accel = isInitial ? 8.044 : 10.62;

            const attempt = {
                info: ra,
                isCrossing: false,
                isReversal: (previousRA === null && lastSense !== ra.sense),
                minSeparation: CONSTANTS.REALLY_BIG_NUMBER,
                achievesALIM: null
            };
            for (const traffic of raTraffic) {
                const verticalSep = this.calculateVerticalSeparation(ra, selfVertSpeed, selfAlt, traffic, delay, accel);
                if (verticalSep < attempt.minSeparation) {
                    attempt.minSeparation = verticalSep;
                }
                if ((ra.sense === raSense.up && selfAlt < traffic.alt)
                    || ra.sense === raSense.down && selfAlt > traffic.alt) {
                    attempt.isCrossing = true;
                }
            }

            attempt.achievesALIM = (attempt.minSeparation >= ALIM);

            // Only push attempt to raAttempts if it doesn't violate crossing rules
            if (ra.conditions.requires_crossing && !attempt.isCrossing
                || ra.conditions.forbids_crossing && attempt.isCrossing) {
                continue;
            }
            // Do not push preventive RA's which do not achieve ALIM
            if (ra.type === raType.preventative && !attempt.achievesALIM) {
                continue;
            }
            raAttempts.push(attempt);
        }

        raAttempts.sort((a, b) => {
            // If only one achieves ALIM, pick it
            if (a.achievesALIM && !b.achievesALIM) {
                return -1;
            }
            if (b.achievesALIM && !a.achievesALIM) {
                return 1;
            }

            // If neither achieve ALIM, then greatest separation
            if (!a.achievesALIM && !b.achievesALIM) {
                if (Math.max(a.minSeparation, 0) > Math.max(b.minSeparation, 0)) {
                    return -1;
                } else {
                    return 1;
                }
            }

            // Prefer non-reversals
            if (!a.isReversal && b.isReversal) {
                return -1;
            }
            if (a.isReversal && !b.isReversal) {
                return 1;
            }

            // Prefer non-crossings
            if (!a.isCrossing && b.isCrossing) {
                return -1;
            }
            if (a.isCrossing && !b.isCrossing) {
                return 1;
            }

            // TODO:
            // --- Prefer least disruptive RA's (VS change)
            // --- Prefer greatest separation (again)
            // --- Prefer preventative over corrective
            return -1;
        });

        if (raAttempts.length !== 0) {
            const ra = raAttempts[0];
            if (previousRA !== null
                && ra.info.callout === previousRA.info.callout
                && ra.info.vs.green === previousRA.info.vs.green) {
                return null;
            }
            return ra;
        }
        return null;
    }

    calculateVerticalSeparation(raVariant, selfVS, selfAlt, trafficAC, delayTime, accel) {
        const trafficAltAtCPA = trafficAC.alt + ((trafficAC.vertSpeed * 60) * trafficAC.RaTAU);
        if (raVariant.sense === raSense.up) {
            const targetVS = Math.min(...raVariant.vs.green);
            const newDelayTime = selfVS < targetVS ? Math.min(trafficAC.RaTAU, delayTime) : 0;
            return this.calculateAvoidanceManeuver(targetVS, selfVS, selfAlt, trafficAC, newDelayTime, accel) - trafficAltAtCPA;
        } else if (raVariant.sense === raSense.down) {
            const targetVS = Math.max(...raVariant.vs.green);
            const newDelayTime = selfVS > targetVS ? Math.min(trafficAC.RaTAU, delayTime) : 0;
            return trafficAltAtCPA - this.calculateAvoidanceManeuver(targetVS, selfVS, selfAlt, trafficAC, newDelayTime, accel);
        } else {
            const minTargetVS = Math.min(...raVariant.vs.green);
            const maxTargetVS = Math.max(...raVariant.vs.green);
            const minDelayTime = selfVS < minTargetVS ? Math.min(trafficAC.RaTAU, delayTime) : 0;
            const maxDelayTime = selfVS > maxTargetVS ? Math.min(trafficAC.RaTAU, delayTime) : 0;
            const minVerticalSep = this.calculateAvoidanceManeuver(minTargetVS, selfVS, selfAlt, trafficAC, minDelayTime, accel) - trafficAltAtCPA;
            const maxVerticalSep = trafficAltAtCPA - this.calculateAvoidanceManeuver(maxTargetVS, selfVS, selfAlt, trafficAC, maxDelayTime, accel);
            return Math.max(minVerticalSep, maxVerticalSep);
        }
    }

    calculateAvoidanceManeuver(targetVS, selfVS, selfAlt, trafficAC, delayTime, accel) {
        // accel must be in f/s^2
        accel = targetVS < selfVS ? -1 * accel : accel;
        const timeToAccelerate = Math.min(trafficAC.RaTAU - delayTime, ((targetVS - selfVS) * 60) / accel);
        const remainingTime = trafficAC.RaTau - (delayTime + timeToAccelerate);
        const predicted_elevation = selfAlt
                                        + Math.round(selfVS * 60) * (delayTime + timeToAccelerate)
                                        + 0.5 * accel ** timeToAccelerate
                                        + (targetVS * 60) * remainingTime;
        return predicted_elevation;
    }

    /**
     * recalculates the TCAS sensitivity level
     * TODO since TCAS v7, sensitivity level cannot decrease during an active RA
     * @param altitude {number} in feet
     * @param radioAltitude {number} in feet
     * @param TCASMode {number}
     */
    updateSensitivityLevel(altitude, radioAltitude, TCASMode) {
        if (radioAltitude < 1000 || TCASMode === 1) {
            this.sensitivityLevel = 2;
        } else if (radioAltitude <= 2350 && radioAltitude > 1000) {
            this.sensitivityLevel = 3;
        } else if (altitude <= 5000 && altitude > 2350) {
            this.sensitivityLevel = 4;
        } else if (altitude <= 10000 && altitude > 5000) {
            this.sensitivityLevel = 5;
        } else if (altitude <= 20000 && altitude > 10000) {
            this.sensitivityLevel = 6;
        } else if (altitude <= 47000 && altitude > 20000) {
            this.sensitivityLevel = 7;
        } else {
            this.sensitivityLevel = 8;
        }
    }

    /**
     * Get TA/RA minimum TAU, depending on altitude and TCAS mode
     * @param sensitivityLevel {number}
     * @returns {number[]} [TaTime (seconds), RaTime (seconds)]
     */
    getTaRaTau(sensitivityLevel) {
        if (sensitivityLevel === 2) {
            return [20, -1];
        } else if (sensitivityLevel === 3) {
            return [25, 15];
        } else if (sensitivityLevel === 4) {
            return [30, 20];
        } else if (sensitivityLevel === 5) {
            return [40, 25];
        } else if (sensitivityLevel === 6) {
            return [45, 30];
        } else if (sensitivityLevel > 6) {
            return [48, 35];
        }
    }

    /**
     * Get RA TVTHR, used if current aircraft is in level flight,
     * OR if current aircraft is climbing/descending same direction as other aircraft,
     * but at a slower rate
     * @param sensitivityLevel {number}
     * @returns {number} RaTime (seconds)
     */
    getTVTHR(sensitivityLevel) {
        if (sensitivityLevel === 2) {
            return -1;
        } else if (sensitivityLevel === 3) {
            return 15;
        } else if (sensitivityLevel === 4) {
            return 18;
        } else if (sensitivityLevel === 5) {
            return 20;
        } else if (sensitivityLevel === 6) {
            return 22;
        } else if (sensitivityLevel > 7) {
            return 25;
        }
    }

    /**
     * Get TA/RA DMOD (fixed distance at which TCAS triggers)
     * @param sensitivityLevel {number}
     * @returns {number[]} [TaDMOD (nautical miles), RaDMOD (nautical miles)]
     */
    getTaRaDMOD(sensitivityLevel) {
        if (sensitivityLevel === 2) {
            return [0.3, -1];
        } else if (sensitivityLevel === 3) {
            return [0.33, 0.2];
        } else if (sensitivityLevel === 4) {
            return [0.48, 0.35];
        } else if (sensitivityLevel === 5) {
            return [0.75, 0.55];
        } else if (sensitivityLevel === 6) {
            return [1, 0.8];
        } else if (sensitivityLevel > 6) {
            return [1.3, 1.1];
        }
    }

    /**
     * Get TA/RA altitude threshold (fixed altitude difference at which TCAS triggers)
     * @param sensitivityLevel {number}
     * @returns {number[]} [TaVertDist (feet), RaVertDist (feet)]
     */
    getTaRaZTHR(sensitivityLevel) {
        if (sensitivityLevel === 2) {
            return [850, -1];
        } else if (sensitivityLevel === 3) {
            return [850, 300];
        } else if (sensitivityLevel === 4) {
            return [850, 300];
        } else if (sensitivityLevel === 5) {
            return [850, 350];
        } else if (sensitivityLevel === 6) {
            return [850, 400];
        } else if (sensitivityLevel === 7) {
            return [850, 600];
        } else {
            return [1200, 700];
        }
    }

    /**
     * Get RA ALIM (altitude threshold used to select RA strength and direction)
     * @param sensitivityLevel {number}
     * @returns {number} RaVertDist (feet)
     */
    getALIM(sensitivityLevel) {
        if (sensitivityLevel === 2) {
            return -1;
        } else if (sensitivityLevel === 3) {
            return 300;
        } else if (sensitivityLevel === 4) {
            return 300;
        } else if (sensitivityLevel === 5) {
            return 350;
        } else if (sensitivityLevel === 6) {
            return 400;
        } else if (sensitivityLevel === 7) {
            return 600;
        } else {
            return 700;
        }
    }
}

class A32NX_TCAS_Airplane extends SvgMapElement {
    /**
     *
     * @param _ID
     * @param _lat {number} in degrees
     * @param _lon {number} in degrees
     * @param _alt {number} in feet
     * @param _heading {number} in degrees
     * @param _selfLat {number} in degrees
     * @param _selfLon {number} in degrees
     * @param _selfAlt {number} in feet
     */
    constructor(_ID, _lat, _lon, _alt, _heading, _selfLat, _selfLon, _selfAlt) {
        super();

        this.created = false;
        this.ID = _ID;
        this.name = "npc-airplane-" + this.ID;
        this.lat = _lat;
        this.lon = _lon;
        this.alt = _alt;
        this.vertSpeed = 0;
        this.onGround = false;
        this.heading = _heading;

        //relative altitude between player and this traffic, in feet
        this.relativeAlt = _alt - _selfAlt;

        // Distance to traffic aircraft in 3D space, in nautical miles
        this.slantDistance = this.computeDistance3D([_lat, _lon, _alt], [_selfLat, _selfLon, _selfAlt]);
        // rate of change of slant distance, in knots
        this.closureRate = 0;

        //0: no intrusion, 1: proximate, 2: TA, 3: RA
        this.intrusionLevel = 0;
        this.isDisplayed = false;

        // time until predicted collision
        this.TaTAU = Infinity;
        this.RaTAU = Infinity;
        // time until aircraft is on the same altitude level
        this.verticalTAU = Infinity;

        this.screenPos = new Vec2();

        this.alive = true;

        // previous dipslay type (i.e. RA, TA, vertical speed arrow etc.) to prevent frequent svg changes
        this._lastIntrusionLevel = NaN;
        this._lastVertArrowCase = NaN;
    }

    id(map) {
        return this.name + "-map-" + map.index;
    }

    /**
     *
     * @param _deltaTime {number} in seconds
     * @param newLat {number} in degrees
     * @param newLon {number} in degrees
     * @param newAlt {number} in feet
     * @param newHeading {number} in degrees
     * @param selfLat {number} in degrees
     * @param selfLon {number} in degrees
     * @param selfAlt {number} in feet
     * @param selfVertSpeed {number} in feet per minute
     */
    update(_deltaTime, newLat, newLon, newAlt, newHeading, selfLat, selfLon, selfAlt, selfVertSpeed, TaRaDMOD) {
        this.vertSpeed = (newAlt - this.alt) / _deltaTime * 60; //times 60 because deltatime is in seconds, and we need feet per minute

        const newSlantDist = this.computeDistance3D([newLat, newLon, newAlt], [selfLat, selfLon, selfAlt]);
        this.closureRate = (this.slantDistance - newSlantDist) / _deltaTime * 3600; // see above, delta time in seconds, knots is per hour.
        this.lat = newLat;
        this.lon = newLon;
        this.alt = newAlt;
        this.slantDistance = newSlantDist;
        this.heading = newHeading;
        this.relativeAlt = newAlt - selfAlt;

        const combinedVertSpeed = selfVertSpeed - this.vertSpeed;

        this.TaTAU = (this.slantDistance - TaRaDMOD[0]) / this.closureRate * 3600;
        this.RaTAU = (this.slantDistance - TaRaDMOD[1]) / this.closureRate * 3600;
        this.verticalTAU = this.relativeAlt / combinedVertSpeed * 60;

        // check if we are moving away from target. If yes, set TAUs to infinity
        if (this.RaTAU < 0) {
            this.TaTAU = Infinity;
            this.RaTAU = Infinity;
        }
        if (this.verticalTAU < 0) {
            this.verticalTAU = Infinity;
        }
    }

    /**
     * Determine if this traffic aircraft should be displayed on the ND
     * @param ThrtSetting {number}
     */
    updateIsDisplayed(ThrtSetting) {
        if (this.onGround) {
            this.isDisplayed = false;
        } else if (ThrtSetting === 0 && Math.abs(this.relativeAlt) <= 2700 && this.intrusionLevel >= 2) {
            this.isDisplayed = true;
        } else if (ThrtSetting === 1 && Math.abs(this.relativeAlt) <= 2700) {
            this.isDisplayed = true;
        } else if (ThrtSetting === 2 && this.relativeAlt <= 9900 && this.relativeAlt >= -2700) {
            this.isDisplayed = true;
        } else if (ThrtSetting === 3 && this.relativeAlt <= 2700 && this.relativeAlt >= -9900) {
            this.isDisplayed = true;
        } else {
            this.isDisplayed = false;
        }
    }

    createDraw(map) {
        this.created = true;
        const template = document.getElementById("TCASTemplate");

        const clone = document.importNode(template.content, true);
        const container = clone.querySelector("#TCASSymbols");
        container.id = this.id(map);

        this.altText = container.querySelector("#AltText");
        this.arrowHeadUp = container.querySelector("#ArrowHeadUp");
        this.arrowHeadDown = container.querySelector("#ArrowHeadDown");
        this.arrowGroup = container.querySelector("#ArrowGroup");

        this.RASymbol = container.querySelector("#RARect");
        this.TASymbol = container.querySelector("#TACircle");
        this.ProxSymbol = container.querySelector("#Prox");
        this.OtherSymbol = container.querySelector("#Other");

        return container;
    }

    updateDraw(map) {
        map.coordinatesToXYToRef(new LatLong(this.lat, this.lon), this.screenPos);
        if (isFinite(this.screenPos.x) && isFinite(this.screenPos.y)) {
            this.svgElement.setAttribute("x", fastToFixed((this.screenPos.x - 19.75), 1)); //19.75 is x-pos of the actual symbol in the svg
            this.svgElement.setAttribute("y", fastToFixed((this.screenPos.y - 14.37), 1)); //same here
        }

        if (this.created) {
            //set altitude difference
            const AltDiffInHundredsFeet = Math.round(Math.abs(this.relativeAlt) / 100).toString();
            if (this.altText.textContent !== AltDiffInHundredsFeet) {
                this.altText.textContent = (this.relativeAlt > 0 ? "+" : "-") + (Math.round(Math.abs(this.relativeAlt) / 100) < 10 ? "0" : "") + AltDiffInHundredsFeet;
            }

            //set vertical speed arrow
            if (this.vertSpeed > 500) {
                this.arrowHeadUp.setAttribute("visibility", "shown");
                this.arrowHeadDown.setAttribute("visibility", "hidden");
                this.arrowGroup.setAttribute("visibility", "shown");
                this._lastVertArrowCase = 0;
            } else if (this.vertSpeed < -500) {
                this.arrowHeadUp.setAttribute("visibility", "hidden");
                this.arrowHeadDown.setAttribute("visibility", "shown");
                this.arrowGroup.setAttribute("visibility", "shown");
                this._lastVertArrowCase = 1;
            } else {
                this.arrowGroup.setAttribute("visibility", "hidden");
                this._lastVertArrowCase = 2;
            }

            if (!this.isDisplayed) {
                if (this._lastIntrusionLevel !== 4) {
                    this.svgElement.setAttribute("visibility", "hidden");
                    //those below shouldn't be needed to hide the entire symbol, but it doesn't work without it
                    this.RASymbol.setAttribute("visibility", "hidden");
                    this.TASymbol.setAttribute("visibility", "hidden");
                    this.ProxSymbol.setAttribute("visibility", "hidden");
                    this.OtherSymbol.setAttribute("visibility", "hidden");
                    this._lastIntrusionLevel = 4;
                }
            } else if (this.intrusionLevel === 3) {
                if (this._lastIntrusionLevel !== 3) {
                    this.RASymbol.setAttribute("visibility", "visible");
                    this.TASymbol.setAttribute("visibility", "hidden");
                    this.ProxSymbol.setAttribute("visibility", "hidden");
                    this.OtherSymbol.setAttribute("visibility", "hidden");

                    this.altText.style.fill = "#ff0000";
                    this.arrowGroup.style.fill = "#ff0000";
                    this.arrowGroup.style.stroke = "#ff0000";

                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastIntrusionLevel = 3;
                }
            } else if (this.intrusionLevel === 2) {
                if (this._lastIntrusionLevel !== 2) {
                    this.RASymbol.setAttribute("visibility", "hidden");
                    this.TASymbol.setAttribute("visibility", "visible");
                    this.ProxSymbol.setAttribute("visibility", "hidden");
                    this.OtherSymbol.setAttribute("visibility", "hidden");

                    this.altText.style.fill = "#e38c56";
                    this.arrowGroup.style.fill = "#e38c56";
                    this.arrowGroup.style.stroke = "#e38c56";

                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastIntrusionLevel = 2;
                }
            } else if (this.intrusionLevel === 1) {
                if (this._lastIntrusionLevel !== 1) {
                    this.RASymbol.setAttribute("visibility", "hidden");
                    this.TASymbol.setAttribute("visibility", "hidden");
                    this.ProxSymbol.setAttribute("visibility", "visible");
                    this.OtherSymbol.setAttribute("visibility", "hidden");

                    this.altText.style.fill = "#ffffff";
                    this.arrowGroup.style.fill = "#ffffff";
                    this.arrowGroup.style.stroke = "#ffffff";

                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastIntrusionLevel = 1;
                }
            } else if (this.intrusionLevel === 0) {
                if (this._lastIntrusionLevel !== 0) {
                    this.RASymbol.setAttribute("visibility", "hidden");
                    this.TASymbol.setAttribute("visibility", "hidden");
                    this.ProxSymbol.setAttribute("visibility", "hidden");
                    this.OtherSymbol.setAttribute("visibility", "visible");

                    this.altText.style.fill = "#ffffff";
                    this.arrowGroup.style.fill = "#ffffff";
                    this.arrowGroup.style.stroke = "#ffffff";

                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastIntrusionLevel = 0;
                }
            }
        }
    }

    /**
     * Gets the distance between 2 points, given in lat/lon/alt above sea level
     * @param pos1 {number[]} Position 1 [lat, lon, alt(feet)]
     * @param pos2 {number[]} Position 2 [lat, lon, alt(feet)]
     * @return {number} distance in nautical miles
     */
    computeDistance3D(pos1, pos2) {
        const earthRadius = 3440.065; // earth radius in nautcal miles
        const deg2rad = Math.PI / 180;

        const radius1 = pos1[2] / 6076 + earthRadius;
        const radius2 = pos2[2] / 6076 + earthRadius;

        const x1 = radius1 * Math.sin(deg2rad * (pos1[0] + 90)) * Math.cos(deg2rad * (pos1[1] + 180));
        const y1 = radius1 * Math.sin(deg2rad * (pos1[0] + 90)) * Math.sin(deg2rad * (pos1[1] + 180));
        const z1 = radius1 * Math.cos(deg2rad * (pos1[0] + 90));

        const x2 = radius2 * Math.sin(deg2rad * (pos2[0] + 90)) * Math.cos(deg2rad * (pos2[1] + 180));
        const y2 = radius2 * Math.sin(deg2rad * (pos2[0] + 90)) * Math.sin(deg2rad * (pos2[1] + 180));
        const z2 = radius2 * Math.cos(deg2rad * (pos2[0] + 90));

        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
    }
}
