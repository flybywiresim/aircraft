class A32NX_GPWS {
    constructor(_core) {
        console.log('A32NX_GPWS constructed');
        this.core = _core;

        this.minimumsState = 0;

        this.radnav = new RadioNav();

        this.Mode3MaxBaroAlt = NaN;

        this.Mode4MaxRAAlt = NaN;

        this.Mode2BoundaryLeaveAlt = NaN;
        this.Mode2NumTerrain = 0;
        this.Mode2NumFramesInBoundary = 0;

        this.RadioAltRate = NaN;
        this.prevRadioAlt = NaN;
        this.prevRadioAlt2 = NaN;

        this.modes = [
            // Mode 1
            {
                // 0: no warning, 1: "sink rate", 2 "pull up"
                current: 0,
                previous: 0,
                type: [
                    {},
                    { sound: soundList.sink_rate, soundPeriod: 1.1, gpwsLight: true },
                    { gpwsLight: true, pullUp: true }
                ]
            },
            // Mode 2 is currently inactive.
            {
                // 0: no warning, 1: "terrain", 2: "pull up"
                current: 0,
                previous: 0,
                type: [{}, { gpwsLight: true }, { gpwsLight: true, pullUp: true }],
            },
            // Mode 3
            {
                // 0: no warning, 1: "don't sink"
                current: 0,
                previous: 0,
                type: [{}, { sound: soundList.dont_sink, soundPeriod: 1.1, gpwsLight: true }]
            },
            // Mode 4
            {
                // 0: no warning, 1: "too low gear", 2: "too low flaps", 3: "too low terrain"
                current: 0,
                previous: 0,
                type: [
                    {},
                    { sound: soundList.too_low_gear, soundPeriod: 1.1, gpwsLight: true },
                    { sound: soundList.too_low_flaps, soundPeriod: 1.1, gpwsLight: true },
                    { sound: soundList.too_low_terrain, soundPeriod: 1.1, gpwsLight: true }
                ]
            },
            // Mode 5, not all warnings are fully implemented
            {
                // 0: no warning, 1: "glideslope", 2: "hard glideslope" (louder)
                current: 0,
                previous: 0,
                type: [
                    {},
                    {},
                    {},
                ],
                onChange: (current, _) => {
                    SimVar.SetSimVarValue("L:A32NX_GPWS_GS_Warning_Active", "Bool", current >= 1);
                }
            }
        ];

        this.PrevShouldPullUpPlay = 0;

        this.AltCallState = A32NX_Util.createMachine(AltCallStateMachine);
        this.AltCallState.setState("ground");
        this.RetardState = A32NX_Util.createMachine(RetardStateMachine);
        this.RetardState.setState("landed");
    }

    init() {
        console.log('A32NX_GPWS init');

        this.radnav.init(NavMode.FOUR_SLOTS);

        SimVar.SetSimVarValue("L:A32NX_GPWS_GS_Warning_Active", "Bool", 0);
        SimVar.SetSimVarValue("L:A32NX_GPWS_Warning_Active", "Bool", 0);
    }

    update(deltaTime, _core) {
        this.gpws(deltaTime);
    }
    gpws(deltaTime) {
        const radioAlt = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND MINUS CG", "Feet");
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");

        this.UpdateAltState(radioAlt);
        this.differentiate_radioalt(radioAlt, deltaTime);

        const mda = SimVar.GetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet");
        const dh = SimVar.GetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet");
        const phase = SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "Enum");

        if (radioAlt >= 10 && radioAlt <= 2450 && !SimVar.GetSimVarValue("L:A32NX_GPWS_SYS_OFF", "Bool")) { //Activate between 10 - 2450 radio alt unless SYS is off
            const FlapPushButton = SimVar.GetSimVarValue("L:A32NX_GPWS_FLAPS3", "Bool");
            const FlapPosition = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number");
            const FlapsInLandingConfig = FlapPushButton ? (FlapPosition === 3) : (FlapPosition === 4);
            const vSpeed = Simplane.getVerticalSpeed();
            const Airspeed = SimVar.GetSimVarValue("AIRSPEED INDICATED", "Knots");
            const gearExtended = SimVar.GetSimVarValue("GEAR TOTAL PCT EXTENDED", "Percent") > 0.9;

            this.update_maxRA(radioAlt, onGround, phase);

            this.GPWSMode1(this.modes[0], radioAlt, vSpeed);
            //Mode 2 is disabled because of an issue with the terrain height simvar which causes false warnings very frequently. See PR#1742 for more info
            //this.GPWSMode2(this.modes[1], radioAlt, Airspeed, FlapsInLandingConfig, gearExtended);
            this.GPWSMode3(this.modes[2], radioAlt, phase);
            this.GPWSMode4(this.modes[3], radioAlt, Airspeed, FlapsInLandingConfig, gearExtended, phase);
            this.GPWSMode5(this.modes[4], radioAlt);

        } else {
            this.modes.forEach((mode) => {
                mode.current = 0;
            });

            this.Mode3MaxBaroAlt = NaN;
            if (onGround || radioAlt < 10) {
                this.Mode4MaxRAAlt = NaN;
            }

            SimVar.SetSimVarValue("L:A32NX_GPWS_GS_Warning_Active", "Bool", 0);
            SimVar.SetSimVarValue("L:A32NX_GPWS_Warning_Active", "Bool", 0);
        }

        this.GPWSComputeLightsAndCallouts();

        if ((mda !== 0 || dh !== -1) && phase === FmgcFlightPhases.APPROACH) {
            let minimumsDA; //MDA or DH
            let minimumsIA; //radio or baro altitude
            const baroAlt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
            if (dh >= 0) {
                minimumsDA = dh;
                minimumsIA = radioAlt;
            } else {
                minimumsDA = mda;
                minimumsIA = baroAlt;
            }
            this.gpws_minimums(minimumsDA, minimumsIA);
        }
    }

    /**
     * Takes the derivative of the radio altimeter. Using central difference, to prevent high frequency noise
     * @param radioAlt - in feet
     * @param deltaTime - in milliseconds
     */
    differentiate_radioalt(radioAlt, deltaTime) {
        if (!isNaN(this.prevRadioAlt2)) {
            this.RadioAltRate = (radioAlt - this.prevRadioAlt2) / (deltaTime / 1000 / 60) / 2;
            this.prevRadioAlt2 = this.prevRadioAlt;
            this.prevRadioAlt = radioAlt;
        } else if (!isNaN(this.prevRadioAlt)) {
            this.prevRadioAlt2 = this.prevRadioAlt;
            this.prevRadioAlt = radioAlt;
        } else {
            this.prevRadioAlt2 = radioAlt;
        }
    }

    update_maxRA(radioAlt, onGround, phase) {
        // on ground check is to get around the fact that radio alt is set to around 300 while loading
        if (onGround || phase === FmgcFlightPhases.GOAROUND) {
            this.Mode4MaxRAAlt = NaN;
        } else if (this.Mode4MaxRAAlt < radioAlt || isNaN(this.Mode4MaxRAAlt)) {
            this.Mode4MaxRAAlt = radioAlt;
        }
    }

    gpws_minimums(minimumsDA, minimumsIA) {
        let over100Above = false;
        let overMinimums = false;

        if (minimumsDA <= 90) {
            overMinimums = minimumsIA >= minimumsDA + 15;
            over100Above = minimumsIA >= minimumsDA + 115;
        } else {
            overMinimums = minimumsIA >= minimumsDA + 5;
            over100Above = minimumsIA >= minimumsDA + 105;
        }
        if (this.minimumsState === 0 && overMinimums) {
            this.minimumsState = 1;
        } else if (this.minimumsState === 1 && over100Above) {
            this.minimumsState = 2;
        } else if (this.minimumsState === 2 && !over100Above) {
            this.core.soundManager.tryPlaySound(soundList.hundred_above);
            this.minimumsState = 1;
        } else if (this.minimumsState === 1 && !overMinimums) {
            this.core.soundManager.tryPlaySound(soundList.minimums);
            this.minimumsState = 0;
        }
    }

    GPWSComputeLightsAndCallouts() {
        this.modes.forEach((mode) => {
            if (mode.current === mode.previous) {
                return;
            }

            const previousType = mode.type[mode.previous];
            this.core.soundManager.removePeriodicSound(previousType.sound);

            const currentType = mode.type[mode.current];
            this.core.soundManager.addPeriodicSound(currentType.sound, currentType.soundPeriod);

            if (mode.onChange) {
                mode.onChange(mode.current, mode.previous);
            }

            mode.previous = mode.current;
        });

        const activeTypes = this.modes.map((mode) => mode.type[mode.current]);

        const shouldPullUpPlay = activeTypes.some((type) => type.pullUp);
        if (shouldPullUpPlay !== this.PrevShouldPullUpPlay) {
            if (shouldPullUpPlay) {
                this.core.soundManager.addPeriodicSound(soundList.pull_up, 1.1);
            } else {
                this.core.soundManager.removePeriodicSound(soundList.pull_up);
            }
            this.PrevShouldPullUpPlay = shouldPullUpPlay;
        }

        const illuminateGpwsLight = activeTypes.some((type) => type.gpwsLight);
        SimVar.SetSimVarValue("L:A32NX_GPWS_Warning_Active", "Bool", illuminateGpwsLight);
    }

    /**
     * Compute the GPWS Mode 1 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param vSpeed - Vertical speed, in feet/min, should be inertial vertical speed, not sure if simconnect provides that
     */
    GPWSMode1(mode, radioAlt, vSpeed) {
        const sinkrate = -vSpeed;

        if (sinkrate <= 1000) {
            mode.current = 0;
            return;
        }

        const maxSinkrateAlt = 0.61 * sinkrate - 600;
        const maxPullUpAlt = sinkrate < 1700 ? 1.3 * sinkrate - 1940 : 0.4 * sinkrate - 410;

        if (radioAlt <= maxPullUpAlt) {
            mode.current = 2;
        } else if (radioAlt <= maxSinkrateAlt) {
            mode.current = 1;
        } else {
            mode.current = 0;
        }
    }

    /**
     * Compute the GPWS Mode 2 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param speed - Airspeed in knots.
     * @param FlapsInLandingConfig - If flaps is in landing config
     * @param gearExtended - If the gear is deployed
     */
    GPWSMode2(mode, radioAlt, speed, FlapsInLandingConfig, gearExtended) {
        let IsInBoundary = false;
        const UpperBoundaryRate = -this.RadioAltRate < 3500 ? 0.7937 * -this.RadioAltRate - 1557.5 : 0.19166 * -this.RadioAltRate + 610;
        const UpperBoundarySpeed = Math.max(1650, Math.min(2450, 8.8888 * speed - 305.555));

        if (!FlapsInLandingConfig && -this.RadioAltRate > 2000) {
            if (radioAlt < UpperBoundarySpeed && radioAlt < UpperBoundaryRate) {
                this.Mode2NumFramesInBoundary += 1;
            } else {
                this.Mode2NumFramesInBoundary = 0;
            }
        } else if (FlapsInLandingConfig && -this.RadioAltRate > 2000) {
            if (radioAlt < 775 && radioAlt < UpperBoundaryRate && -this.RadioAltRate < 10000) {
                this.Mode2NumFramesInBoundary += 1;
            } else {
                this.Mode2NumFramesInBoundary = 0;
            }
        }
        // This is to prevent very quick changes in radio alt rate triggering the alarm. The derivative is sadly pretty jittery.
        if (this.Mode2NumFramesInBoundary > 5) {
            IsInBoundary = true;
        }

        if (IsInBoundary) {
            this.Mode2BoundaryLeaveAlt = -1;
            if (this.Mode2NumTerrain < 2 || gearExtended) {
                if (this.core.soundManager.tryPlaySound(soundList.too_low_terrain)) { // too low terrain is not correct, but no "terrain" call yet
                    this.Mode2NumTerrain += 1;
                }
                mode.current = 1;
            } else if (!gearExtended) {
                mode.current = 2;
            }
        } else if (this.Mode2BoundaryLeaveAlt === -1) {
            this.Mode2BoundaryLeaveAlt = radioAlt;
        } else if (this.Mode2BoundaryLeaveAlt + 300 > radioAlt) {
            mode.current = 1;
            this.core.soundManager.tryPlaySound(soundList.too_low_terrain);
        } else if (this.Mode2BoundaryLeaveAlt + 300 <= radioAlt) {
            mode.current = 0;
            this.Mode2NumTerrain = 0;
            this.Mode2BoundaryLeaveAlt = NaN;
        }
    }

    /**
     * Compute the GPWS Mode 3 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param phase - Flight phase index
     * @param FlapsInLandingConfig - If flaps is in landing config
     * @constructor
     */
    GPWSMode3(mode, radioAlt, phase) {
        if (!(phase === FmgcFlightPhases.TAKEOFF || phase === FmgcFlightPhases.GOAROUND) || radioAlt > 1500 || radioAlt < 10) {
            this.Mode3MaxBaroAlt = NaN;
            mode.current = 0;
            return;
        }

        const baroAlt = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");

        const maxAltLoss = 0.09 * radioAlt + 7.1;

        if (baroAlt > this.Mode3MaxBaroAlt || isNaN(this.Mode3MaxBaroAlt)) {
            this.Mode3MaxBaroAlt = baroAlt;
            mode.current = 0;
        } else if ((this.Mode3MaxBaroAlt - baroAlt) > maxAltLoss) {
            mode.current = 1;
        } else {
            mode.current = 0;
        }
    }

    /**
     * Compute the GPWS Mode 4 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param speed - Airspeed in knots.
     * @param FlapsInLandingConfig - If flaps is in landing config
     * @param gearExtended - If the gear is extended
     * @param phase - Flight phase index
     * @constructor
     */
    GPWSMode4(mode, radioAlt, speed, FlapsInLandingConfig, gearExtended, phase) {
        if (radioAlt < 30 || radioAlt > 1000) {
            mode.current = 0;
            return;
        }
        const FlapModeOff = SimVar.GetSimVarValue("L:A32NX_GPWS_FLAP_OFF", "Bool");

        // Mode 4 A and B logic
        if (!gearExtended && phase === FmgcFlightPhases.APPROACH) {
            if (speed < 190 && radioAlt < 500) {
                mode.current = 1;
            } else if (speed >= 190) {
                const maxWarnAlt = 8.333 * speed - 1083.333;
                mode.current = radioAlt < maxWarnAlt ? 3 : 0;
            }
        } else if (!FlapsInLandingConfig && !FlapModeOff && phase === FmgcFlightPhases.APPROACH) {
            if (speed < 159 && radioAlt < 245) {
                mode.current = 2;
            } else if (speed >= 159) {
                const maxWarnAlt = 8.2967 * speed - 1074.18;
                mode.current = radioAlt < maxWarnAlt ? 3 : 0;
            }
        } else {
            mode.current = 0;
        }
        if (!FlapsInLandingConfig || !gearExtended) {
            const maxWarnAltSpeed = Math.max(Math.min(8.3333 * speed - 1083.33, 1000), 500);
            const maxWarnAlt = 0.750751 * this.Mode4MaxRAAlt - 0.750751;

            if (this.Mode4MaxRAAlt > 100 && radioAlt < maxWarnAltSpeed && radioAlt < maxWarnAlt) {
                mode.current = 3;
            }
        }
    }

    /**
     * Compute the GPWS Mode 5 state.
     * @param mode - The mode object which stores the state.
     * @param - radioAlt Radio altitude in feet
     * @constructor
     */
    GPWSMode5(mode, radioAlt) {
        if (radioAlt > 1000 || radioAlt < 30 || SimVar.GetSimVarValue("L:A32NX_GPWS_GS_OFF", "Bool")) {
            mode.current = 0;
            return;
        }
        const localizer = this.radnav.getBestILSBeacon();
        if (localizer.id <= 0 || !SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + localizer.id, "Bool")) {
            mode.current = 0;
            return;
        }
        const error = SimVar.GetSimVarValue("NAV GLIDE SLOPE ERROR:" + localizer.id, "Degrees");
        const dots = -error * 2.5; //According to the FCOM, one dot is approx. 0.4 degrees. 1/0.4 = 2.5

        const minAltForWarning = dots < 2.9 ? -75 * dots + 247.5 : 30;
        const minAltForHardWarning = dots < 3.8 ? -66.66 * dots + 283.33 : 30;

        if (dots > 2 && radioAlt > minAltForHardWarning && radioAlt < 350) {
            mode.current = 2;
        } else if (dots > 1.3 && radioAlt > minAltForWarning) {
            mode.current = 1;
        } else {
            mode.current = 0;
        }
    }

    UpdateAltState(radioAlt) {
        switch (this.AltCallState.value) {
            case "ground":
                if (radioAlt > 5) {
                    this.AltCallState.action("up");
                }
                break;
            case "over5":
                if (radioAlt > 10) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 5) {
                    if (this.RetardState.value !== "retardPlaying") {
                        this.core.soundManager.tryPlaySound(soundList.alt_5);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over10":
                if (radioAlt > 20) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 10) {
                    if (this.RetardState.value !== "retardPlaying") {
                        this.core.soundManager.tryPlaySound(soundList.alt_10);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over20":
                if (radioAlt > 30) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 20) {
                    this.core.soundManager.tryPlaySound(soundList.alt_20);
                    this.AltCallState.action("down");
                }
                break;
            case "over30":
                if (radioAlt > 40) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 30) {
                    this.core.soundManager.tryPlaySound(soundList.alt_30);
                    this.AltCallState.action("down");
                }
                break;
            case "over40":
                if (radioAlt > 50) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 40) {
                    this.core.soundManager.tryPlaySound(soundList.alt_40);
                    this.AltCallState.action("down");
                }
                break;
            case "over50":
                if (radioAlt > 100) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 50) {
                    this.core.soundManager.tryPlaySound(soundList.alt_50);
                    this.AltCallState.action("down");
                }
                break;
            case "over100":
                if (radioAlt > 200) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 100) {
                    this.core.soundManager.tryPlaySound(soundList.alt_100);
                    this.AltCallState.action("down");
                }
                break;
            case "over200":
                if (radioAlt > 300) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 200) {
                    this.core.soundManager.tryPlaySound(soundList.alt_200);
                    this.AltCallState.action("down");
                }
                break;
            case "over300":
                if (radioAlt > 400) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 300) {
                    this.core.soundManager.tryPlaySound(soundList.alt_300);
                    this.AltCallState.action("down");
                }
                break;
            case "over400":
                if (radioAlt > 500) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 400) {
                    this.core.soundManager.tryPlaySound(soundList.alt_400);
                    this.AltCallState.action("down");
                }
                break;
            case "over500":
                if (radioAlt > 1000) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 500) {
                    this.core.soundManager.tryPlaySound(soundList.alt_500);
                    this.AltCallState.action("down");
                }
                break;
            case "over1000":
                if (radioAlt > 2500) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 1000) {
                    this.core.soundManager.tryPlaySound(soundList.alt_1000);
                    this.AltCallState.action("down");
                }
                break;
            case "over2500":
                if (radioAlt <= 2500) {
                    this.core.soundManager.tryPlaySound(soundList.alt_2500);
                    this.AltCallState.action("down");
                }
                break;
        }

        switch (this.RetardState.value) {
            case "overRetard":
                if (radioAlt < 20) {
                    if (!SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_ACTIVE", "Bool")) {
                        this.RetardState.action("play");
                        this.core.soundManager.addPeriodicSound(soundList.retard, 1.1);
                    } else if (radioAlt < 10) {
                        this.RetardState.action("play");
                        this.core.soundManager.addPeriodicSound(soundList.retard, 1.1);
                    }
                }
                break;
            case "retardPlaying":
                if (SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number") < 2.6 || SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "number") < 2.6) {
                    this.RetardState.action("land");
                    this.core.soundManager.removePeriodicSound(soundList.retard);
                } else if (SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "Enum") === FmgcFlightPhases.GOAROUND || radioAlt > 20) {
                    this.RetardState.action("go_around");
                    this.core.soundManager.removePeriodicSound(soundList.retard);
                }
                break;
            case "landed":
                if (radioAlt > 20) {
                    this.RetardState.action("up");
                }
                break;
        }
    }
}

