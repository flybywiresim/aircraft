import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { NXDataStore } from '@shared/persistence';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useUpdate } from '@instruments/common/hooks';
import { NXLogicConfirmNode, NXLogicClockNode, NXLogicMemoryNode } from '@instruments/common/NXLogic';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';

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
    const [toInhibitTimer] = useState(() => new NXLogicConfirmNode(3));
    const [ldgInhibitTimer] = useState(() => new NXLogicConfirmNode(3));
    const [agent1Eng1DischargeTimer] = useState(() => new NXLogicClockNode(10, 0));
    const [agent2Eng1DischargeTimer] = useState(() => new NXLogicClockNode(30, 0));
    const [agent1Eng2DischargeTimer] = useState(() => new NXLogicClockNode(10, 0));
    const [agent2Eng2DischargeTimer] = useState(() => new NXLogicClockNode(30, 0));
    const [agentAPUDischargeTimer] = useState(() => new NXLogicClockNode(10, 0));
    const [iceSevereDetectedTimer] = useState(() => new NXLogicConfirmNode(40, false));
    const [iceDetectedTimer1] = useState(() => new NXLogicConfirmNode(40, false));
    const [iceDetectedTimer2] = useState(() => new NXLogicConfirmNode(5));
    const [iceNotDetTimer1] = useState(() => new NXLogicConfirmNode(60));
    const [iceNotDetTimer2] = useState(() => new NXLogicConfirmNode(130));
    const [packOffNotFailed1] = useState(() => new NXLogicConfirmNode(60));
    const [packOffNotFailed2] = useState(() => new NXLogicConfirmNode(60));
    const [packOffBleedAvailable1] = useState(() => new NXLogicConfirmNode(5, false));
    const [packOffBleedAvailable2] = useState(() => new NXLogicConfirmNode(5, false));
    const [cabAltSetReset1] = useState(() => new NXLogicMemoryNode());
    const [cabAltSetReset2] = useState(() => new NXLogicMemoryNode());

    const [memoMessageRight, setMemoMessageRight] = useState<string[]>([]);
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);

    /* SETTINGS */
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const configPortableDevices = parseInt(NXDataStore.get('CONFIG_USING_PORTABLE_DEVICES', '0'));

    /* ANTI-ICE */
    const [eng1AntiIce] = useSimVar('ENG ANTI ICE:1', 'bool', 500);
    const [eng2AntiIce] = useSimVar('ENG ANTI ICE:2', 'bool', 500);
    const [wingAntiIce] = useSimVar('STRUCTURAL DEICE SWITCH', 'bool', 500);
    const [icePercentage] = useSimVar('STRUCTURAL ICE PCT', 'percent over 100', 500);
    const [tat] = useSimVar('TOTAL AIR TEMPERATURE', 'celsius', 1000);
    const [inCloud] = useSimVar('AMBIENT IN CLOUD', 'boolean', 1000);

    /* ELECTRICAL */
    const [emergencyElectricGeneratorPotential] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number', 500);
    const [dcESSBusPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool', 500);
    const [ac1BusPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 500);
    const [ac2BusPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 500);
    const emergencyGeneratorOn = emergencyElectricGeneratorPotential > 0 ? 1 : 0;

    /* ENGINE AND THROTTLE */

    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500);
    const [throttle1Position] = useSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'number', 100);
    const [throttle2Position] = useSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'number', 100);
    const [engine1ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:1', 'bool', 500);
    const [engine2ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:2', 'bool', 500);
    const [autothrustLeverWarningFlex] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX', 'bool', 500);
    const [autothrustLeverWarningTOGA] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', 'bool', 500);
    const thrustLeverNotSet = autothrustLeverWarningFlex === 1 || autothrustLeverWarningTOGA === 1;
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'enum', 1000);
    const [autoThrustStatus] = useSimVar('L:A32NX_AUTOTHRUST_STATUS', 'enum', 500);

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
    const [cargoFireTest] = useSimVar('L:A32NX_FIRE_TEST_CARGO', 'bool', 500);
    const [cargoFireAgentDisch] = useSimVar('L:A32NX_CARGOSMOKE_FWD_DISCHARGED', 'bool', 500);

    /* FUEL */
    const [fuel] = useSimVar('A:INTERACTIVE POINT OPEN:9', 'percent', 500);
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 500);
    const fobRounded = Math.round(fob / 10) * 10;
    const [usrStartRefueling] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'bool', 500);
    const [leftOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'bool', 500);
    const [rightOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'bool', 500);
    const [fuelXFeedPBOn] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_XFEED_Pressed', 'bool', 500);

    /* HYDRAULICS */
    const [greenHydEng1PBAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool', 500);
    const [blueRvrLow] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR_LEVEL_IS_LOW', 'bool', 500);
    const [blueElecPumpPBAuto] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'bool', 500);
    const [hydPTU] = useSimVar('L:A32NX_HYD_PTU_ON_ECAM_MEMO', 'bool', 500);
    const [ratDeployed] = useSimVar('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100', 500);

    /* LANDING GEAR AND LIGHTS */
    // const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 500);
    // const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 500);
    // const aircraftOnGround = left1LandingGear === 1 || right1LandingGear === 1;
    // FIXME The landing gear triggers the dual engine failure on loading
    const aircraftOnGround = useSimVar('SIM ON GROUND', 'Bool', 500);
    const [landingLight2Retracted] = useSimVar('L:LANDING_2_Retracted', 'bool', 500);
    const [landingLight3Retracted] = useSimVar('L:LANDING_3_Retracted', 'bool', 500);
    const [autoBrakesArmedMode] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [antiskidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'bool', 500);

    /* OTHER STUFF */

    const [spoilersArmed] = useSimVar('L:A32NX_SPOILERS_ARMED', 'bool', 500);
    const [seatBelt] = useSimVar('A:CABIN SEATBELTS ALERT SWITCH', 'bool', 500);
    const [noSmoking] = useSimVar('L:A32NX_NO_SMOKING_MEMO', 'bool', 500);
    const [noSmokingSwitchPosition] = useSimVar('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'enum', 500);

    const [strobeLightsOn] = useSimVar('L:LIGHTING_STROBE_0', 'bool', 500);

    const [gpwsFlapMode] = useSimVar('L:A32NX_GPWS_FLAP_OFF', 'bool', 500);
    const [tomemo] = useSimVar('L:A32NX_FWC_TOMEMO', 'bool', 500);
    const [ldgmemo] = useSimVar('L:A32NX_FWC_LDGMEMO', 'bool', 500);

    const [autoBrake] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [flapsHandle] = useSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'enum', 500);
    const [flapsIndex] = useSimVar('L:A32NX_FLAPS_CONF_INDEX', 'number', 100);
    const [toconfig] = useSimVar('L:A32NX_TO_CONFIG_NORMAL', 'bool', 100);

    const [adirsRemainingAlignTime] = useSimVar('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'seconds', 1000);
    const [adiru1State] = useSimVar('L:A32NX_ADIRS_ADIRU_1_STATE', 'enum', 500);
    const [adiru2State] = useSimVar('L:A32NX_ADIRS_ADIRU_2_STATE', 'enum', 500);
    const [adiru3State] = useSimVar('L:A32NX_ADIRS_ADIRU_3_STATE', 'enum', 500);

    const [cabinReady] = useSimVar('L:A32NX_CABIN_READY', 'bool');

    const [speedBrake] = useSimVar('L:A32NX_SPOILERS_HANDLE_POSITION', 'number', 500);
    const [parkBrake] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'bool', 500);
    const [apuMasterSwitch] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
    const [flightPhaseInhibitOverride] = useSimVar('L:A32NX_FWC_INHIBOVRD', 'bool', 500);
    const [nwSteeringDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'bool', 500);
    const [predWSOn] = useSimVar('L:A32NX_SWITCH_RADAR_PWS_Position', 'bool', 1000);
    const [gpwsOff] = useSimVar('L:A32NX_GPWS_TERR_OFF', 'bool', 500);
    const [tcasMode] = useSimVar('L:A32NX_TCAS_MODE', 'enum', 500);
    const [tcasSensitivity] = useSimVar('L:A32NX_TCAS_SENSITIVITY', 'enum', 500);
    const [compMesgCount] = useSimVar('L:A32NX_COMPANY_MSG_COUNT', 'number', 500);
    const height1: Arinc429Word = useArinc429Var('L:A32NX_RA_1_RADIO_ALTITUDE');
    const height2: Arinc429Word = useArinc429Var('L:A32NX_RA_2_RADIO_ALTITUDE');
    const height1Failed = height1.isFailureWarning();
    const height2Failed = height2.isFailureWarning();

    const [apuBleedValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool', 500);

    const [brakeFan] = useSimVar('L:A32NX_BRAKE_FAN', 'bool', 500);
    const [dmcSwitchingKnob] = useSimVar('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'enum', 500);
    const [ndXfrKnob] = useSimVar('L:A32NX_ECAM_ND_XFR_SWITCHING_KNOB', 'bool', 500);
    const [gpwsFlaps3] = useSimVar('L:A32NX_GPWS_FLAPS3', 'bool', 500);
    const [ATTKnob] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum', 500);
    const [AIRKnob] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum', 500);

    const [fac1Failed] = useSimVar('L:A32NX_FBW_FAC_FAILED:1', 'bool', 500);
    const [tcasFault] = useSimVar('L:A32NX_TCAS_FAULT', 'bool', 500);

    const [cabinRecircBtnOn] = useSimVar('L:A32NX_VENTILATION_CABFANS_TOGGLE', 'bool', 500);
    const computedAirSpeed: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED', 1000);
    // Reduce number of rewrites triggered by this value
    const computedAirSpeedToNearest2 = Math.round(computedAirSpeed.value / 2) * 2;
    const adirsAlt: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_1_ALTITUDE', 500);

    /* PACKS */
    const [crossfeed] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'bool', 500);
    const [eng1Bleed] = useSimVar('A:BLEED AIR ENGINE:1', 'bool');
    const [eng1BleedPbFault] = useSimVar('L:A32NX_OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT', 'bool', 500);
    const [eng2Bleed] = useSimVar('A:BLEED AIR ENGINE:2', 'bool', 100);
    const [eng2BleedPbFault] = useSimVar('L:A32NX_OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT', 'bool', 500);
    const [pack1Fault] = useSimVar('L:A32NX_AIRCOND_PACK1_FAULT', 'bool');
    const [pack2Fault] = useSimVar('L:A32NX_AIRCOND_PACK2_FAULT', 'bool');
    const [pack1On] = useSimVar('L:A32NX_OVHD_COND_PACK_1_PB_IS_ON', 'bool');
    const [pack2On] = useSimVar('L:A32NX_OVHD_COND_PACK_2_PB_IS_ON', 'bool');
    const [excessPressure] = useSimVar('L:A32NX_PRESS_EXCESS_CAB_ALT', 'bool', 500);

    /* TICK CHECK */
    let showTakeoffInhibit = false;
    let showLandingInhibit = false;
    const [agent1Eng1Discharge, setAgent1Eng1Discharge] = useState(0);
    const [agent2Eng1Discharge, setAgent2Eng1Discharge] = useState(0);
    const [agent1Eng2Discharge, setAgent1Eng2Discharge] = useState(0);
    const [agent2Eng2Discharge, setAgent2Eng2Discharge] = useState(0);
    const [agentAPUDischarge, setAgentAPUDischarge] = useState(0);
    const [iceDetected1, setIceDetected1] = useState(0);
    const [iceDetected2, setIceDetected2] = useState(0);
    const [iceSevereDetected, setIceSevereDetected] = useState(0);
    const [iceNotDetected1, setIceNotDetected1] = useState(0);
    const [iceNotDetected2, setIceNotDetected2] = useState(0);
    const [packOffBleedIsAvailable1, setPackOffBleedIsAvailable1] = useState(0);
    const [packOffBleedIsAvailable2, setPackOffBleedIsAvailable2] = useState(0);
    const [packOffNotFailure1, setPackOffNotFailure1] = useState(0);
    const [packOffNotFailure2, setPackOffNotFailure2] = useState(0);
    const [cabAltSetResetState1, setCabAltSetResetState1] = useState(false);
    const [cabAltSetResetState2, setCabAltSetResetState2] = useState(false);

    useUpdate((deltaTime) => {
        showTakeoffInhibit = toInhibitTimer.write([3, 4, 5].includes(flightPhase) && !flightPhaseInhibitOverride, deltaTime);
        showLandingInhibit = ldgInhibitTimer.write([7, 8].includes(flightPhase) && !flightPhaseInhibitOverride, deltaTime);
        const agent1Eng1DischargeNode = agent1Eng1DischargeTimer.write(fireButton1 === 1, deltaTime);
        if (agent1Eng1Discharge !== agent1Eng1DischargeNode) {
            setAgent1Eng1Discharge(agent1Eng1DischargeNode);
        }
        const agent2Eng1DischargeNode = agent2Eng1DischargeTimer.write(fireButton1 === 1 && eng1Agent1PB === 1 && !aircraftOnGround, deltaTime);
        if (agent2Eng1Discharge !== agent2Eng1DischargeNode) {
            setAgent2Eng1Discharge(agent2Eng1DischargeNode);
        }
        const agent1Eng2DischargeNode = agent1Eng2DischargeTimer.write(fireButton2 === 1 && !eng1Agent1PB, deltaTime);
        if (agent1Eng2Discharge !== agent1Eng2DischargeNode) {
            setAgent1Eng2Discharge(agent1Eng2DischargeNode);
        }
        const agent2Eng2DischargeNode = agent2Eng2DischargeTimer.write(fireButton2 === 1 && eng1Agent1PB === 1, deltaTime);
        if (agent2Eng2Discharge !== agent2Eng2DischargeNode) {
            setAgent2Eng2Discharge(agent2Eng2DischargeNode);
        }
        const agentAPUDischargeNode = agentAPUDischargeTimer.write(fireButton2 === 1 && eng1Agent1PB === 1, deltaTime);
        if (agentAPUDischarge !== agentAPUDischargeNode) {
            setAgentAPUDischarge(agentAPUDischargeNode);
        }
        const iceDetected1Node = iceDetectedTimer1.write(icePercentage >= 0.1 && tat < 10 && !aircraftOnGround, deltaTime);
        if (iceDetected1 !== iceDetected1Node) {
            setIceDetected1(iceDetected1Node);
        }
        const iceDetected2Node = iceDetectedTimer2.write(iceDetected1Node && !(eng1AntiIce && eng2AntiIce), deltaTime);
        if (iceDetected2 !== iceDetected2Node) {
            setIceDetected2(iceDetected2Node);
        }

        const iceSevereDetectedNode = iceSevereDetectedTimer.write(icePercentage >= 0.5 && tat < 10 && !aircraftOnGround, deltaTime);
        if (iceSevereDetected !== iceSevereDetectedNode) {
            setIceSevereDetected(iceSevereDetectedNode);
        }

        const iceNotDetected1Node = iceNotDetTimer1.write(eng1AntiIce === 1 || eng2AntiIce === 1 || wingAntiIce === 1, deltaTime);
        if (iceNotDetected1 !== iceNotDetected1Node) {
            setIceNotDetected1(iceNotDetected1Node);
        }

        const iceNotDetected2Node = iceNotDetTimer2.write(iceNotDetected1 && !(icePercentage >= 0.1 || (tat < 10 && inCloud === 1)), deltaTime);
        if (iceNotDetected2 !== iceNotDetected2Node) {
            setIceNotDetected2(iceNotDetected2Node);
        }

        const packOffBleedIsAvailable1Node = packOffBleedAvailable1.write((eng1Bleed === 1 && !eng1BleedPbFault) || crossfeed === 1, deltaTime);
        if (packOffBleedIsAvailable1 !== packOffBleedIsAvailable1Node) {
            setPackOffBleedIsAvailable1(packOffBleedIsAvailable1Node);
        }

        const packOffBleedIsAvailable2Node = packOffBleedAvailable2.write((eng2Bleed === 1 && !eng2BleedPbFault) || crossfeed === 1, deltaTime);
        if (packOffBleedIsAvailable2 !== packOffBleedIsAvailable2Node) {
            setPackOffBleedIsAvailable2(packOffBleedIsAvailable2Node);
        }

        const packOffNotFailed1Node = packOffNotFailed1.write(!pack1On && !pack1Fault && packOffBleedAvailable1.read() && flightPhase === 6, deltaTime);
        if (packOffNotFailure1 !== packOffNotFailed1Node) {
            setPackOffNotFailure1(packOffNotFailed1Node);
        }
        const packOffNotFailed2Node = packOffNotFailed2.write(!pack2On && !pack2Fault && packOffBleedAvailable2.read() && flightPhase === 6, deltaTime);
        if (packOffNotFailure2 !== packOffNotFailed2Node) {
            setPackOffNotFailure2(packOffNotFailed2Node);
        }
        const cabAltSetReset1Node = cabAltSetReset1.write(adirsAlt.value > 10000 && excessPressure === 1, excessPressure === 1 && [3, 10].includes(flightPhase));
        if (cabAltSetResetState1 !== cabAltSetReset1Node) {
            setCabAltSetResetState1(cabAltSetReset1Node);
        }

        const cabAltSetReset2Node = cabAltSetReset2.write(adirsAlt.value > 16000 && excessPressure === 1, excessPressure === 1 && [3, 10].includes(flightPhase));
        if (cabAltSetResetState2 !== cabAltSetReset2Node) {
            setCabAltSetResetState2(cabAltSetReset2Node);
        }
    });

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

    const EWDMessageMemos: EWDMessageDict = {
        '0000140': // T.O. INHIBIT
            {
                flightPhaseInhib: [],
                simVarIsActive: showTakeoffInhibit,
                whichCodeToReturn: [0],
                codesToReturn: ['000014001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000150': // LDG INHIBIT
            {
                flightPhaseInhib: [],
                simVarIsActive: showLandingInhibit,
                whichCodeToReturn: [0],
                codesToReturn: ['000015001'],
                memoInhibit: false,
                failure: 0,
                sysPage: -1,
                side: 'RIGHT',
            },
        '0000060': // SPEED BRK
        {
            flightPhaseInhib: [],
            simVarIsActive: speedBrake > 0 && ![1, 8, 9, 10].includes(flightPhase),
            whichCodeToReturn: [![6, 7].includes(flightPhase) ? 1 : 0],
            codesToReturn: ['000006001', '000006002'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000200': // PARK BRK
        {
            flightPhaseInhib: [],
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
            flightPhaseInhib: [],
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
            simVarIsActive: !!(tcasSensitivity === 1 && flightPhase !== 6),
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
            simVarIsActive: !!(tcasSensitivity === 1 && flightPhase === 6),
            whichCodeToReturn: [0],
            codesToReturn: ['000032501'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000552': // COMPANY MESSAGE
        {
            flightPhaseInhib: [],
            simVarIsActive: [1, 2, 6, 9, 10].includes(flightPhase) && compMesgCount > 0,
            whichCodeToReturn: [0],
            codesToReturn: ['000055201'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000260': // ENG ANTI ICE
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
        '0000270': // WING ANTI ICE
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
        '0000275': // ICE NOT DETECTED
        {
            flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
            simVarIsActive: iceNotDetTimer2.read() && !aircraftOnGround,
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
        '0000080': // SEAT BELTS
        {
            flightPhaseInhib: [],
            simVarIsActive: !!seatBelt,
            whichCodeToReturn: [0],
            codesToReturn: ['000008001'],
            memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
        '0000085': // PORTABLE DEVICES
        {
            flightPhaseInhib: [],
            simVarIsActive: !!(noSmoking === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['000008501'],
            memoInhibit: !!(tomemo === 1 || ldgmemo === 1),
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
        let tempMemoArrayRight:string[] = [];

        for (const [, value] of Object.entries(EWDMessageMemos)) {
            if (value.simVarIsActive && !(value.memoInhibit) && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                const newCode: string[] = [];

                const codeIndex = value.whichCodeToReturn.filter((e) => e !== null);
                codeIndex.forEach((e: number) => {
                    newCode.push(value.codesToReturn[e]);
                });

                if (value.side === 'RIGHT') {
                    const tempArrayRight = tempMemoArrayRight.filter((e) => !value.codesToReturn.includes(e));
                    tempMemoArrayRight = tempArrayRight.concat(newCode);
                }
            }
        }
        const mesgOrderLeft: string[] = [];
        const mesgOrderRight: string[] = [];
        for (const [, value] of Object.entries(EWDMessageMemos)) {
            if (value.side === 'LEFT') {
                mesgOrderLeft.push(...value.codesToReturn);
            } else {
                mesgOrderRight.push(...value.codesToReturn);
            }
        }
        let orderedMemoArrayRight = mapOrder(tempMemoArrayRight, mesgOrderRight);

        const specialLines = ['000014001', '000015001', '000035001', '000036001', '220001501', '220002101'];
        const filteredMemo = orderedMemoArrayRight.filter((e) => !specialLines.includes(e));
        const specLinesInMemo = orderedMemoArrayRight.filter((e) => specialLines.includes(e));
        if (specLinesInMemo.length > 0) {
            orderedMemoArrayRight = [...specLinesInMemo, ...filteredMemo];
        }
        setMemoMessageRight(orderedMemoArrayRight);

        //
    }, [ac1BusPowered,
        ac2BusPowered,
        adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
        adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
        adiru1State,
        adiru2State,
        adiru3State,
        agent1Eng1Discharge,
        agent1Eng2Discharge,
        agent2Eng1Discharge,
        agent2Eng2Discharge,
        agentAPUDischarge,
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
        autoThrustStatus,
        blueElecPumpPBAuto,
        blueRvrLow,
        brakeFan,
        cabAltSetResetState1,
        cabAltSetResetState2,
        cabinReady,
        cabinRecircBtnOn,
        cargoFireAgentDisch,
        cargoFireTest,
        compMesgCount,
        computedAirSpeedToNearest2,
        configPortableDevices,
        dcESSBusPowered,
        dmcSwitchingKnob,
        emergencyGeneratorOn,
        engine1ValueSwitch,
        engine2ValueSwitch,
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
        engSelectorPosition,
        excessPressure,
        fac1Failed,
        fireButton1,
        fireButton2,
        fireButtonAPU,
        flapsHandle,
        flapsIndex,
        flightPhase,
        flightPhaseInhibitOverride,
        fobRounded,
        fuel,
        fuelXFeedPBOn,
        gpwsFlapMode,
        gpwsFlaps3,
        gpwsOff,
        greenHydEng1PBAuto,
        height1Failed,
        height2Failed,
        hydPTU,
        iceDetectedTimer1,
        iceDetectedTimer2,
        iceNotDetTimer1,
        iceNotDetTimer2,
        iceSevereDetectedTimer,
        landingLight2Retracted,
        landingLight3Retracted,
        ldgmemo,
        leftOuterInnerValve,
        ndXfrKnob,
        noSmoking,
        noSmokingSwitchPosition,
        nwSteeringDisc,
        packOffBleedIsAvailable1,
        packOffBleedIsAvailable1,
        packOffNotFailure1,
        packOffNotFailure2,
        parkBrake,
        predWSOn,
        ratDeployed,
        rightOuterInnerValve,
        seatBelt,
        showTakeoffInhibit,
        showLandingInhibit,
        speedBrake,
        spoilersArmed,
        strobeLightsOn,
        tcasFault,
        tcasMode,
        tcasSensitivity,
        toconfig,
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
            SimVar.SetSimVarValue(`L:A380X_EWD_RIGHT_LINE_${value}`, 'string', '');
        });
        if (memoMessageRight.length > 0) {
            memoMessageRight.forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A380X_EWD_RIGHT_LINE_${index + 1}`, 'string', value);
            });
        }
    }, [memoMessageRight]);

    return null;
};

export default PseudoFWC;
