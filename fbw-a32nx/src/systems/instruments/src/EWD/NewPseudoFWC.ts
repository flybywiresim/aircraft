import { Subject, Subscribable, MappedSubject, ArraySubject } from 'msfssdk';

import { Arinc429Word } from '@shared/arinc429';
import { NXLogicConfirmNode } from '@instruments/common/NXLogic';
import { NXDataStore } from '@shared/persistence';

interface EWDItem {
    flightPhaseInhib: number[],
    simVarIsActive: Subscribable<boolean>,
    whichCodeToReturn: () => any[],
    codesToReturn: string[],
    memoInhibit: () => boolean,
    failure: number,
    sysPage: number,
    side: string
}

interface EWDMessageDict {
    [key: string] : EWDItem
}

export class NewPseudoFWC {
    private toInhibitTimer = new NXLogicConfirmNode(3);

    private ldgInhibitTimer = new NXLogicConfirmNode(3);

    private readonly failuresLeft: string[] = [];

    private readonly failuresRight: string[] = [];

    private readonly allCurrentFailures: string[] = [];

    private recallFailures: string[] = [];

    private memoMessageLeft: ArraySubject<string> = ArraySubject.create([]);

    private memoMessageRight: ArraySubject<string> = ArraySubject.create([]);

    private readonly fwcFlightPhase = Subject.create(-1);

    private readonly flapsIndex = Subject.create(0);

    private readonly computedAirSpeed = Subject.create(Arinc429Word.empty());

    private readonly computedAirSpeedToNearest2 = this.computedAirSpeed.map((it) => Math.round(it.value / 2) * 2);

    /** ENGINE AND THROTTLE */

    private readonly engine1State = Subject.create(0);

    private readonly engine2State = Subject.create(0);

    private readonly N1Eng1 = Subject.create(0);

    private readonly N1Eng2 = Subject.create(0);

    private readonly N1IdleEng1 = Subject.create(0);

    private readonly N1IdleEng2 = Subject.create(0);

    private readonly N1AboveIdle = MappedSubject.create(([n1, idleN1]) => Math.floor(n1) > idleN1, this.N1Eng1, this.N1IdleEng1);

    private readonly N2AboveIdle = MappedSubject.create(([n1, idleN1]) => Math.floor(n1) > idleN1, this.N1Eng2, this.N1IdleEng2);

    private readonly engDualFault = Subject.create(false); // TODO

    private readonly emergencyElectricGeneratorPotential = Subject.create(0);

    private readonly emergencyGeneratorOn = this.emergencyElectricGeneratorPotential.map((it) => it > 0);

    private readonly apuMasterSwitch = Subject.create(0);

    private readonly apuAvail = Subject.create(0);

    private readonly apuBleedValveOpen = Subject.create(false);

    private readonly radioAlt = Subject.create(0);

    private readonly fac1Failed = Subject.create(0);

    private readonly toMemo = Subject.create(0);

    private readonly ldgMemo = Subject.create(0);

    private readonly autoBrake = Subject.create(0);

    private readonly fuel = Subject.create(0);

    private readonly usrStartRefueling = Subject.create(0);

    private readonly engSelectorPosition = Subject.create(0);

    private readonly eng1AntiIce = Subject.create(false);

    private readonly eng2AntiIce = Subject.create(false);

    /* FUEL */

    private readonly leftOuterInnerValve = Subject.create(0);

    private readonly fuelXFeedPBOn = Subject.create(false);

    private readonly rightOuterInnerValve = Subject.create(0);

    /* HYDRAULICS */

    private readonly hydPTU = Subject.create(false);

    private readonly ratDeployed = Subject.create(0);

    /* FCTL */

    private spoilersArmed = Subject.create(false);

    private speedBrakeCommand = Subject.create(false);

    private showTakeoffInhibit = Subject.create(false);

    private showLandingInhibit = Subject.create(false);

    /* ADIRS */

    private readonly adirsRemainingAlignTime = Subject.create(0);

    private readonly adiru1State = Subject.create(0);

    private readonly adiru2State = Subject.create(0);

    private readonly adiru3State = Subject.create(0);

    /* LANDING GEAR AND LIGHTS */

    private readonly aircraftOnGround = Subject.create(0);

    private readonly brakeFan = Subject.create(false);

    private readonly landingLight2Retracted = Subject.create(false);

    private readonly landingLight3Retracted = Subject.create(false);