const RetardStateMachine = {
    overRetard: {
        transitions: {
            play: {
                target: "retardPlaying"
            }
        }
    },
    retardPlaying: {
        transitions: {
            land: {
                target: "landed"
            },
            go_around: {
                target: "overRetard"
            }
        }
    },
    landed: {
        transitions: {
            up: {
                target: "overRetard"
            }
        }
    }
};

const AltCallStateMachine = {
    init: "ground",
    over2500: {
        transitions: {
            down: {
                target: "over1000"
            }
        }
    },
    over1000: {
        transitions: {
            down: {
                target: "over500"
            },
            up: {
                target: "over2500"
            }
        }
    },
    over500: {
        transitions: {
            down: {
                target: "over400"
            },
            up: {
                target: "over1000"
            }
        }
    },
    over400: {
        transitions: {
            down: {
                target: "over300"
            },
            up: {
                target: "over500"
            }
        }
    },
    over300: {
        transitions: {
            down: {
                target: "over200"
            },
            up: {
                target: "over400"
            }
        }
    },
    over200: {
        transitions: {
            down: {
                target: "over100"
            },
            up: {
                target: "over300"
            }
        }
    },
    over100: {
        transitions: {
            down: {
                target: "over50"
            },
            up: {
                target: "over200"
            }
        }
    },
    over50: {
        transitions: {
            down: {
                target: "over40"
            },
            up: {
                target: "over100"
            }
        }
    },
    over40: {
        transitions: {
            down: {
                target: "over30"
            },
            up: {
                target: "over50"
            }
        }
    },
    over30: {
        transitions: {
            down: {
                target: "over20"
            },
            up: {
                target: "over40"
            }
        }
    },
    over20: {
        transitions: {
            down: {
                target: "over10"
            },
            up: {
                target: "over30"
            }
        }
    },
    over10: {
        transitions: {
            down: {
                target: "over5"
            },
            up: {
                target: "over20"
            }
        }
    },
    over5: {
        transitions: {
            down: {
                target: "ground"
            },
            up: {
                target: "over10"
            }
        }
    },
    ground: {
        transitions: {
            up: {
                target: "over5"
            }
        }
    }
};
