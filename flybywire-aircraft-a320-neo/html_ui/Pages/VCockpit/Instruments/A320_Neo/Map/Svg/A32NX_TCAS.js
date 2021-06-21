const CONSTANTS = {
    MIN_VS: -6000,
    MAX_VS: 6000
};

const taraCallouts = {
    climb: 0,
    climb_cross: 1,
    climb_increase: 2,
    climb_now: 3,
    clear_of_conflict: 4,
    descend: 5,
    descend_cross: 6,
    descend_increase: 7,
    descend_now: 8,
    monitor_vs: 9,
    maintain_vs: 10,
    maintain_vs_cross: 11,
    level_off: 12,
    traffic: 13
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

/**
 *  callout: warning annunciation to be made
 *  sense: up (climb) or down (descend)
 *  type: corrective or preventative
 *
 */
const raVariants = {
    // PREVENTIVE RA's
    monitor_vs_level: {
        callout: taraCallouts.monitor_vs,
        sense: raSense.level,
        type: raType.preventative,
        vs: {
            condition: [-100, 100],
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
            green: null,
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
        this.TrafficUpdateTimer = 0.2;
        this.TrafficAircraft = [];
        this.sensitivityLevel = 1;
        this.activeRA = new Set();
        this.activeTA = new Set();
    }

    // This is called from the MFD JS file, because the MapInstrument doesn't have a deltaTime
    update(_deltaTime) {
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

        // altitude of the terrain
        const groundAlt = altitude - radioAltitude;

        const vertSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

        this.updateSensitivityLevel(altitude, radioAltitude, TCASMode);

        const TaRaTau = this.getTaRaTau(this.sensitivityLevel);
        const TaRaDMOD = this.getTaRaDMOD(this.sensitivityLevel);
        const TaRaZTHR = this.getTaRaZTHR(this.sensitivityLevel);

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
                        aircraft.update(localDeltaTime, traffic.lat, traffic.lon, traffic.alt * 3.281, traffic.heading, lat, lon, altitude, vertSpeed, TaRaDMOD[1]);
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

        let maxIntrusionLevel = 0;
        // Check for collisions
        for (const traffic of this.TrafficAircraft) {
            // horzontal distance in Nautical miles
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
                rangeIntrusionLevel = 2;
            } else if (horizontalDistance < 6) {
                rangeIntrusionLevel = 1;
            } else {
                rangeIntrusionLevel = 0;
            }

            if (traffic.verticalTAU < TaRaTau[1] || Math.abs(traffic.relativeAlt) < TaRaZTHR[1]) {
                verticalIntrusionLevel = 3;
            } else if (traffic.verticalTAU < TaRaTau[0] || Math.abs(traffic.relativeAlt) < TaRaZTHR[0]) {
                verticalIntrusionLevel = 2;
            } else if (Math.abs(traffic.relativeAlt) < 1200) {
                verticalIntrusionLevel = 1;
            } else {
                verticalIntrusionLevel = 0;
            }

            traffic.intrusionLevel = Math.min(verticalIntrusionLevel, rangeIntrusionLevel);

            // determine highest intrusion level
            if (traffic.intrusionLevel > maxIntrusionLevel) {
                maxIntrusionLevel = traffic.intrusionLevel;
            }
        }

        this.updateAdvisories(_deltaTime);
        this.updateRaParameters(_deltaTime);
    }

    updateAdvisories(_deltaTime) {
        for (const traffic of this.TrafficAircraft) {
            if (this.activeTA.has(traffic.ID)) {
                if (traffic.intrusionLevel === 3) {
                    console.log("TCAS: TA UPGRADED TO RA!");
                    this.activeTA.delete(traffic.ID);
                    this.activeRA.add([traffic.ID, raSense.initial, raStrength.initial]);
                } else if (traffic.intrusionLevel < 2) {
                    console.log("TCAS: CLEAR OF TA!");
                    this.activeTA.delete(traffic.ID);
                    traffic.timeSinceLastTA = 0;
                }
            } else {
                if (traffic.intrusionLevel === 2) {
                    console.log("TCAS: GENERATING NEW TA!");
                    Coherent.call("PLAY_INSTRUMENT_SOUND", "traffic_traffic");
                    this.activeTA.add(traffic.ID);
                } else if (traffic.timeSinceLastTA <= 5) {
                    traffic.timeSinceLastTA += _deltaTime / 1000;
                }
            }

            if (this.activeRA.has(traffic.ID)) {
                if (traffic.intrusionLevel === 3) {
                    // Handle continuing RA
                } else {
                    if (traffic.intrusionLevel === 2) {
                        this.activeTA.add(traffic.ID);
                        traffic.timeSinceLastTA = 0;
                        console.log("TCAS: RA DOWNGRADED TO TA");
                    }
                    this.activeRA.delete(traffic.ID);
                    console.log("TCAS: CLEAR OF CONFLICT!");
                }
            } else {
                if (traffic.intrusionLevel === 3) {
                    console.log("TCAS: RA GENERATED!");
                    this.activeRA.add([traffic.ID, raSense.initial, raStrength.initial]);
                }
            }
        }
    }

    updateRaParameters(_deltaTime) {
        for (const RA of this.activeRA) {
            const traffic = this.TrafficAircraft.find(t => t.ID === RA[0]);
            if (RA[1] === raSense.initial) {
                // Choose initial sense and strength
            } else {

            }
        }
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
     */constructor(_ID, _lat, _lon, _alt, _heading, _selfLat, _selfLon, _selfAlt) {
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
        this.RaTau = Infinity;
        // time until aircraft is on the same altitude level
        this.verticalTAU = Infinity;

        this.screenPos = new Vec2();

        this.alive = true;

        // previous dipslay type (i.e. RA, TA, vertical speed arrow etc.) to prevent frequent svg changes
        this._lastIntrusionLevel = NaN;
        this._lastVertArrowCase = NaN;

        // Keep a timer after a TA has ended to prevent unneeded annunciations
        this.timeSinceLastTA = 6;
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
        this.RaTAU = (this.slantDistance = TaRaDMOD[1]) / this.closureRate * 3600;
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
