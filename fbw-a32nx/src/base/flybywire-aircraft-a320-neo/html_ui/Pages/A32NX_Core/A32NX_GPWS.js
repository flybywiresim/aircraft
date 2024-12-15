// Note the master copy of these flags is contained in `fbw-a32nx\src\systems\shared\src\AutoCallOuts.ts`
// Please do not edit here unless copying from there.

/** Bit flags for the radio auto call outs (for CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS). */
const A32NXRadioAutoCallOutFlags = Object.freeze({
    TwoThousandFiveHundred: 1 << 0,
    TwentyFiveHundred: 1 << 1,
    TwoThousand: 1 << 2,
    OneThousand: 1 << 3,
    FiveHundred: 1 << 4,
    FourHundred: 1 << 5,
    ThreeHundred: 1 << 6,
    TwoHundred: 1 << 7,
    OneHundred: 1 << 8,
    Fifty: 1 << 9,
    Forty: 1 << 10,
    Thirty: 1 << 11,
    Twenty: 1 << 12,
    Ten: 1 << 13,
    Five: 1 << 14,
    FiveHundredGlide: 1 << 15,
});

/** The default (Airbus basic configuration) radio altitude auto call outs. */
const DEFAULT_RADIO_AUTO_CALL_OUTS = A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred | A32NXRadioAutoCallOutFlags.OneThousand | A32NXRadioAutoCallOutFlags.FourHundred
    | A32NXRadioAutoCallOutFlags.Fifty | A32NXRadioAutoCallOutFlags.Forty | A32NXRadioAutoCallOutFlags.Thirty | A32NXRadioAutoCallOutFlags.Twenty
    | A32NXRadioAutoCallOutFlags.Ten | A32NXRadioAutoCallOutFlags.Five;