    private readonly parkBrake = Subject.create(false);

    private readonly nwSteeringDisc = Subject.create(false);

    /* OTHER STUFF */

    private readonly airKnob = Subject.create(0);

    private readonly attKnob = Subject.create(0);

    private readonly compMesgCount = Subject.create(0);

    private readonly dmcSwitchingKnob = Subject.create(0);

    private readonly gpwsFlaps3 = Subject.create(false);

    private readonly gpwsFlapMode = Subject.create(0);

    private readonly gpwsTerrOff = Subject.create(false);

    private readonly ndXfrKnob = Subject.create(0);

    private readonly manLandingElevation = Subject.create(0);

    private readonly noSmoking = Subject.create(0);

    private readonly noSmokingSwitchPosition = Subject.create(0);

    private readonly predWSOn = Subject.create(false);

    private readonly seatBelt = Subject.create(0);

    private readonly strobeLightsOn = Subject.create(0);

    private readonly tcasSensitivity = Subject.create(0);

    private readonly wingAntiIce = Subject.create(false);

    private readonly voiceVhf3 = Subject.create(0);

    /* SETTINGS */

    private readonly configPortableDevices = Subject.create('0');

    constructor() {
        this.memoMessageLeft.sub((i, t, v) => {
            [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${value}`, 'string', '');
            });
            //   if (Array.isArray(v) && v.length > 0) {
            this.memoMessageLeft.getArray().forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`, 'string', value);
            });
            //  }
        });

        this.memoMessageRight.sub((i, t, v) => {
            [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${value}`, 'string', '');
            });
            //  if (v.length > 0 && Array.isArray(v)) {
            this.memoMessageRight.getArray().forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${index + 1}`, 'string', value);
            });
            //   }
        });
    }

    masterWarning(toggle: number) {
        SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'Bool', toggle);
    }

    masterCaution(toggle: number) {
        SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'Bool', toggle);
    }

    mapOrder(array, order): [] {
        array.sort((a, b) => {
            if (order.indexOf(a) > order.indexOf(b)) {
                return 1;
            }
            return -1;
        });
        return array;
    }

    private adirsMessage1(adirs, engineRunning) {
        let rowChoice = 0;

        switch (true) {
        case (Math.ceil(adirs / 60) >= 7 && !engineRunning):
            rowChoice = 0;
            break;
        case (Math.ceil(adirs / 60) >= 7 && engineRunning):
            rowChoice = 1;
            break;
        case (Math.ceil(adirs / 60) === 6 && !engineRunning):
            rowChoice = 2;
            break;
        case (Math.ceil(adirs / 60) === 6 && engineRunning):
            rowChoice = 3;
            break;
        case (Math.ceil(adirs / 60) === 5 && !engineRunning):
            rowChoice = 4;
            break;
        case (Math.ceil(adirs / 60) === 5 && engineRunning):
            rowChoice = 5;
            break;
        case (Math.ceil(adirs / 60) === 4 && !engineRunning):
            rowChoice = 6;
            break;
        case (Math.ceil(adirs / 60) === 4 && engineRunning):
            rowChoice = 7;
            break;
        default:
            break;
        }

        return rowChoice;
    }

    private adirsMessage2(adirs, engineRunning) {
        let rowChoice = 0;

        switch (true) {
        case (Math.ceil(adirs / 60) === 3 && !engineRunning):
            rowChoice = 0;
            break;
        case (Math.ceil(adirs / 60) === 3 && engineRunning):
            rowChoice = 1;
            break;
        case (Math.ceil(adirs / 60) === 2 && !engineRunning):
            rowChoice = 2;
            break;
        case (Math.ceil(adirs / 60) === 2 && engineRunning):
            rowChoice = 3;
            break;
        case (Math.ceil(adirs / 60) === 1 && !engineRunning):
            rowChoice = 4;
            break;
        case (Math.ceil(adirs / 60) === 1 && engineRunning):
            rowChoice = 5;
            break;
        default:
            break;
        }

        return rowChoice;
    }

    onUpdate(deltaTime) {
        // Inputs update

        const flightPhaseInhibitOverride = SimVar.GetSimVarValue('L:A32NX_FWC_INHIBOVRD', 'bool');

        const fwc1Normal = SimVar.GetSimVarValue('L:A32NX_FWS_FWC_1_NORMAL', 'bool');
        const fwc2Normal = SimVar.GetSimVarValue('L:A32NX_FWS_FWC_2_NORMAL', 'bool');

        if (!fwc1Normal && !fwc2Normal) {
            this.memoMessageLeft.set([
                '0',
                '310000701',
                '310000702',
                '310000703',
            ]);
            this.memoMessageRight.set([
                '310000704',
                '310000705',
                '310000706',
                '310000707',
                '310000708',
                '310000709',
            ]);
            this.recallFailures = [];
            return;
        }

        this.fwcFlightPhase.set(SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum'));

        this.showTakeoffInhibit.set(this.toInhibitTimer.write([3, 4, 5].includes(this.fwcFlightPhase.get()) && !flightPhaseInhibitOverride, deltaTime));
        this.showLandingInhibit.set(this.ldgInhibitTimer.write([7, 8].includes(this.fwcFlightPhase.get()) && !flightPhaseInhibitOverride, deltaTime));

        this.flapsIndex.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'number'));

        this.computedAirSpeed.set(Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED'));

        /* ENGINE AND THROTTLE */

        this.engine1State.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'Enum'));
        this.engine1State.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Enum'));
        this.N1Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'number'));
        this.N1Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'number'));
        this.N1IdleEng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1:1', 'number'));
        this.N1IdleEng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1:2', 'number'));

        this.emergencyElectricGeneratorPotential.set(SimVar.GetSimVarValue('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number'));

        this.apuMasterSwitch.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool'));

        this.apuAvail.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool'));
        this.apuBleedValveOpen.set(SimVar.GetSimVarValue('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool'));

        this.radioAlt.set(SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND MINUS CG', 'feet'));

        this.fac1Failed.set(SimVar.GetSimVarValue('L:A32NX_FBW_FAC_FAILED:1', 'boost psi'));

        this.toMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_TOMEMO', 'bool'));

        this.autoBrake.set(SimVar.GetSimVarValue('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum'));

        this.ldgMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_LDGMEMO', 'bool'));

        this.fuel.set(SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:9', 'percent'));
        this.usrStartRefueling.set(SimVar.GetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', 'bool'));
        this.engSelectorPosition.set(SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum'));
        this.eng1AntiIce.set(SimVar.GetSimVarValue('ENG ANTI ICE:1', 'bool'));
        this.eng2AntiIce.set(SimVar.GetSimVarValue('ENG ANTI ICE:2', 'bool'));

        /* HYDRAULICS */

        this.hydPTU.set(SimVar.GetSimVarValue('L:A32NX_HYD_PTU_ON_ECAM_MEMO', 'Bool'));
        this.ratDeployed.set(SimVar.GetSimVarValue('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100'));

        /* ADIRS */

        this.adirsRemainingAlignTime.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'Seconds'));

        this.adiru1State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_1_STATE', 'enum'));
        this.adiru2State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_2_STATE', 'enum'));
        this.adiru3State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_3_STATE', 'enum'));

        /* LANDING GEAR AND LIGHTS */

        // const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 500);
        // const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 500);
        // const aircraftOnGround = left1LandingGear === 1 || right1LandingGear === 1;
        // FIXME The landing gear triggers the dual engine failure on loading
        this.aircraftOnGround.set(SimVar.GetSimVarValue('SIM ON GROUND', 'Bool'));
        this.brakeFan.set(SimVar.GetSimVarValue('L:A32NX_BRAKE_FAN', 'bool'));
        this.landingLight2Retracted.set(SimVar.GetSimVarValue('L:LANDING_2_Retracted', 'bool'));
        this.landingLight3Retracted.set(SimVar.GetSimVarValue('L:LANDING_3_Retracted', 'bool'));
        this.parkBrake.set(SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool'));
        this.nwSteeringDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool'));

        /* OTHER STUFF */

        this.airKnob.set(SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum'));
        this.attKnob.set(SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum'));
        this.compMesgCount.set(SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'number'));
        this.dmcSwitchingKnob.set(SimVar.GetSimVarValue('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'enum'));
        this.manLandingElevation.set(SimVar.GetSimVarValue('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'number'));
        this.seatBelt.set(SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'));
        this.ndXfrKnob.set(SimVar.GetSimVarValue('L:A32NX_ECAM_ND_XFR_SWITCHING_KNOB', 'enum'));
        this.noSmoking.set(SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool'));
        this.noSmokingSwitchPosition.set(SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'Enum'));
        this.strobeLightsOn.set(SimVar.GetSimVarValue('L:LIGHTING_STROBE_0', 'Bool'));
        this.gpwsFlaps3.set(SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'Bool'));
        this.gpwsFlapMode.set(SimVar.GetSimVarValue('L:A32NX_GPWS_FLAP_OFF', 'Bool'));
        this.gpwsTerrOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_TERR_OFF', 'Bool'));
        this.predWSOn.set(SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_Position', 'Bool'));
        this.tcasSensitivity.set(SimVar.GetSimVarValue('L:A32NX_TCAS_SENSITIVITY', 'Enum'));
        this.wingAntiIce.set(SimVar.GetSimVarValue('L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_SELECTED', 'bool'));
        this.voiceVhf3.set(SimVar.GetSimVarValue('A:COM ACTIVE FREQUENCY:3', 'number'));

        /* FUEL */
        this.leftOuterInnerValve.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:4', 'Bool'));
        this.fuelXFeedPBOn.set(SimVar.GetSimVarValue('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_XFEED_Pressed', 'bool'));
        this.rightOuterInnerValve.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:5', 'Bool'));

        /* F/CTL */
        const fcdc1DiscreteWord1 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_1');
        const fcdc2DiscreteWord1 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_1');
        const fcdc1DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_2');
        const fcdc2DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_2');
        const fcdc1DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_3');
        const fcdc2DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_3');
        const fcdc1DiscreteWord4 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_4');
        const fcdc2DiscreteWord4 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_4');

        this.spoilersArmed.set(fcdc1DiscreteWord4.getBitValueOr(27, false) || fcdc2DiscreteWord4.getBitValueOr(27, false));
        this.speedBrakeCommand.set(fcdc1DiscreteWord4.getBitValueOr(28, false) || fcdc2DiscreteWord4.getBitValueOr(28, false));

        /* SETTINGS */

        this.configPortableDevices.set(NXDataStore.get('CONFIG_USING_PORTABLE_DEVICES', '0'));

        // Output logic

        const flightPhase = this.fwcFlightPhase.get();
        let tempMemoArrayLeft:string[] = [];
        let tempMemoArrayRight:string[] = [];
        const allFailureKeys: string[] = [];
        let tempFailureArrayLeft:string[] = [];
        let failureKeysLeft: string[] = this.failuresLeft;
        let recallFailureKeys: string[] = this.recallFailures;
        let tempFailureArrayRight:string[] = [];
        const failureKeysRight: string[] = this.failuresRight;
        let leftFailureSystemCount = 0;
        let rightFailureSystemCount = 0;

        // Update failuresLeft list in case failure has been resolved
        for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
            if (!value.simVarIsActive.get() || value.flightPhaseInhib.some((e) => e === flightPhase)) {
                failureKeysLeft = failureKeysLeft.filter((e) => e !== key);
                recallFailureKeys = this.recallFailures.filter((e) => e !== key);
            }
        }

        this.recallFailures.length = 0;
        this.recallFailures.push(...recallFailureKeys);

        // Failures first
        for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
            if (value.simVarIsActive.get() && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                if (value.side === 'LEFT') {
                    allFailureKeys.push(key);
                }

                if ((value.side === 'LEFT' && !this.failuresLeft.includes(key) && !recallFailureKeys.includes(key)) || (value.side === 'RIGHT' && !this.failuresRight.includes(key))) {
                    if (value.side === 'LEFT') {
                        failureKeysLeft.push(key);
                    } else {
                        failureKeysRight.push(key);
                    }

                    if (value.failure === 3) {
                        this.masterWarning(1);
                    }
                    if (value.failure === 2) {
                        this.masterCaution(1);
                    }
                }/*  else if (![eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest].every((e) => e === 0)) {
                    this.masterWarning(1);
                } */

                const newCode: string[] = [];
                if (!recallFailureKeys.includes(key)) {
                    const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);

                    for (const e of codeIndex) {
                        newCode.push(value.codesToReturn[e]);
                    }

                    if (value.sysPage > -1) {
                        if (value.side === 'LEFT') {
                            leftFailureSystemCount++;
                        } else {
                            rightFailureSystemCount++;
                        }
                    }
                }
                if (value.side === 'LEFT') {
                    tempFailureArrayLeft = tempFailureArrayLeft.concat(newCode);
                } else {
                    tempFailureArrayRight = tempFailureArrayRight.concat(newCode);
                }

                if (value.sysPage > -1) {
                    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
                }
            }
        }

        const failLeft = tempFailureArrayLeft.length > 0;

        const mesgFailOrderLeft: string[] = [];
        const mesgFailOrderRight: string[] = [];

        for (const [, value] of Object.entries(this.ewdMessageFailures)) {
            if (value.side === 'LEFT') {
                mesgFailOrderLeft.push(...value.codesToReturn);
            } else {
                mesgFailOrderRight.push(...value.codesToReturn);
            }
        }

        const orderedFailureArrayLeft = this.mapOrder(tempFailureArrayLeft, mesgFailOrderLeft);
        const orderedFailureArrayRight = this.mapOrder(tempFailureArrayRight, mesgFailOrderRight);

        this.allCurrentFailures.length = 0;
        this.allCurrentFailures.push(...allFailureKeys);

        this.failuresLeft.length = 0;
        this.failuresLeft.push(...failureKeysLeft);

        this.failuresRight.length = 0;
        this.failuresRight.push(...failureKeysRight);

        if (tempFailureArrayLeft.length > 0) {
            this.memoMessageLeft.set(orderedFailureArrayLeft);
        }

        for (const [, value] of Object.entries(this.ewdMessageMemos)) {
            if (value.simVarIsActive.get() && !(value.memoInhibit()) && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                const newCode: string[] = [];

                const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);
                codeIndex.forEach((e: number) => {
                    newCode.push(value.codesToReturn[e]);
                });

                if (value.side === 'LEFT' && !failLeft) {
                    tempMemoArrayLeft = tempMemoArrayLeft.concat(newCode);
                }
                if (value.side === 'RIGHT') {
                    const tempArrayRight = tempMemoArrayRight.filter((e) => !value.codesToReturn.includes(e));
                    tempMemoArrayRight = tempArrayRight.concat(newCode);
                }

                if (value.sysPage > -1) {
                    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
                }
            }
        }

        const mesgOrderLeft: string[] = [];
        const mesgOrderRight: string[] = [];

        for (const [, value] of Object.entries(this.ewdMessageMemos)) {
            if (value.side === 'LEFT') {
                mesgOrderLeft.push(...value.codesToReturn);
            } else {
                mesgOrderRight.push(...value.codesToReturn);
            }
        }

        const orderedMemoArrayLeft = this.mapOrder(tempMemoArrayLeft, mesgOrderLeft);
        let orderedMemoArrayRight = this.mapOrder(tempMemoArrayRight, mesgOrderRight);

        if (!failLeft) {
            this.memoMessageLeft.set(orderedMemoArrayLeft);

            if (orderedFailureArrayRight.length === 0) {
                this.masterCaution(0);
                this.masterWarning(0);
            }
        }

        if (leftFailureSystemCount + rightFailureSystemCount === 0) {
            SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', -1);
        }

        if (orderedFailureArrayRight.length > 0) {
            // Right side failures need to be inserted between special lines
            // and the rest of the memo
            const specialLines = ['000014001', '000015001', '000035001', '000036001', '220001501', '220002101'];
            const filteredMemo = orderedMemoArrayRight.filter((e) => !specialLines.includes(e));
            const specLinesInMemo = orderedMemoArrayRight.filter((e) => specialLines.includes(e));
            if (specLinesInMemo.length > 0) {
                // @ts-expect-error
                orderedMemoArrayRight = [...specLinesInMemo, ...orderedFailureArrayRight, ...filteredMemo];
            } else {
                orderedMemoArrayRight = [...orderedFailureArrayRight, ...orderedMemoArrayRight];
            }
        }

        this.memoMessageRight.set(orderedMemoArrayRight);
    }

    ewdMessageFailures: EWDMessageDict = {
        3400210: { // OVERSPEED FLAPS FULL
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 5 && computedAirSpeedToNearest2 > 181, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340021001', '340021002'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400220: { // OVERSPEED FLAPS 3
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 4 && computedAirSpeedToNearest2 > 189, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340022001', '340022002'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400230: { // OVERSPEED FLAPS 2
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject.create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 3 && computedAirSpeedToNearest2 > 203, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340023001', '340023002'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400235: { // OVERSPEED FLAPS 1+F
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject.create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 2 && computedAirSpeedToNearest2 > 219, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340023501', '340023502'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400240: { // OVERSPEED FLAPS 1
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject.create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 1 && computedAirSpeedToNearest2 > 233, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340024001', '340024002'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        7700027: { // DUAL ENGINE FAILURE
            flightPhaseInhib: [],
            simVarIsActive: this.engDualFault,
            whichCodeToReturn: () => [
                0,
                !(this.emergencyGeneratorOn.get()) ? 1 : null,
                5,
                !(this.apuMasterSwitch.get() === 1 || this.apuAvail.get() === 1) && this.radioAlt.get() < 2500 ? 6 : null,
                (this.N1AboveIdle.get() || this.N2AboveIdle.get()) ? 7 : null,
                this.fac1Failed.get() === 1 ? 8 : null,
                9, 10, 11,
            ],
            codesToReturn: ['770002701', '770002702', '770002703', '770002704', '770002705', '770002706', '770002707', '770002708', '770002709', '770002710', '770002711', '770002712'],
            memoInhibit: () => false,
            failure: 3,
            sysPage: 0,
            side: 'LEFT',
        },
    }

    ewdMessageMemos: EWDMessageDict = {
        '0000010': { // T.O MEMO
            flightPhaseInhib: [1, 3, 6, 10],
            simVarIsActive: this.toMemo.map((t) => !!t),
            whichCodeToReturn: () => [
                this.autoBrake.get() === 3 ? 1 : 0,
                SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool') === 1
                && SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1 ? 3 : 2,
                SimVar.GetSimVarValue('L:A32NX_CABIN_READY', 'bool') ? 5 : 4,
                this.spoilersArmed.get() ? 7 : 6,
                SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') >= 1
                && SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') <= 3 ? 9 : 8,
                SimVar.GetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool') ? 11 : 10,
            ],
            codesToReturn: ['000001001', '000001002', '000001003', '000001004', '000001005', '000001006', '000001007', '000001008', '000001009', '000001010', '000001011', '000001012'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000020': { // LANDING MEMO
            flightPhaseInhib: [1, 2, 3, 4, 5, 9, 10],
            simVarIsActive: this.ldgMemo.map((t) => !!t),
            whichCodeToReturn: () => [
                SimVar.GetSimVarValue('GEAR HANDLE POSITION', 'bool') ? 1 : 0,
                SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'enum') !== 2
                && SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1 ? 3 : 2,
                SimVar.GetSimVarValue('L:A32NX_CABIN_READY', 'bool') ? 5 : 4,
                this.spoilersArmed.get() ? 7 : 6,
                !SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') && SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') !== 4 ? 8 : null,
                !SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') && SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 4 ? 9 : null,
                SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') === 1 && SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') !== 3 ? 10 : null,
                SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') === 1 && SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 3 ? 11 : null,
            ],
            codesToReturn: ['000002001', '000002002', '000002003', '000002004', '000002005', '000002006', '000002007', '000002008', '000002009', '000002010', '000002011', '000002012'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000050': { // REFUELING
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([fuel, usrStartRefueling]) => !!(fuel === 100 || usrStartRefueling),
                this.fuel, this.usrStartRefueling),

            whichCodeToReturn: () => [0],
            codesToReturn: ['000005001'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000030': { // IR IN ALIGN
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: MappedSubject.create(([adirsRemainingAlignTime, adiru1State, adiru2State, adiru3State]) => {
                const remainingTimeAbove240 = adirsRemainingAlignTime >= 240;
                const allInState1 = adiru1State === 1 && adiru2State === 1 && adiru3State === 1;

                return remainingTimeAbove240 && allInState1;
            }, this.adirsRemainingAlignTime, this.adiru1State, this.adiru2State, this.adiru3State),
            whichCodeToReturn: () => [
                this.adirsMessage1(
                    this.adirsRemainingAlignTime.get(),
                    (this.engine1State.get() > 0 && this.engine1State.get() < 4) || (this.engine2State.get() > 0 && this.engine2State.get() < 4),
                ),
            ],
            codesToReturn: ['000003001', '000003002', '000003003', '000003004', '000003005', '000003006', '000003007', '000003008'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000031': { // IR IN ALIGN
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: MappedSubject.create(([adirsRemainingAlignTime, adiru1State, adiru2State, adiru3State]) => {
                const remainingTimeAbove0 = adirsRemainingAlignTime > 0;
                const remainingTimeBelow240 = adirsRemainingAlignTime < 240;
                const allInState1 = adiru1State === 1 && adiru2State === 1 && adiru3State === 1;

                return remainingTimeAbove0 && remainingTimeBelow240 && allInState1;
            }, this.adirsRemainingAlignTime, this.adiru1State, this.adiru2State, this.adiru3State),
            whichCodeToReturn: () => [
                this.adirsMessage2(
                    this.adirsRemainingAlignTime.get(),
                    (this.engine1State.get() > 0 && this.engine1State.get() < 4) || (this.engine2State.get() > 0 && this.engine2State.get() < 4),
                ),
            ],
            codesToReturn: ['000003101', '000003102', '000003103', '000003104', '000003105', '000003106', '000003107', '000003108'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000055': { // SPOILERS ARMED
            flightPhaseInhib: [],
            simVarIsActive: this.spoilersArmed,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000005501'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000080': { // SEAT BELTS
            flightPhaseInhib: [],
            simVarIsActive: this.seatBelt.map((v) => !!v),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000008001'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000090': { // NO SMOKING
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([noSmoking, configPortableDevices]) => noSmoking === 1 && !configPortableDevices, this.noSmoking, this.configPortableDevices),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000009001'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000095': { // PORTABLE DEVICES
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([noSmoking, configPortableDevices]) => noSmoking === 1 && !!configPortableDevices, this.noSmoking, this.configPortableDevices),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000009501'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000100': { // STROBE LIGHT OFF
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([aircraftOnGround, strobeLightsOn]) => !!(!aircraftOnGround && strobeLightsOn === 2), this.aircraftOnGround, this.strobeLightsOn),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000010001'],
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000105': { // OUTR TK FUEL XFRD
            flightPhaseInhib: [], // Plus check that outer tanks not empty
            simVarIsActive: MappedSubject.create(
                ([leftOuterInnerValve, rightOuterInnerValve]) => !!leftOuterInnerValve || !!rightOuterInnerValve, this.leftOuterInnerValve, this.rightOuterInnerValve,
            ),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000010501'], // config memo
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000305': { // GPWS FLAP MODE OFF
            flightPhaseInhib: [],
            simVarIsActive: this.gpwsFlapMode.map((v) => !!v),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000030501'], // Not inhibited
            memoInhibit: () => (this.toMemo.get() === 1 || this.ldgMemo.get() === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000140': { // T.O. INHIBIT
            flightPhaseInhib: [],
            simVarIsActive: this.showTakeoffInhibit,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000014001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000150': { // LDG INHIBIT
            flightPhaseInhib: [],
            simVarIsActive: this.showLandingInhibit,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000015001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        }, /*
        '0000350': // LAND ASAP RED
        {
            flightPhaseInhib: [],
            simVarIsActive: !!landASAPRed,
            whichCodeToReturn: [0],
            codesToReturn: ['000035001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000360': // LAND ASAP AMBER
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(!landASAPRed && !aircraftOnGround && (
                engine1State === 0
                || engine2State === 0
            )),
            whichCodeToReturn: [0],
            codesToReturn: ['000036001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        }, */
        '0000060': { // SPEED BRK
            flightPhaseInhib: [1, 8, 9, 10],
            simVarIsActive: this.speedBrakeCommand,
            whichCodeToReturn: () => [![6, 7].includes(this.fwcFlightPhase.get()) ? 1 : 0],
            codesToReturn: ['000006001', '000006002'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000200': { // PARK BRK
            flightPhaseInhib: [3, 4, 5, 6, 7, 8],
            simVarIsActive: this.parkBrake,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000020001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000040': { // NW STRG DISC
            flightPhaseInhib: [],
            simVarIsActive: this.nwSteeringDisc,
            whichCodeToReturn: () => [this.engine1State.get() > 0 || this.engine2State.get() > 0 ? 1 : 0],
            codesToReturn: ['000004001', '000004002'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000160': { // PTU ON
            flightPhaseInhib: [],
            simVarIsActive: this.hydPTU,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000016001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000210': { // RAT OUT
            flightPhaseInhib: [],
            simVarIsActive: this.ratDeployed.map((v) => v > 0),
            whichCodeToReturn: () => [[1, 2].includes(this.fwcFlightPhase.get()) ? 1 : 0],
            codesToReturn: ['000021001', '000021002'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000070': { // IGNITION
            flightPhaseInhib: [],
            simVarIsActive: this.engSelectorPosition.map((v) => v === 2),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000007001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000540': { // PRED W/S OFF
            flightPhaseInhib: [1, 10],
            simVarIsActive: this.predWSOn.map((v) => !v),
            whichCodeToReturn: () => [[3, 4, 5, 7, 8, 9].includes(this.fwcFlightPhase.get()) || SimVar.GetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool') ? 1 : 0],
            codesToReturn: ['000054001', '000054002'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000545': { // TERR OFF
            flightPhaseInhib: [1, 10],
            simVarIsActive: this.gpwsTerrOff,
            whichCodeToReturn: () => [[3, 4, 5, 7, 8, 9].includes(this.fwcFlightPhase.get()) || SimVar.GetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool') ? 1 : 0],
            codesToReturn: ['000054501', '000054502'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000320': { // TCAS STBY
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([tcasSensitivity, fwcFlightPhase]) => tcasSensitivity === 1 && fwcFlightPhase !== 6, this.tcasSensitivity, this.fwcFlightPhase),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000032001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000325': { // TCAS STBY in flight
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([tcasSensitivity, fwcFlightPhase]) => tcasSensitivity === 1 && fwcFlightPhase === 6, this.tcasSensitivity, this.fwcFlightPhase),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000032501'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000552': { // COMPANY MESSAGE
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: this.compMesgCount.map((v) => v > 0),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000055201'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000260': { // ENG ANTI ICE
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: MappedSubject.create(([eng1AntiIce, eng2AntiIce]) => eng1AntiIce || eng2AntiIce, this.eng1AntiIce, this.eng2AntiIce),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000026001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000270': { // WING ANTI ICE
            flightPhaseInhib: [],
            simVarIsActive: this.wingAntiIce,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000027001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        }, /*
        '0000275': { // ICE NOT DETECTED
            flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
            simVarIsActive: iceNotDetTimer2.read() && !aircraftOnGround,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000027501'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        }, */
        '0000170': { // APU AVAIL
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && !apuBleedValveOpen, this.apuAvail, this.apuBleedValveOpen),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000017001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000180': { // APU BLEED
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && apuBleedValveOpen, this.apuAvail, this.apuBleedValveOpen),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000018001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000190': { // LDG LT
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(
                ([landingLight2Retracted, landingLight3Retracted]) => !landingLight2Retracted || !landingLight3Retracted, this.landingLight2Retracted, this.landingLight3Retracted,
            ),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000019001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000220': { // BRAKE FAN
            flightPhaseInhib: [],
            simVarIsActive: this.brakeFan,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000022001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000290': { // SWITCHING PNL
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([ndXfrKnob, dmcSwitchingKnob]) => ndXfrKnob !== 1 || dmcSwitchingKnob !== 1, this.ndXfrKnob, this.dmcSwitchingKnob),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000029001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000300': { // GPWS FLAPS 3
            flightPhaseInhib: [],
            simVarIsActive: this.gpwsFlaps3,
            whichCodeToReturn: () => [0],
            codesToReturn: ['000030001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000022': { // AUTOBRAKE
            flightPhaseInhib: [],
            simVarIsActive: this.fwcFlightPhase.map((v) => v === 7 || v === 8),
            whichCodeToReturn: () => [this.autoBrake.get() - 1],
            codesToReturn: ['000002201', '000002202', '000002203', '000002204'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000230': { // MAN LANDING ELEVATION
            flightPhaseInhib: [],
            simVarIsActive: this.manLandingElevation.map((v) => v > 0),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000023001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000250': { // FUEL X FEED
            flightPhaseInhib: [],
            simVarIsActive: this.fuelXFeedPBOn,
            whichCodeToReturn: () => [[3, 4, 5].includes(this.fwcFlightPhase.get()) ? 1 : 0],
            codesToReturn: ['000025001', '000025002'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000680': { // ADIRS SWTG
            flightPhaseInhib: [],
            simVarIsActive: MappedSubject.create(([airKnob, attKnob]) => attKnob !== 1 || airKnob !== 1, this.airKnob, this.attKnob),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000068001'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000567': { // VHF3 VOICE
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: this.voiceVhf3.map((v) => v !== 0),
            whichCodeToReturn: () => [0],
            codesToReturn: ['000056701'],
            memoInhibit: () => false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
    };
}
