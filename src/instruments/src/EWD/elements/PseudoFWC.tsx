import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { NXDataStore } from '@shared/persistence';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useUpdate } from '@instruments/common/hooks';

const mapOrder = (array, order) => {
    array.sort((a, b) => {
        if (order.indexOf(a) > order.indexOf(b)) {
            return 1;
        }
        return -1;
    });
    return array;
};

const adirsMessage1 = (adirs, engineRunning) => {
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
};

const adirsMessage2 = (adirs, engineRunning) => {
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
};

const PseudoFWC: React.FC = () => {
    const [memoMessageLeft, setMemoMessageLeft] = useState<string[]>([]);
    const [memoMessageRight, setMemoMessageRight] = useState<string[]>([]);
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);

    /* SETTINGS */
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const configPortableDevices = parseInt(NXDataStore.get('CONFIG_USING_PORTABLE_DEVICES', '0'));

    /* ANTI-ICE */
    const [eng1AntiIce] = useSimVar('ENG ANTI ICE:1', 'bool', 500);
    const [eng2AntiIce] = useSimVar('ENG ANTI ICE:2', 'bool', 500);
    const [wingAntiIce] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_WING_Pressed', 'bool', 500);

    /* ELECTRICAL */
    const [engine1Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL', 'bool', 500);
    const [engine2Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL', 'bool', 500);
    const [emergencyElectricGeneratorPotential] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number', 500);
    const emergencyGeneratorOn = emergencyElectricGeneratorPotential > 0 ? 1 : 0;

    /* ENGINE AND THROTTLE */

    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500);
    const [throttle1PositionActual] = useSimVar('L:XMLVAR_Throttle1Position', 'number', 100);
    const [throttle2PositionActual] = useSimVar('L:XMLVAR_Throttle2Position', 'number', 100);
    const throttle1Position = Math.floor(throttle1PositionActual);
    const throttle2Position = Math.floor(throttle2PositionActual);
    const [engine1ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:1', 'bool', 500);
    const [engine2ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:2', 'bool', 500);
    const [N1Eng1] = useSimVar('L:A32NX_ENGINE_N1:1', 'number', 500);
    const [N1Eng2] = useSimVar('L:A32NX_ENGINE_N1:2', 'number', 500);
    const [N1IdleEng1] = useSimVar('L:A32NX_ENGINE_IDLE_N1:1', 'number', 500);
    const [N1IdleEng2] = useSimVar('L:A32NX_ENGINE_IDEL_N1:2', 'number', 500);
    const N1AboveIdle = Math.floor(N1Eng1) > N1IdleEng1 ? 1 : 0;
    const N2AboveIdle = Math.floor(N1Eng2) > N1IdleEng2 ? 1 : 0;
    const [autothrustLeverWarningFlex] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX', 'bool', 500);
    const [autothrustLeverWarningTOGA] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', 'bool', 500);
    const thrustLeverNotSet = autothrustLeverWarningFlex === 1 || autothrustLeverWarningTOGA === 1;
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'enum', 1000);

    /* FIRE */

    const [fireButton1] = useSimVar('L:A32NX_FIRE_BUTTON_ENG1', 'bool', 500);
    const [fireButton2] = useSimVar('L:A32NX_FIRE_BUTTON_ENG2', 'bool', 500);
    const [fireButtonAPU] = useSimVar('L:A32NX_FIRE_BUTTON_APU', 'bool', 500);
    const [eng1FireTest] = useSimVar('L:A32NX_FIRE_TEST_ENG1', 'bool', 500);
    const [eng2FireTest] = useSimVar('L:A32NX_FIRE_TEST_ENG2', 'bool', 500);
    const [apuFireTest] = useSimVar('L:A32NX_FIRE_TEST_APU', 'bool', 500);
    const [eng1Agent1PB] = useSimVar('L:A32NX_FIRE_ENG1_AGENT1_Discharge', 'bool', 500);
    const [eng1Agent2PB] = useSimVar('L:A32NX_FIRE_ENG1_AGENT2_Discharge', 'bool', 500);
    const [eng2Agent1PB] = useSimVar('L:A32NX_FIRE_ENG2_AGENT1_Discharge', 'bool', 500);
    const [eng2Agent2PB] = useSimVar('L:A32NX_FIRE_ENG2_AGENT2_Discharge', 'bool', 500);
    const [apuAgentPB] = useSimVar('L:A32NX_FIRE_APU_AGENT1_Discharge', 'bool', 500);

    const [timerEng1Agent1Timer, setTimerEng1Agent1Timer] = useState<number>(-1);
    const [timerEng1Agent2Timer, setTimerEng1Agent2Timer] = useState<number>(-1);
    const [agent1Eng1Discharge, setAgent1Eng1Discharge] = useState(false);
    const [agent2Eng1Discharge, setAgent2Eng1Discharge] = useState(false);

    const [timerEng2Agent1Timer, setTimerEng2Agent1Timer] = useState<number>(-1);
    const [timerEng2Agent2Timer, setTimerEng2Agent2Timer] = useState<number>(-1);
    const [agent1Eng2Discharge, setAgent1Eng2Discharge] = useState(false);
    const [agent2Eng2Discharge, setAgent2Eng2Discharge] = useState(false);

    const [agentApuAgentTimer, setApuAgentTimer] = useState<number>(-1);
    const [agentAPUDischarge, setAgentAPUDischarge] = useState(false);

    const [cargoFireTest] = useSimVar('L:A32NX_FIRE_TEST_CARGO', 'bool', 500);
    const [cargoFireAgentDisch] = useSimVar('L:A32NX_CARGOSMOKE_FWD_DISCHARGED', 'bool', 500);

    // Remember all these run once so need to include fireButton1 === 1 && !eng1FireTest
    useEffect(() => {
        if (!eng1FireTest) {
            setTimerEng1Agent1Timer(10);
        }
    }, [fireButton1]);

    useEffect(() => {
        if (!eng1FireTest) {
            setTimerEng1Agent2Timer(30);
        }
    }, [eng1Agent1PB]);

    useEffect(() => {
        if (!eng2FireTest) {
            console.log('Setting timer for Eng2 Agent 1');
            setTimerEng2Agent1Timer(10);
        }
    }, [fireButton2]);

    useEffect(() => {
        if (!eng2FireTest) {
            setTimerEng2Agent2Timer(30);
        }
    }, [eng2Agent1PB]);

    useEffect(() => {
        if (!apuFireTest) {
            setApuAgentTimer(10);
        }
    }, [fireButtonAPU]);

    useEffect(() => {
        console.log('FireTest');
        if (eng1FireTest === 0 && eng2FireTest === 0 && apuFireTest === 0 && cargoFireTest === 0) {
            masterWarning(0);
        }
    }, [eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest]);

    useUpdate((deltaTime) => {
        if (fireButton1 === 1 && timerEng1Agent1Timer !== -1) {
            if (timerEng1Agent1Timer > 0) {
                if (deltaTime < 1000) {
                    setTimerEng1Agent1Timer(timerEng1Agent1Timer - (deltaTime / 1000));
                }
            } else {
                setTimerEng1Agent1Timer(-1);
                setAgent1Eng1Discharge(true);
            }
        }
        if (agent1Eng1Discharge && timerEng1Agent2Timer !== -1) {
            if (timerEng1Agent2Timer > 0) {
                if (deltaTime < 1000) {
                    setTimerEng1Agent2Timer(timerEng1Agent2Timer - (deltaTime / 1000));
                }
            } else {
                setTimerEng1Agent2Timer(-1);
                setAgent2Eng1Discharge(true);
            }
        }
        // console.log(`TimeEng2Agent1 is ${timerEng2Agent1Timer}`);
        if (fireButton2 === 1 && timerEng2Agent1Timer !== -1) {
            if (timerEng2Agent1Timer > 0) {
                if (deltaTime < 1000) {
                    setTimerEng2Agent1Timer(timerEng2Agent1Timer - (deltaTime / 1000));
                }
            } else {
                setTimerEng2Agent1Timer(-1);
                setAgent1Eng2Discharge(true);
            }
        }
        if (agent1Eng2Discharge && timerEng2Agent2Timer !== -1) {
            if (timerEng2Agent2Timer > 0) {
                if (deltaTime < 1000) {
                    setTimerEng2Agent2Timer(timerEng2Agent2Timer - (deltaTime / 1000));
                }
            } else {
                setTimerEng2Agent2Timer(-1);
                setAgent2Eng2Discharge(true);
            }
        }
        if (fireButtonAPU === 1 && agentApuAgentTimer !== -1) {
            if (agentApuAgentTimer > 0) {
                if (deltaTime < 1000) {
                    setApuAgentTimer(agentApuAgentTimer - (deltaTime / 1000));
                }
            } else {
                setApuAgentTimer(-1);
                setAgentAPUDischarge(true);
            }
        }
    });

    /* FUEL */
    const [fuel] = useSimVar('A:INTERACTIVE POINT OPEN:9', 'percent', 500);
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 500);
    const fobRounded = Math.round(fob / 10) * 10;
    const [usrStartRefueling] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'bool', 500);
    const [leftOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'bool', 500);
    const [rightOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'bool', 500);
    const [fuelXFeedPBOn] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_XFEED_Pressed', 'bool', 500);

    /* HYDRAULICS */
    const [greenLP] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'bool', 500);
    const [blueLP] = useSimVar('L:A32NX_HYD_BLUE_EDPUMP_LOW_PRESS', 'bool', 500);
    const [yellowLP] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'bool', 500);
    const [eng1pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool', 500);
    const [eng2pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'bool', 500);
    const [hydPTU] = useSimVar('L:A32NX_HYD_PTU_ON_ECAM_MEMO', 'bool', 500);
    const [ratDeployed] = useSimVar('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100', 500);

    /* LANDING GEAR AND LIGHTS */
    const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 500);
    const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 500);
    const onGround = left1LandingGear === 1 && right1LandingGear === 1;
    const [landingGearDown] = useSimVar('GEAR HANDLE POSITION', 'bool', 500);
    const [landingLight2Retracted] = useSimVar('L:LANDING_2_Retracted', 'bool', 500);
    const [landingLight3Retracted] = useSimVar('L:LANDING_3_Retracted', 'bool', 500);
    const [autoBrakesArmedMode] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [antiskidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'bool', 500);

    /* OTHER STUFF */

    const [spoilersArmed] = useSimVar('L:A32NX_SPOILERS_ARMED', 'bool', 500);
    const [seatBelt] = useSimVar('A:CABIN SEATBELTS ALERT SWITCH', 'bool', 500);
    const [noSmoking] = useSimVar('L:A32NX_NO_SMOKING_MEMO', 'bool', 500);

    const [strobeLightsOn] = useSimVar('L:LIGHTING_STROBE_0', 'bool', 500);

    const [gpwsFlapMode] = useSimVar('L:A32NX_GPWS_FLAP_OFF', 'bool', 500);
    const [tomemo] = useSimVar('L:A32NX_FWC_TOMEMO', 'bool', 500);
    const [ldgmemo] = useSimVar('L:A32NX_FWC_LDGMEMO', 'bool', 500);

    const [autoBrake] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [flapsHandle] = useSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'enum', 500);
    const [toconfig] = useSimVar('L:A32NX_TO_CONFIG_NORMAL', 'bool', 500);

    const [adirsRemainingAlignTime] = useSimVar('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'seconds', 1000);
    const [adiru1State] = useSimVar('L:A32NX_ADIRS_ADIRU_1_STATE', 'enum', 500);
    const [adiru2State] = useSimVar('L:A32NX_ADIRS_ADIRU_2_STATE', 'enum', 500);
    const [adiru3State] = useSimVar('L:A32NX_ADIRS_ADIRU_3_STATE', 'enum', 500);

    const [callPushAll] = useSimVar('L:PUSH_OVHD_CALLS_ALL', 'bool', 100);
    const [callPushForward] = useSimVar('L:PUSH_OVHD_CALLS_FWD', 'bool', 100);
    const [callPushAft] = useSimVar('L:PUSH_OVHD_CALLS_AFT', 'bool', 100);
    const [cabinReady] = useSimVar('L:A32NX_CABIN_READY', 'bool');

    const [toconfigBtn] = useSimVar('L:A32NX_BTN_TOCONFIG', 'bool', 100);
    const [flapsMcdu] = useSimVar('L:A32NX_TO_CONFIG_FLAPS', 'number', 500);
    const [flapsMcduEntered] = useSimVar('L:A32NX_TO_CONFIG_FLAPS_ENTERED', 'bool', 500);
    const [speedBrake] = useSimVar('L:A32NX_SPOILERS_HANDLE_POSITION', 'number', 500);
    const [parkBrake] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'bool', 500);
    const [brakesHot] = useSimVar('L:A32NX_BRAKES_HOT', 'bool', 500);
    const [v1Speed] = useSimVar('L:AIRLINER_V1_SPEED', 'kots', 500);
    const [vrSpeed] = useSimVar('L:AIRLINER_VR_SPEED', 'knots', 500);
    const [v2Speed] = useSimVar('L:AIRLINER_V2_SPEED', 'knots');
    const [cabin] = useSimVar('INTERACTIVE POINT OPEN:0', 'percent', 1000);
    const [catering] = useSimVar('INTERACTIVE POINT OPEN:3', 'percent', 1000);
    const [cargofwdLocked] = useSimVar('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool', 1000);
    const [cargoaftLocked] = useSimVar('L:A32NX_AFT_DOOR_CARGO_LOCKED', 'bool', 1000);
    const [apuMasterSwitch] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
    const [flightPhaseInhibitOverride] = useSimVar('L:A32NX_FWC_INHIBOVRD', 'bool', 500);
    const [nwSteeringDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'bool', 500);
    const [predWSOn] = useSimVar('L:A32NX_SWITCH_RADAR_PWS_Position', 'bool', 1000);
    const [gpwsOff] = useSimVar('L:A32NX_GPWS_TERR_OFF', 'bool', 500);
    const [tcasMode] = useSimVar('L:A32NX_TCAS_MODE', 'enum', 500);
    const [compMesgCount] = useSimVar('L:A32NX_COMPANY_MSG_COUNT', 'number', 500);

    const [apuBleedValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool', 500);

    const [brakeFan] = useSimVar('L:A32NX_BRAKE_FAN', 'bool', 500);
    const [dmcSwitchingKnob] = useSimVar('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'enum', 500);
    const [ndXfrKnob] = useSimVar('L:A32NX_ECAM_ND_XFR_SWITCHING_KNOB', 'bool', 500);
    const [gpwsFlaps3] = useSimVar('L:A32NX_GPWS_FLAPS3', 'bool', 500);
    const [manLandingElevation] = useSimVar('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'number', 500);
    const [ATTKnob] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum', 500);
    const [AIRKnob] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum', 500);

    const [radioAlt] = useSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'Feet', 500);
    const [fac1Failed] = useSimVar('L:A32NX_FBW_FAC_FAILED:1', 'bool', 500);
    const [tcasFault] = useSimVar('L:A32NX_TCAS_FAULT', 'bool', 500);

    const [cabinRecircBtnOn] = useSimVar('L:A32NX_VENTILATION_CABFANS_TOGGLE', 'bool', 500);

    /* WARNINGS AND FAILURES */
    const landASAPRed: boolean = !!(!onGround
    && (
        fireButton1 === 1
        || fireButton2 === 1
        || fireButtonAPU === 1
        || emergencyGeneratorOn
        || (engine1State === 0 && engine2State === 0)
        || (greenLP === 1 && yellowLP === 1)
        || (yellowLP === 1 && blueLP === 1)
        || (greenLP === 1 && blueLP === 1)
    ));

    const engDualFault = !onGround && (
        (fireButton1 === 1 && fireButton2)
        || (!engine1ValueSwitch && !engine2ValueSwitch)
        || (engine1State === 0 && engine2State === 0)
        || (!N1AboveIdle && !N2AboveIdle)
    );

    const [masterWarningButtonLeft] = useSimVar('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'bool', 100);
    const [masterCautionButtonLeft] = useSimVar('L:PUSH_AUTOPILOT_MASTERCAUT_L', 'bool', 100);
    const [masterWarningButtonRight] = useSimVar('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'bool', 100);
    const [masterCautionButtonRight] = useSimVar('L:PUSH_AUTOPILOT_MASTERCAUT_R', 'bool', 100);
    const [clearButtonLeft] = useSimVar('L:A32NX_BTN_CLR', 'bool');
    const [clearButtonRight] = useSimVar('L:A32NX_BTN_CLR2', 'bool');
    const [recallButton] = useSimVar('L:A32NX_BTN_RCL', 'bool');
    const [failuresLeft, setFailuresLeft] = useState<string[]>([]);
    const [failuresRight, setFailuresRight] = useState<string[]>([]);
    const [allCurrentFailures, setAllCurrentFailures] = useState<string[]>([]);
    const [recallFailures, setRecallFailures] = useState<string[]>([]);
    const [recallReset, setRecallReset] = useState(true);
    const [toconfigFailed, setToConfigFailed] = useState(false);

    const masterWarning = (toggle: number) => {
        console.log(`Master warning and toggle is ${toggle}`);
        SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'Bool', toggle);
    };

    const masterCaution = (toggle: number) => {
        SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'Bool', toggle);
    };

    useEffect(() => {
        console.log(`Master warning${masterWarningButtonLeft}`);
        masterWarning(0);
    }, [masterWarningButtonLeft, masterWarningButtonRight]);

    useEffect(() => {
        console.log(`Master caution ${masterCautionButtonLeft}`);
        masterCaution(0);
    }, [masterCautionButtonLeft, masterCautionButtonRight]);

    useEffect(() => {
        console.log('Clear buttons pressed');
        console.log(failuresLeft);
        if (clearButtonLeft === 1 || clearButtonRight === 1) {
            if (typeof failuresLeft !== 'undefined' && failuresLeft.length > 0) {
                console.log('We have failures to remove');
                const updatedFailures = failuresLeft.slice(1);
                const updatedRecallFailures = allCurrentFailures.filter((item) => !updatedFailures.includes(item));
                console.log(`Failures are now ${JSON.stringify(updatedFailures)}`);
                console.log(`Recall failures are now ${JSON.stringify(updatedRecallFailures)}`);
                setRecallFailures(updatedRecallFailures);
                setFailuresLeft(updatedFailures);
            }
        }
        setRecallReset(!recallReset);
        SimVar.SetSimVarValue('L:A32NX_BTN_CLR', 'Bool', 0);
        SimVar.SetSimVarValue('L:A32NX_BTN_CLR2', 'Bool', 0);
    }, [clearButtonLeft, clearButtonRight]);

    useEffect(() => {
        console.log('Recall button pressed');
        console.log(`Recall button is ${recallButton}`);
        if (recallButton === 1) {
            console.log(`You pressed recall and recallFailures is ${JSON.stringify(recallFailures)}`);
            if (recallFailures.length > 0) {
                console.log('Inside recall');
                const recall = recallFailures[0];
                const updatedRecallFailures = recallFailures.slice(1);
                // console.log('Updated recall is ');
                // console.log(updatedRecallFailures);
                const updatedFailures: string[] = failuresLeft.concat([recall]);
                // console.log('Updated failures is');
                // console.log(updatedFailures);
                setRecallFailures(updatedRecallFailures);
                setFailuresLeft(updatedFailures);
            }
            setRecallReset(!recallReset);
        }
    }, [recallButton]);

    /* FAILURES, MEMOS AND SPECIAL LINES */

    interface EWDItem {
        flightPhaseInhib: number[],
        simVarIsActive: boolean,
        whichCodeToReturn: any[],
        codesToReturn: string[],
        memoInhibit: boolean,
        failure: number,
        sysPage: number,
        side: string
    }

    interface EWDMessageDict {
        [key: string] : EWDItem
    }

    const EWDMessageFailures: EWDMessageDict = {
        7700027: { // DUAL ENGINE FAILURE
            flightPhaseInhib: [],
            simVarIsActive: engDualFault === 1,
            whichCodeToReturn: [
                0,
                !emergencyGeneratorOn ? 1 : null,
                5,
                !(apuMasterSwitch === 1 || apuAvail === 1) && radioAlt < 2500 ? 6 : null,
                N1AboveIdle === 1 || N2AboveIdle === 1 ? 7 : null,
                fac1Failed === 1 ? 8 : null,
                9, 10, 11,
            ],
            codesToReturn: ['770002701', '770002702', '770002703', '770002704', '770002705', '770002706', '770002707', '770002708', '770002709', '770002710', '770002711', '770002712'],
            memoInhibit: false,
            failure: 3,
            sysPage: 0,
            side: 'LEFT',
        },
        2600010: { // ENG 1 FIRE
            flightPhaseInhib: [],
            simVarIsActive: !!(eng1FireTest === 1 || fireButton1 === 1),
            whichCodeToReturn: [
                0,
                throttle1Position !== 1 && !onGround ? 1 : null,
                (throttle1Position !== 1 || throttle2Position !== 1) && onGround ? 2 : null,
                !parkBrake && onGround ? 3 : null,
                !parkBrake && onGround ? 4 : null,
                onGround ? 5 : null,
                onGround ? 6 : null,
                !engine1ValueSwitch ? null : 7,
                !fireButton1 ? 8 : null,
                !onGround && fireButton1 && !agent1Eng1Discharge && !eng1Agent1PB ? 9 : null,
                agent1Eng1Discharge && !onGround && !eng1Agent1PB ? 10 : null,
                eng1Agent1PB === 1 && onGround ? 11 : null,
                onGround ? 12 : null,
                !onGround ? 13 : null,
                // Fix this logic
                !onGround && eng1Agent1PB === 1 && !agent2Eng1Discharge ? 14 : null,
                (agent2Eng1Discharge && eng1Agent1PB === 0) || (!onGround && eng1Agent1PB === 1 && !agent2Eng1Discharge) ? 15 : null,
            ],
            codesToReturn: ['260001001', '260001002', '260001003', '260001004', '260001005',
                '260001006', '260001007', '260001008', '260001009', '260001010', '260001011',
                '260001012', '260001013', '260001014', '260001015', '260001016'],
            memoInhibit: false,
            failure: 3,
            sysPage: 0,
            side: 'LEFT',
        },
        2600020: { // ENG 2 FIRE
            flightPhaseInhib: [],
            simVarIsActive: !!(eng2FireTest === 1 || fireButton2 === 1),
            whichCodeToReturn: [
                0,
                throttle2Position !== 1 && !onGround ? 1 : null,
                (throttle1Position !== 1 || throttle2Position !== 1) && onGround ? 2 : null,
                !parkBrake && onGround ? 3 : null,
                !parkBrake && onGround ? 4 : null,
                onGround ? 5 : null,
                onGround ? 6 : null,
                !engine2ValueSwitch ? null : 7,
                !fireButton2 ? 8 : null,
                !onGround && fireButton1 && !agent1Eng2Discharge && !eng1Agent1PB ? 9 : null,
                agent1Eng2Discharge && !onGround && !eng2Agent1PB ? 10 : null,
                eng2Agent1PB === 1 && onGround ? 11 : null,
                onGround ? 12 : null,
                !onGround ? 13 : null,
                !onGround && eng2Agent1PB === 1 && !agent2Eng2Discharge ? 14 : null,
                (agent2Eng2Discharge && eng2Agent1PB === 1) || (!onGround && eng2Agent1PB === 1 && !agent2Eng2Discharge) ? 15 : null,
            ],
            codesToReturn: ['260002001', '260002002', '260002003', '260002004', '260002005',
                '260002006', '260002007', '260002008', '260002009', '260002010', '260002011',
                '260002012', '260002013', '260002014', '260002015', '260002016'],
            memoInhibit: false,
            failure: 3,
            sysPage: 0,
            side: 'LEFT',
        },
        2600030: { // APU FIRE
            flightPhaseInhib: [],
            simVarIsActive: !!(apuFireTest === 1 || fireButtonAPU === 1),
            whichCodeToReturn: [
                0,
                !fireButtonAPU ? 1 : null,
                !agentAPUDischarge && !apuAgentPB ? 2 : null,
                agentAPUDischarge && !apuAgentPB ? 3 : null,
                apuMasterSwitch === 1 ? 4 : null,
            ],
            codesToReturn: ['260003001', '260003002', '260003003', '260003004', '260003005'],
            memoInhibit: false,
            failure: 3,
            sysPage: 6,
            side: 'LEFT',
        },
        2700085: { // SLATS NOT IN TO CONFIG
            flightPhaseInhib: [5, 6, 7, 8],
            simVarIsActive: !!((!flapsMcduEntered || flapsHandle !== flapsMcdu) && (([1, 2, 9].includes(flightPhase) && toconfigFailed) || [3, 4, 5].includes(flightPhase))),
            // TODO no separate slats indication
            whichCodeToReturn: [0, 1],
            codesToReturn: ['270008501', '270008502'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        2700090: { // FLAPS NOT IN TO CONFIG
            flightPhaseInhib: [5, 6, 7, 8],
            simVarIsActive: !!((!flapsMcduEntered || flapsHandle !== flapsMcdu) && (([1, 2, 9].includes(flightPhase) && toconfigFailed) || [3, 4, 5].includes(flightPhase))),
            // TODO no separate slats indication
            whichCodeToReturn: [0, 1],
            codesToReturn: ['270009001', '270009002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3200050: { // PK BRK ON
            flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: !!(flightPhase === 3 && parkBrake === 1),
            // TODO no separate slats indication
            whichCodeToReturn: [0],
            codesToReturn: ['320005001'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        2600150: { // SMOKE FWD CARGO SMOKE
            flightPhaseInhib: [4, 5, 7, 8],
            simVarIsActive: !!([1, 2, 3, 6, 9, 10].includes(flightPhase) && cargoFireTest === 1),
            // TODO no separate slats indication
            whichCodeToReturn: [
                0,
                cabinRecircBtnOn === 1 ? 2 : null,
                [1, 10].includes(flightPhase) && !cargoFireAgentDisch ? 3 : null,
                !cargoFireAgentDisch ? 4 : null,
                !onGround ? 5 : null,
                !onGround ? 6 : null,
                onGround ? 7 : null,
                onGround ? 8 : null,
            ],
            codesToReturn: ['260015001', '260015002', '260015003', '260015004', '260015005', '260015006', '260015007', '260015008', '260015009'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        7700647: { // THR LEVERS NOT SET  (on ground)
            flightPhaseInhib: [1, 4, 5, 6, 7, 8, 10],
            simVarIsActive: [2, 3, 4, 8, 9].includes(flightPhase) && (
                !!((throttle1Position !== 3 && thrustLeverNotSet) || (throttle2Position !== 3 && thrustLeverNotSet))
            ),
            whichCodeToReturn: [
                0,
                autothrustLeverWarningFlex === 1 ? 1 : null,
                autothrustLeverWarningTOGA === 1 ? 2 : null,
            ],
            codesToReturn: ['770064701', '770064702', '770064703'],
            memoInhibit: false,
            failure: 2,
            sysPage: 9, // Should be -1
            side: 'LEFT',
        },
        3200060: { // NW ANTI SKID INACTIVE
            flightPhaseInhib: [4, 5],
            simVarIsActive: antiskidActive === 0,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['320006001', '320006002'],
            memoInhibit: false,
            failure: 2,
            sysPage: 9,
            side: 'LEFT',
        },
        3400500: { // TCAS FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: !!(![1, 10].includes(flightPhase) && tcasFault === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['340050001'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        3400507: { // NAV TCAS STBY (in flight)
            flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
            simVarIsActive: !!(flightPhase === 6 && tcasMode === 0),
            whichCodeToReturn: [0],
            codesToReturn: ['340050701'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
    };

    const EWDMessageMemos: EWDMessageDict = {
        '0000010': { // T.O MEMO
            flightPhaseInhib: [1, 3, 6, 10],
            simVarIsActive: !!tomemo,
            whichCodeToReturn: [
                autoBrake === 3 ? 1 : 0,
                noSmoking && configPortableDevices ? 3 : 2,
                cabinReady ? 5 : 4,
                spoilersArmed ? 7 : 6,
                flapsHandle >= 1 && flapsHandle <= 3 ? 9 : 8,
                toconfig ? 11 : 10,
            ],
            codesToReturn: ['000001001', '000001002', '000001003', '000001004', '000001005', '000001006', '000001007', '000001008', '000001009', '000001010', '000001011', '000001012'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000020': { // LANDING MEMO
            flightPhaseInhib: [1, 2, 3, 4, 5, 9, 10],
            simVarIsActive: !!ldgmemo,
            whichCodeToReturn: [
                landingGearDown === 1 ? 1 : 0,
                noSmoking && configPortableDevices ? 3 : 2,
                cabinReady ? 5 : 4,
                spoilersArmed ? 7 : 6,
                !gpwsFlaps3 && flapsHandle !== 4 ? 8 : null,
                !gpwsFlaps3 && flapsHandle === 4 ? 9 : null,
                gpwsFlaps3 === 1 && flapsHandle !== 3 ? 10 : null,
                gpwsFlaps3 === 1 && flapsHandle === 3 ? 11 : null,
            ],
            codesToReturn: ['000002001', '000002002', '000002003', '000002004', '000002005', '000002006', '000002007', '000002008', '000002009', '000002010', '000002011', '000002012'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000050': { // REFUELING
            flightPhaseInhib: [],
            simVarIsActive: !!(fuel === 100 || usrStartRefueling),
            whichCodeToReturn: [0],
            codesToReturn: ['000005001'],
            memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000030': { // IR IN ALIGN
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: !!(adirsRemainingAlignTime >= 240 && [adiru1State, adiru2State, adiru3State].every((a) => a === 1)),
            whichCodeToReturn: [
                adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
            ],
            codesToReturn: ['000003001', '000003002', '000003003', '000003004', '000003005', '000003006', '000003007', '000003008'],
            memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000031': { // IR IN ALIGN
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: !!(adirsRemainingAlignTime > 0 && adirsRemainingAlignTime < 240 && [adiru1State, adiru2State, adiru3State].every((a) => a === 1)),
            whichCodeToReturn: [
                adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
            ],
            codesToReturn: ['000003101', '000003102', '000003103', '000003104', '000003105', '000003106', '000003107', '000003108'],
            memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
            failure: 0,
            sysPage: -1,
            side: 'LEFT',
        },
        '0000055': // SPOILERS ARMED
            {
                flightPhaseInhib: [],
                simVarIsActive: !!spoilersArmed,
                whichCodeToReturn: [0],
                codesToReturn: ['000005501'],
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000080': // SEAT BELTS
            {
                flightPhaseInhib: [],
                simVarIsActive: !!seatBelt,
                whichCodeToReturn: [0],
                codesToReturn: ['000008001'],
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000090': // NO SMOKING
            {
                flightPhaseInhib: [],
                simVarIsActive: !!(noSmoking && !configPortableDevices),
                whichCodeToReturn: [0],
                codesToReturn: ['000009001'],
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000095': // PORTABLE DEVICES
            {
                flightPhaseInhib: [],
                simVarIsActive: !!(noSmoking && configPortableDevices),
                whichCodeToReturn: [0],
                codesToReturn: ['000009501'],
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000100': // STROBE LIGHT OFF
            {
                flightPhaseInhib: [],
                simVarIsActive: !!(flightPhase >= 6 && flightPhase <= 8 && strobeLightsOn === 2),
                whichCodeToReturn: [0],
                codesToReturn: ['000010001'],
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000105': // OUTR TK FUEL XFRD
            {
                flightPhaseInhib: [], // Plus check that outer tanks not empty
                simVarIsActive: !!(leftOuterInnerValve || rightOuterInnerValve),
                whichCodeToReturn: [0],
                codesToReturn: ['000010501'], // config memo
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000110': // FOB BELOW 3 T or 6600 LBS
            {
                flightPhaseInhib: [],
                simVarIsActive: fobRounded < 3000,
                whichCodeToReturn: [unit === '1' ? 0 : 1],
                codesToReturn: ['000011001', '0000011002'], // config memo
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000305': // GPWS FLAP MODE OFF
            {
                flightPhaseInhib: [],
                simVarIsActive: !!gpwsFlapMode,
                whichCodeToReturn: [0],
                codesToReturn: ['000030501'], // Not inhibited
                memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
                failure: 0,
                sysPage: -1,
                side: 'LEFT',
            },
        '0000140': // T.O. INHIBIT
            {
                flightPhaseInhib: [1, 2, 6, 7, 8, 9, 10],
                simVarIsActive: !!([3, 4, 5].includes(flightPhase) && !flightPhaseInhibitOverride),
                whichCodeToReturn: [0],
                codesToReturn: ['000014001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000150': // LDG INHIBIT
            {
                flightPhaseInhib: [1, 2, 3, 4, 5, 6, 9, 10],
                simVarIsActive: !!([7, 8].includes(flightPhase) && !flightPhaseInhibitOverride),
                whichCodeToReturn: [0],
                codesToReturn: ['000015001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000350': // LAND ASAP RED
            {
                flightPhaseInhib: [],
                simVarIsActive: !!landASAPRed,
                whichCodeToReturn: [0],
                codesToReturn: ['000035001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000360': // LAND ASAP AMBER
            {
                flightPhaseInhib: [],
                simVarIsActive: !!(!landASAPRed && !onGround && (
                    engine1State === 0
                    || engine2State === 0
                    || fobRounded < 3000
                )),
                whichCodeToReturn: [0],
                codesToReturn: ['000036001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000060': // SPEED BRK
        {
            flightPhaseInhib: [1, 8, 9, 10],
            simVarIsActive: speedBrake > 0,
            whichCodeToReturn: [[2, 3, 4, 5].includes(flightPhase) ? 1 : 0],
            codesToReturn: ['000006001', '000006002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000200': // PARK BRK
        {
            flightPhaseInhib: [3, 4, 5, 6, 7, 8],
            simVarIsActive: !!([1, 2, 9, 10].includes(flightPhase) && parkBrake === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000020001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000040': // NW STRG DISC
        {
            flightPhaseInhib: [],
            simVarIsActive: nwSteeringDisc === 1,
            whichCodeToReturn: [engine1State > 0 || engine2State > 1 ? 1 : 0],
            codesToReturn: ['000004001', '000004002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000160': // PTU ON
        {
            flightPhaseInhib: [],
            simVarIsActive: hydPTU === 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000016001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000210': // RAT OUT
        {
            flightPhaseInhib: [],
            simVarIsActive: ratDeployed > 0,
            whichCodeToReturn: [[1, 2].includes(flightPhase) ? 1 : 0],
            codesToReturn: ['000021001', '000021002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000070': // IGNITION
        {
            flightPhaseInhib: [],
            simVarIsActive: engSelectorPosition === 2,
            whichCodeToReturn: [0],
            codesToReturn: ['000007001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000540': // PRED W/S OFF
        {
            flightPhaseInhib: [1, 10],
            simVarIsActive: !!(predWSOn === 0 && ![1, 10].includes(flightPhase)),
            whichCodeToReturn: [[3, 4, 5, 7, 8, 9].includes(flightPhase) || toconfig === 1 ? 1 : 0],
            codesToReturn: ['000054001', '000054002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000545': // TERR OFF
        {
            flightPhaseInhib: [1, 10],
            simVarIsActive: !!(gpwsOff === 1 && ![1, 10].includes(flightPhase)),
            whichCodeToReturn: [[3, 4, 5, 7, 8, 9].includes(flightPhase) || toconfig === 1 ? 1 : 0],
            codesToReturn: ['000054501', '000054502'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000320': // TCAS STBY
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(tcasMode === 0 && flightPhase !== 6),
            whichCodeToReturn: [0],
            codesToReturn: ['000032001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000325': // TCAS STBY in flight
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(tcasMode === 0 && flightPhase === 6),
            whichCodeToReturn: [0],
            codesToReturn: ['000032501'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000552': // COMPANY MESSAGE
        {
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: compMesgCount > 0,
            whichCodeToReturn: [0],
            codesToReturn: ['000055201'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000260': // ENGINE ANTIICE
        {
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: !!(eng1AntiIce === 1 || eng2AntiIce === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000026001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000270': // WING ANTIICE
        {
            flightPhaseInhib: [],
            simVarIsActive: wingAntiIce === 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000027001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000275': // ICE NOT DETECTED   Engine AntiIce has a timer logic
        {
            flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
            simVarIsActive: wingAntiIce === 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000027501'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000170': // APU AVAIL
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(apuAvail === 1 && !apuBleedValveOpen),
            whichCodeToReturn: [0],
            codesToReturn: ['000017001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000180': // APU BLEED
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(apuAvail === 1 && apuBleedValveOpen === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000018001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000190': // LDG LT
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(!landingLight2Retracted || !landingLight3Retracted),
            whichCodeToReturn: [0],
            codesToReturn: ['000019001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000220': // BRAKE FAN
        {
            flightPhaseInhib: [],
            simVarIsActive: brakeFan === 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000022001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000290': // SWITCHING PNL
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(ndXfrKnob !== 1 || dmcSwitchingKnob !== 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000029001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000300': // GPWS FLAPS 3
        {
            flightPhaseInhib: [],
            simVarIsActive: gpwsFlaps3 === 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000030001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000022': // AUTOBRAKE
        {
            flightPhaseInhib: [],
            simVarIsActive: [7, 8].includes(flightPhase),
            whichCodeToReturn: [parseInt(autoBrakesArmedMode) - 1],
            codesToReturn: ['000002201', '000002202', '000002203', '000002204'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000230': // MAN LANDING ELEVATION
        {
            flightPhaseInhib: [],
            simVarIsActive: manLandingElevation > 0,
            whichCodeToReturn: [0],
            codesToReturn: ['000023001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000250': // FUEL X FEED
        {
            flightPhaseInhib: [],
            simVarIsActive: fuelXFeedPBOn === 1,
            whichCodeToReturn: [[3, 4, 5].includes(flightPhase) ? 1 : 0],
            codesToReturn: ['000025001', '000025002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000680': // ADIRS SWTG
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(ATTKnob !== 1 || AIRKnob !== 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000068001'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
    };

    useEffect(() => {
        console.log('TO Config check');
        if (tomemo) {
            // TODO Note that fuel tank low pressure and gravity feed warnings are not included
            let systemStatus = false;
            if (engine1Generator && engine2Generator && !greenLP && !yellowLP && !blueLP && eng1pumpPBisAuto && eng2pumpPBisAuto) {
                systemStatus = true;
            }
            const speeds = !!(v1Speed <= vrSpeed && vrSpeed <= v2Speed);
            const doors = !!(cabin === 0 && catering === 0 && cargoaftLocked && cargofwdLocked);
            const flapsAgree = !!(flapsMcduEntered && flapsHandle === flapsMcdu);
            const sb = speedBrake === 0;

            if (systemStatus && speeds && !brakesHot && doors && flapsAgree && sb) {
                // console.log('Config normal');
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 1);
                setToConfigFailed(false);
            } else {
                console.log('Config not normal');
                console.log(`System status ${systemStatus} and speeds ${speeds} and brakes ${brakesHot}, and doors ${doors} and flaps ${flapsAgree} and speed brakes ${sb}`);
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 0);
                setToConfigFailed(true);
            }
        }
    }, [
        engine1Generator, engine2Generator, blueLP, greenLP, yellowLP, eng1pumpPBisAuto, eng2pumpPBisAuto,
        flapsMcdu, flapsMcduEntered, speedBrake, parkBrake, v1Speed, vrSpeed, v2Speed, cabin,
        catering, cargoaftLocked, cargofwdLocked, toconfigBtn,
    ]);

    useEffect(() => {
        console.log('Bing Bong ');
        if (callPushAft || callPushAll || callPushForward) {
            SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'bool', 1);
        }
    }, [callPushAft, callPushAll, callPushForward]);

    useEffect(() => {
        let tempMemoArrayLeft:string[] = [];
        let tempMemoArrayRight:string[] = [];
        const allFailureKeys: string[] = [];
        let tempFailureArrayLeft:string[] = [];
        let tempFailureArrayRight: string[] = [];
        const failureKeysLeft: string[] = failuresLeft;
        let orderedFailureArrayRight: string[] = [];
        console.log('Rewrite triggered');

        // Failures first
        console.log('Failures check');
        for (const [key, value] of Object.entries(EWDMessageFailures)) {
            // console.log(`Key is ${key}`);
            if (value.simVarIsActive && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                allFailureKeys.push(key);
                console.log('Recall failures is currently');
                console.log(recallFailures);

                if (!failuresLeft.includes(key) && !recallFailures.includes(key)) {
                    console.log('New failure');
                    failuresLeft.push(key);
                    if (value.failure === 3) {
                        masterWarning(1);
                    }
                    if (value.failure === 2) {
                        masterCaution(1);
                    }
                } else {
                    console.log('Already have that failure');
                    if (![eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest].every((e) => e === 0)) {
                        masterWarning(1);
                    }
                }

                const newCode: string[] = [];
                console.log('Value if fire test logic is');
                console.log(`Cargo fire test is ${cargoFireTest}`);
                console.log(![eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest].some((e) => e === 1));
                if (!recallFailures.includes(key)) {
                    const codeIndex = value.whichCodeToReturn.filter((e) => e !== null);
                    codeIndex.forEach((e: number) => {
                        newCode.push(value.codesToReturn[e]);
                    });
                }
                if (value.side === 'LEFT') {
                    tempFailureArrayLeft = tempFailureArrayLeft.concat(newCode);
                } else {
                    const tempArrayRight = tempFailureArrayRight.filter((e) => !value.codesToReturn.includes(e));
                    tempFailureArrayRight = tempArrayRight.concat(newCode);
                }

                if (value.sysPage > -1) {
                    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
                }
            }
        }

        const failLeft = tempFailureArrayLeft.length > 0;
        const failRight = tempFailureArrayRight.length > 0;

        const mesgFailOrderLeft: string[] = [];
        const mesgFailOrderRight: string[] = [];
        for (const [key, value] of Object.entries(EWDMessageFailures)) {
            if (value.side === 'LEFT') {
                mesgFailOrderLeft.push(...value.codesToReturn);
            } else {
                mesgFailOrderRight.push(...value.codesToReturn);
            }
        }
        const orderedFailureArrayLeft = mapOrder(tempFailureArrayLeft, mesgFailOrderLeft);
        orderedFailureArrayRight = mapOrder(tempFailureArrayRight, mesgFailOrderRight);

        setAllCurrentFailures(allFailureKeys);
        setFailuresLeft(failureKeysLeft);

        if (failLeft) {
            console.log('Sending memo left message from failures');
            setMemoMessageLeft(orderedFailureArrayLeft);
        }

        for (const [key, value] of Object.entries(EWDMessageMemos)) {
            // console.log(`Key is ${key}`);
            if (value.simVarIsActive && !(value.memoInhibit) && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                const newCode: string[] = [];

                const codeIndex = value.whichCodeToReturn.filter((e) => e !== null);
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
        for (const [key, value] of Object.entries(EWDMessageMemos)) {
            if (value.side === 'LEFT') {
                mesgOrderLeft.push(...value.codesToReturn);
            } else {
                mesgOrderRight.push(...value.codesToReturn);
            }
        }
        const orderedMemoArrayLeft = mapOrder(tempMemoArrayLeft, mesgOrderLeft);
        let orderedMemoArrayRight = mapOrder(tempMemoArrayRight, mesgOrderRight);

        if (!failLeft) {
            console.log('Sending memo left message from memo');
            setMemoMessageLeft(orderedMemoArrayLeft);
        }
        if (failRight) {
            orderedMemoArrayRight = [...orderedFailureArrayRight, ...orderedMemoArrayRight];
        }
        setMemoMessageRight(orderedMemoArrayRight);
        //
    }, [adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
        adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
        adiru1State,
        adiru2State,
        adiru3State,
        AIRKnob,
        antiskidActive,
        apuAgentPB,
        apuAvail,
        apuBleedValveOpen,
        apuFireTest,
        apuMasterSwitch,
        ATTKnob,
        autoBrake,
        autoBrakesArmedMode,
        brakeFan,
        cabinReady,
        cabinRecircBtnOn,
        cargoFireAgentDisch,
        cargoFireTest,
        compMesgCount,
        configPortableDevices,
        dmcSwitchingKnob,
        emergencyGeneratorOn,
        eng1Agent1PB,
        eng1Agent2PB,
        eng1AntiIce,
        eng1FireTest,
        engine1State,
        eng2Agent1PB,
        eng2Agent2PB,
        eng2AntiIce,
        eng2FireTest,
        engine2State,
        engDualFault,
        engSelectorPosition,
        fac1Failed,
        fireButton1,
        fireButton2,
        fireButtonAPU,
        flapsHandle,
        flightPhase,
        flightPhaseInhibitOverride,
        fobRounded,
        fuel,
        fuelXFeedPBOn,
        gpwsFlapMode,
        gpwsFlaps3,
        gpwsOff,
        hydPTU,
        landASAPRed,
        landingLight2Retracted,
        landingLight3Retracted,
        ldgmemo,
        leftOuterInnerValve,
        manLandingElevation,
        ndXfrKnob,
        noSmoking,
        nwSteeringDisc,
        parkBrake,
        predWSOn,
        ratDeployed,
        recallReset,
        rightOuterInnerValve,
        seatBelt,
        spoilersArmed,
        strobeLightsOn,
        tcasFault,
        tcasMode,
        toconfig,
        toconfigFailed,
        throttle1Position,
        throttle2Position,
        thrustLeverNotSet,
        tomemo,
        unit,
        usrStartRefueling,
        wingAntiIce,
    ]);

    useEffect(() => {
        [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
            SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${value}`, 'string', '');
        });
        if (memoMessageLeft.length > 0) {
            memoMessageLeft.forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`, 'string', value);
            });
        }
    }, [memoMessageLeft]);

    useEffect(() => {
        [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
            SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${value}`, 'string', '');
        });
        if (memoMessageRight.length > 0) {
            memoMessageRight.forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${index + 1}`, 'string', value);
            });
        }
    }, [memoMessageRight]);

    return (<></>);
};

export default PseudoFWC;