class A32NX_GPWS {
    constructor(_core) {
        console.log('A32NX_GPWS constructed');
        this.core = _core;

        this.autoCallOutPins = DEFAULT_RADIO_AUTO_CALL_OUTS;

        this.minimumsState = 0;

        this.Mode3MaxBaroAlt = NaN;

        this.Mode4MaxRAAlt = 0;

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
                    this.setGlideSlopeWarning(current >= 1);
                }
            }
        ];

        this.PrevShouldPullUpPlay = 0;

        this.AltCallState = A32NX_Util.createMachine(AltCallStateMachine);
        this.AltCallState.setState("ground");
        this.RetardState = A32NX_Util.createMachine(RetardStateMachine);
        this.RetardState.setState("landed");

        this.isAirVsGroundMode = SimVar.GetSimVarValue("L:A32NX_GPWS_GROUND_STATE", "Bool") !== 1;
        this.airborneFor5s = new NXLogic_ConfirmNode(5);
        this.airborneFor10s = new NXLogic_ConfirmNode(10);

        this.isApproachVsTakeoffState = SimVar.GetSimVarValue("L:A32NX_GPWS_APPROACH_STATE", "Bool") === 1;

        this.isOverflightDetected = new NXLogic_TriggeredMonostableNode(60, false);
        // Only relevant if alternate mode 4b is enabled
        this.isMode4aInhibited = false;

        // PIN PROGs
        this.isAudioDeclutterEnabled = false;
        this.isAlternateMode4bEnabled = false;
        this.isTerrainClearanceFloorEnabled = false;
        this.isTerrainAwarenessEnabled = false;

        this.egpwsAlertDiscreteWord1 = Arinc429Word.empty();
        this.egpwsAlertDiscreteWord2 = Arinc429Word.empty();
    }

    gpwsUpdateDiscreteWords() {
        this.egpwsAlertDiscreteWord1.ssm = Arinc429Word.SignStatusMatrix.NormalOperation;
        this.egpwsAlertDiscreteWord1.setBitValue(11, this.modes[0].current === 1);
        this.egpwsAlertDiscreteWord1.setBitValue(12, this.modes[0].current === 2);
        this.egpwsAlertDiscreteWord1.setBitValue(13, this.modes[1].current === 1);
        this.egpwsAlertDiscreteWord1.setBitValue(12, this.modes[1].current === 2);
        this.egpwsAlertDiscreteWord1.setBitValue(14, this.modes[2].current === 1);
        this.egpwsAlertDiscreteWord1.setBitValue(15, this.modes[3].current === 1);
        this.egpwsAlertDiscreteWord1.setBitValue(16, this.modes[3].current === 2);
        this.egpwsAlertDiscreteWord1.setBitValue(17, this.modes[3].current === 3);
        this.egpwsAlertDiscreteWord1.setBitValue(18, this.modes[4].current === 1);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_1', this.egpwsAlertDiscreteWord1.value, this.egpwsAlertDiscreteWord1.ssm);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_1', this.egpwsAlertDiscreteWord1.value, this.egpwsAlertDiscreteWord1.ssm);

        this.egpwsAlertDiscreteWord2.ssm = Arinc429Word.SignStatusMatrix.NormalOperation;
        this.egpwsAlertDiscreteWord2.setBitValue(14, false);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
    }

    setGlideSlopeWarning(state) {
        SimVar.SetSimVarValue('L:A32NX_GPWS_GS_Warning_Active', 'Bool', state ? 1 : 0); // Still need this for XML
        this.egpwsAlertDiscreteWord2.setBitValue(11, state);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
    }

    setGpwsWarning(state) {
        SimVar.SetSimVarValue('L:A32NX_GPWS_Warning_Active', 'Bool', state ? 1 : 0); // Still need this for XML
        this.egpwsAlertDiscreteWord2.setBitValue(12, state);
        this.egpwsAlertDiscreteWord2.setBitValue(13, state);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_1_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
        Arinc429Word.toSimVarValue('L:A32NX_EGPWS_ALERT_2_DISCRETE_WORD_2', this.egpwsAlertDiscreteWord2.value, this.egpwsAlertDiscreteWord2.ssm);
    }

    init() {
        console.log('A32NX_GPWS init');

        this.setGlideSlopeWarning(false);
        this.setGpwsWarning(false);

        NXDataStore.getAndSubscribe('CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS', (k, v) => k === 'CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS' && (this.autoCallOutPins = v), DEFAULT_RADIO_AUTO_CALL_OUTS);
    }

    update(deltaTime, _core) {
        this.gpws(deltaTime);
    }

    gpws(deltaTime) {
        // EGPWS receives ADR1 only
        const baroAlt = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1");
        const computedAirspeed = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED");
        const pitch = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_IR_1_PITCH");
        const inertialVs = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_IR_1_VERTICAL_SPEED");
        const barometricVs = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED");
        const radioAlt1 = Arinc429Word.fromSimVarValue("L:A32NX_RA_1_RADIO_ALTITUDE");
        const radioAlt2 = Arinc429Word.fromSimVarValue("L:A32NX_RA_2_RADIO_ALTITUDE");
        const radioAlt = radioAlt1.isFailureWarning() || radioAlt1.isNoComputedData() ? radioAlt2 : radioAlt1;
        const radioAltValid = radioAlt.isNormalOperation();
        const isOnGround = !this.isAirVsGroundMode;

        const isGpwsSysOff = SimVar.GetSimVarValue("L:A32NX_GPWS_SYS_OFF", "Bool") === 1;
        const isTerrModeOff = SimVar.GetSimVarValue("L:A32NX_GPWS_TERR_OFF", "Bool") === 1;
        const isFlapModeOff = SimVar.GetSimVarValue("L:A32NX_GPWS_FLAP_OFF", "Bool") === 1;
        const isLdgFlap3On = SimVar.GetSimVarValue("L:A32NX_GPWS_FLAPS3", "Bool") === 1;

        const sfccPositionWord = Arinc429Word.fromSimVarValue("L:A32NX_SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD");
        const isFlapsFull = sfccPositionWord.bitValueOr(22, false);
        const isFlaps3 = sfccPositionWord.bitValueOr(21, false) && !isFlapsFull;

        const areFlapsInLandingConfig = !sfccPositionWord.isNormalOperation() || isFlapModeOff || (isLdgFlap3On ? isFlaps3 : isFlapsFull);
        const isGearDownLocked = SimVar.GetSimVarValue("L:A32NX_LGCIU_1_LEFT_GEAR_DOWNLOCKED", "Bool") === 1;

        // TODO only use this in the air?
        const isNavAccuracyHigh = SimVar.GetSimVarValue("L:A32NX_FMGC_L_NAV_ACCURACY_HIGH", "Bool") === 1;
        const isTcfOperational = this.isTerrainClearanceFloorOperational(isTerrModeOff, radioAlt, isNavAccuracyHigh);
        const isTafOperational = this.isTerrainAwarenessOperational(isTerrModeOff);

        this.UpdateAltState(radioAltValid ? radioAlt.value : NaN);
        this.differentiate_radioalt(radioAltValid ? radioAlt.value : NaN, deltaTime);

        const mda = SimVar.GetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet");
        const dh = SimVar.GetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet");

        this.update_maxRA(radioAlt, isOnGround);

        const isOverflightDetected = this.updateOverflightState(deltaTime);
        this.updateMode4aInhibited(isGearDownLocked, areFlapsInLandingConfig);

        this.updateAirGroundState(deltaTime, computedAirspeed, radioAlt, pitch);
        this.updateApproachTakeoffState(computedAirspeed, radioAlt, isGearDownLocked, areFlapsInLandingConfig, isTcfOperational, isTafOperational, isOverflightDetected);

        if (!isGpwsSysOff && radioAltValid && radioAlt.value >= 10 && radioAlt.value <= 2450
        ) { //Activate between 10 - 2450 radio alt unless SYS is off
            const altRate = this.selectAltitudeRate(inertialVs, barometricVs);

            this.GPWSMode1(this.modes[0], radioAlt.value, altRate);
            //Mode 2 is disabled because of an issue with the terrain height simvar which causes false warnings very frequently. See PR#1742 for more info
            //this.GPWSMode2(this.modes[1], radioAlt, computedAirspeed, areFlapsInLandingConfig, isGearDownLocked);
            this.GPWSMode3(this.modes[2], baroAlt, radioAlt.value, altRate, areFlapsInLandingConfig, isGearDownLocked);
            this.GPWSMode4(this.modes[3], radioAlt.value, computedAirspeed, areFlapsInLandingConfig, isGearDownLocked, isTcfOperational, isTafOperational, isOverflightDetected);
            this.GPWSMode5(this.modes[4], radioAlt.value);

        } else {
            this.modes.forEach((mode) => {
                mode.current = 0;
            });

            this.Mode3MaxBaroAlt = NaN;

            this.setGlideSlopeWarning(false);
            this.setGpwsWarning(false);
        }

        this.GPWSComputeLightsAndCallouts();
        this.gpwsUpdateDiscreteWords();

        if ((mda !== 0 || (dh !== -1 && dh !== -2) && this.isApproachVsTakeoffState)) {
            let minimumsDA; //MDA or DH
            let minimumsIA; //radio or baro altitude
            if (dh >= 0) {
                minimumsDA = dh;
                minimumsIA = radioAlt.isNormalOperation() || radioAlt.isFunctionalTest() ? radioAlt.value : NaN;
            } else {
                minimumsDA = mda;
                minimumsIA = baroAlt.isNormalOperation() || baroAlt.isFunctionalTest() ? baroAlt.value : NaN;
            }
            if (isFinite(minimumsDA) && isFinite(minimumsIA)) {
                this.gpws_minimums(minimumsDA, minimumsIA);
            }
        }
    }

    /**
     * Takes the derivative of the radio altimeter. Using central difference, to prevent high frequency noise
     * @param radioAlt - in feet
     * @param deltaTime - in milliseconds
     */
    differentiate_radioalt(radioAlt, deltaTime) {
        if (!isNaN(this.prevRadioAlt2) && !isNaN(radioAlt)) {
            this.RadioAltRate = (radioAlt - this.prevRadioAlt2) / (deltaTime / 1000 / 60) / 2;
            this.prevRadioAlt2 = this.prevRadioAlt;
            this.prevRadioAlt = radioAlt;
        } else if (!isNaN(this.prevRadioAlt) && !isNaN(radioAlt)) {
            this.prevRadioAlt2 = this.prevRadioAlt;
            this.prevRadioAlt = radioAlt;
        } else {
            this.prevRadioAlt2 = radioAlt;
        }
    }

    update_maxRA(radioAlt, isOnGround) {
        // on ground check is to get around the fact that radio alt is set to around 300 while loading
        if (isOnGround || this.isApproachVsTakeoffState) {
            this.Mode4MaxRAAlt = 0;
        } else if (radioAlt.isNormalOperation()) {
            this.Mode4MaxRAAlt = Math.max(this.Mode4MaxRAAlt, 0.75 * radioAlt.value);
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
        this.setGpwsWarning(illuminateGpwsLight);
    }

    /**
     * Compute the GPWS Mode 1 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param vSpeed - Vertical speed, in feet/min, NaN if not available
     */
    GPWSMode1(mode, radioAlt, vSpeed) {
        const sinkrate = -vSpeed;

        if (!Number.isFinite(sinkrate) || sinkrate <= 1000) {
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
     * @param computedAirspeed - Arinc429 value of the computed airspeed in knots.
     * @param areFlapsInLandingConfig - If flaps is in landing config
     * @param gearExtended - If the gear is deployed
     */
    GPWSMode2(mode, radioAlt, computedAirspeed, areFlapsInLandingConfig, gearExtended) {
        if (!computedAirspeed.isNormalOperation()) {
            return false;
        }

        let IsInBoundary = false;
        const UpperBoundaryRate = -this.RadioAltRate < 3500 ? 0.7937 * -this.RadioAltRate - 1557.5 : 0.19166 * -this.RadioAltRate + 610;
        const UpperBoundarySpeed = Math.max(1650, Math.min(2450, 8.8888 * computedAirspeed.value - 305.555));

        if (!areFlapsInLandingConfig && -this.RadioAltRate > 2000) {
            if (radioAlt < UpperBoundarySpeed && radioAlt < UpperBoundaryRate) {
                this.Mode2NumFramesInBoundary += 1;
            } else {
                this.Mode2NumFramesInBoundary = 0;
            }
        } else if (areFlapsInLandingConfig && -this.RadioAltRate > 2000) {
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
     * @param {*} mode - The mode object which stores the state.
     * @param {*} baroAlt - Arinc429 value of the barometric altitude in feet.
     * @param {*} radioAlt - Radio altitude in feet
     * @param {*} altRate - Altitude rate in feet per minute
     * @param {*} areFlapsInLandingConfig - True if flaps is in landing config
     * @param {*} isGearDownLocked - True if the gear is down and locked
     */
    GPWSMode3(mode, baroAlt, radioAlt, altRate, areFlapsInLandingConfig, isGearDownLocked) {
        if ((isGearDownLocked && areFlapsInLandingConfig) || this.isApproachVsTakeoffState || radioAlt > 1500 || radioAlt < 10 || !baroAlt.isNormalOperation()) {
            this.Mode3MaxBaroAlt = NaN;
            mode.current = 0;
            return;
        }

        const maxAltLoss = 0.09 * radioAlt + 7.1;
        const hasPositiveAltRate = Number.isFinite(altRate) && altRate > 0;

        if (baroAlt.value > this.Mode3MaxBaroAlt || isNaN(this.Mode3MaxBaroAlt)) {
            this.Mode3MaxBaroAlt = baroAlt.value;
            mode.current = 0;
        } else if (!hasPositiveAltRate && (this.Mode3MaxBaroAlt - baroAlt.value) > maxAltLoss) {
            mode.current = 1;
        } else {
            mode.current = 0;
        }
    }

    /**
     * Compute the GPWS Mode 4 state.
     * @param mode - The mode object which stores the state.
     * @param radioAlt - Radio altitude in feet
     * @param computedAirspeed - ARINC value of the computed airspeed in knots.
     * @param areFlapsInLandingConfig - If flaps is in landing config
     * @param gearExtended - If the gear is extended
     * @param tcfOperational - If the terrain clearance floor is operational
     * @param tafOperational - If the terrain awareness floor is operational
     * @param isOverflightDetected - If an overflight is detected
     * @constructor
     */
    GPWSMode4(mode, radioAlt, computedAirspeed, areFlapsInLandingConfig, gearExtended, tcfOperational, tafOperational, isOverflightDetected) {
        mode.current = 0;

        if (!computedAirspeed.isNormalOperation() || radioAlt < 30 || radioAlt > 1000 || !this.isAirVsGroundMode) {
            return;
        }

        const isMode4cEnabled = !this.isApproachVsTakeoffState && (!areFlapsInLandingConfig || !gearExtended) && this.isAirVsGroundMode;

        // Mode 4 A
        if (this.isApproachVsTakeoffState && !gearExtended && !this.isMode4aInhibited) {
            const boundary = this.mode4aUpperBoundary(computedAirspeed.value, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected);

            if (computedAirspeed.value < 190 && radioAlt < 500) {
                mode.current = 1; // TOO LOW GEAR
            } else if (computedAirspeed.value >= 190 && radioAlt < boundary) {
                mode.current = areFlapsInLandingConfig ? 1 : 3; // TOO LOW GEAR or TOO LOW TERRAIN
            }
        // Mode 4 B
        } else if (this.isApproachVsTakeoffState && (!areFlapsInLandingConfig || !gearExtended)) {
            // Normal 4b mode, flaps down, what is the boundary?
            const boundary = this.mode4bUpperBoundary(computedAirspeed.value, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected);

            if (computedAirspeed.value < 159 && radioAlt < 245) {
                mode.current = !gearExtended ? 1 : 2; // TOO LOW GEAR or TOO LOW FLAPS
            } else if (computedAirspeed.value >= 159 && radioAlt < boundary) {
                mode.current = this.isMode4aInhibited ? 1 : 3; // TOO LOW GEAR or TOO LOW TERRAIN
            }
        // Mode 4 C
        } else if (isMode4cEnabled) {
            const maximumFloor = this.mode4cUpperBoundary(computedAirspeed.value);
            const maximumFilterValue = Math.min(maximumFloor, this.Mode4MaxRAAlt);

            if (radioAlt < maximumFilterValue) {
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

        // FIXME add backcourse inhibit
        if (!SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_GS_IS_VALID', 'number')) {
            mode.current = 0;
            return;
        }
        const error = SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_GS_DEVIATION', 'number');
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
        if (isNaN(radioAlt)) {
            return;
        }
        switch (this.AltCallState.value) {
            case "ground":
                if (radioAlt > 6) {
                    this.AltCallState.action("up");
                }
                break;
            case "over5":
                if (radioAlt > 12) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 6) {
                    if (this.RetardState.value !== "retardPlaying" && (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Five)) {
                        this.core.soundManager.tryPlaySound(soundList.alt_5);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over10":
                if (radioAlt > 22) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 12) {
                    if (this.RetardState.value !== "retardPlaying" && (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Ten)) {
                        this.core.soundManager.tryPlaySound(soundList.alt_10);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over20":
                if (radioAlt > 32) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 22) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Twenty) {
                        this.core.soundManager.tryPlaySound(soundList.alt_20);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over30":
                if (radioAlt > 42) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 32) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Thirty) {
                        this.core.soundManager.tryPlaySound(soundList.alt_30);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over40":
                if (radioAlt > 53) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 42) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Forty) {
                        this.core.soundManager.tryPlaySound(soundList.alt_40);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over50":
                if (radioAlt > 110) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 53) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.Fifty) {
                        this.core.soundManager.tryPlaySound(soundList.alt_50);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over100":
                if (radioAlt > 210) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 110) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.OneHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_100);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over200":
                if (radioAlt > 310) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 210) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_200);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over300":
                if (radioAlt > 410) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 310) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.ThreeHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_300);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over400":
                if (radioAlt > 513) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 410) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.FourHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_400);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over500":
                if (radioAlt > 1020) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 513) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.FiveHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_500);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over1000":
                if (radioAlt > 2020) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 1020) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.OneThousand) {
                        this.core.soundManager.tryPlaySound(soundList.alt_1000);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over2000":
                if (radioAlt > 2530) {
                    this.AltCallState.action("up");
                } else if (radioAlt <= 2020) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoThousand) {
                        this.core.soundManager.tryPlaySound(soundList.alt_2000);
                    }
                    this.AltCallState.action("down");
                }
                break;
            case "over2500":
                if (radioAlt <= 2530) {
                    if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_2500);
                    } else if (this.autoCallOutPins & A32NXRadioAutoCallOutFlags.TwentyFiveHundred) {
                        this.core.soundManager.tryPlaySound(soundList.alt_2500b);
                    }
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

    updateAirGroundState(deltaTime, computedAirspeed, radioAlt, pitchAngle) {
        if (!computedAirspeed.isNormalOperation() || !radioAlt.isNormalOperation()) {
            // Stay in current state
            return;
        }

        this.airborneFor5s.write(computedAirspeed.value > 90 && radioAlt.value > 25 && pitchAngle.isNormalOperation() && pitchAngle.value > 5, deltaTime);
        this.airborneFor10s.write(computedAirspeed.value > 90 && radioAlt.value > 25, deltaTime);

        if (this.isAirVsGroundMode) {
            if (radioAlt.value < 25) {
                this.isAirVsGroundMode = false;
                SimVar.SetSimVarValue("L:A32NX_GPWS_GROUND_STATE", "Bool", 1);
            }
        } else {
            if (this.airborneFor5s.read() || this.airborneFor5s.read()) {
                this.isAirVsGroundMode = true;
                SimVar.SetSimVarValue("L:A32NX_GPWS_GROUND_STATE", "Bool", 0);
            }
        }
    }

    updateApproachTakeoffState(computedAirspeed, radioAlt, isGearDown, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected) {
        // TODO: what do we do if computedAirspeed is not NO?
        if (!computedAirspeed.isNormalOperation()) {
            return;
        }

        if (this.isApproachVsTakeoffState) {
            // Switch to TO if we pass below 245 ft mode 4b floor without an alert (i.e gear down and flaps in landing config)
            if (radioAlt.isNormalOperation() && radioAlt.value < 245 && isGearDown && areFlapsInLandingConfig) {
                this.isApproachVsTakeoffState = false;
                SimVar.SetSimVarValue("L:A32NX_GPWS_APPROACH_STATE", "Bool", 0);
            }
        } else {
            const isFirstAlgorithmSatisfied = false;
            // - 4C filter value exceeds 4A alert boundary
            const isSecondAlgorithmSatisfied = this.Mode4MaxRAAlt > this.mode4aUpperBoundary(computedAirspeed.value, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected);

            if ((isFirstAlgorithmSatisfied || !this.isAudioDeclutterEnabled) && isSecondAlgorithmSatisfied) {
                this.isApproachVsTakeoffState = true;
                SimVar.SetSimVarValue("L:A32NX_GPWS_APPROACH_STATE", "Bool", 1);
            }
        }
    }

    mode4aUpperBoundary(computedAirspeed, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected) {
        let expandedBoundary = 1000;
        if (areFlapsInLandingConfig || tcfOperational || tafOperational) {
            expandedBoundary = 500;
        } else if (isOverflightDetected) {
            expandedBoundary = 800;
        }

        return Math.max(500, Math.min(expandedBoundary, 8.333 * computedAirspeed - 1083.33));
    }

    mode4bUpperBoundary(computedAirspeed, areFlapsInLandingConfig, tcfOperational, tafOperational, isOverflightDetected) {
        let expandedBoundary = 1000;
        if (areFlapsInLandingConfig || tcfOperational || tafOperational) {
            expandedBoundary = 245;
        } else if (isOverflightDetected) {
            expandedBoundary = 800;
        }

        return Math.max(245, Math.min(expandedBoundary, 8.333 * computedAirspeed - 1083.33));
    }

    mode4cUpperBoundary(computedAirspeed) {
        return Math.max(500, Math.min(1000, 8.3333 * computedAirspeed.value - 1083.33));
    }

    updateOverflightState(deltaTime) {
        // Need -2200 ft/s to trigger an overflight state
        return this.isOverflightDetected.write(this.RadioAltRate < -2200 * 60, deltaTime);
    }

    isTerrainClearanceFloorOperational(terrPbOff, radioAlt, fmcNavAccuracyHigh) {
        // TODO when ground speed is below 60 kts, always consider fms nav accuracy high
        // where does GS come from?
        return this.isTerrainAwarenessEnabled && !terrPbOff && radioAlt.isNormalOperation() && fmcNavAccuracyHigh;
    }

    isTerrainAwarenessOperational(terrPbOff) {
        // TODO replace placeholders
        const doesTerrainAwarenessUseGeometricAltitude = true;
        const isGeometricAltitudeVfomValid = true;
        const isGeometricAltitudeHilValid = true;
        const geometricAltitudeVfom = 0;
        const isRaimFailureDetected = false;

        return this.isTerrainAwarenessEnabled
            && !terrPbOff &&
            !doesTerrainAwarenessUseGeometricAltitude &&
            isGeometricAltitudeVfomValid &&
            isGeometricAltitudeHilValid &&
            !isRaimFailureDetected &&
            geometricAltitudeVfom < 200;
    }

    updateMode4aInhibited(isGearDownLocked, isFlapsInLandingConfig) {
        if (this.isMode4aInhibited) {
            if (!this.isAirVsGroundMode || !this.isApproachVsTakeoffState) {
                // Reset
                this.isMode4aInhibited = false;
            }
        } else if (this.isAlternateMode4bEnabled) {
            if (isGearDownLocked || isFlapsInLandingConfig) {
                this.isMode4aInhibited = true;
            }
        }
    }

    selectAltitudeRate(inertialVs, baroVs) {
        if (inertialVs.isNormalOperation()) {
            return inertialVs.value;
        } else if (Number.isFinite(this.RadioAltRate)) {
            return this.RadioAltRate;
        } else if (baroVs.isNormalOperation()) {
            return baroVs.value;
        }

        return NaN;
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
                target: "over2000"
            }
        }
    },
    over2000: {
        transitions: {
            down: {
                target: "over1000"
            },
            up: {
                target: "over2500",
            }
        }
    },
    over1000: {
        transitions: {
            down: {
                target: "over500"
            },
            up: {
                target: "over2000"
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
