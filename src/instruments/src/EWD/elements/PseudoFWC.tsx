import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { NXDataStore } from '@shared/persistence';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useUpdate } from '@instruments/common/hooks';
import { NXLogicConfirmNode, NXLogicClockNode, NXLogicMemoryNode } from '@instruments/common/NXLogic';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@shared/arinc429';

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
    const [elac1HydConfirmNode] = useState(() => new NXLogicConfirmNode(3, false));
    const [elac1FaultConfirmNode] = useState(() => new NXLogicConfirmNode(0.6, true));
    const [elac1HydConfirmNodeOutput, setElac1HydConfirmNodeOutput] = useState(false);
    const [elac1FaultConfirmNodeOutput, setElac1FaultConfirmNodeOutput] = useState(false);
    const [elac2HydConfirmNode] = useState(() => new NXLogicConfirmNode(3, false));
    const [elac2FaultConfirmNode] = useState(() => new NXLogicConfirmNode(0.6, true));
    const [elac2HydConfirmNodeOutput, setElac2HydConfirmNodeOutput] = useState(false);
    const [elac2FaultConfirmNodeOutput, setElac2FaultConfirmNodeOutput] = useState(false);
    const [altn1LawConfirmNode] = useState(() => new NXLogicConfirmNode(0.3, true));
    const [altn1LawConfirmNodeOutput, setAltn1LawConfirmNodeOutput] = useState(false);
    const [altn2LawConfirmNode] = useState(() => new NXLogicConfirmNode(0.3, true));
    const [altn2LawConfirmNodeOutput, setAltn2LawConfirmNodeOutput] = useState(false);

    const [memoMessageLeft, setMemoMessageLeft] = useState<string[]>([]);
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
    const [engine1Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL', 'bool', 500);
    const [engine2Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL', 'bool', 500);
    const [emergencyElectricGeneratorPotential] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number', 500);
    const [dcESSBusPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool', 500);
    const [dc2BusPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool', 500);
    const [ac1BusPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 500);
    const [ac2BusPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 500);
    const [acESSBusPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', 'bool', 500);
    const emergencyGeneratorOn = emergencyElectricGeneratorPotential > 0 ? 1 : 0;

    /* ENGINE AND THROTTLE */

    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500);
    const [throttle1Position] = useSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'number', 100);
    const [throttle2Position] = useSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'number', 100);
    const [engine1ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:1', 'bool', 500);
    const [engine2ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:2', 'bool', 500);
    const [N1Eng1] = useSimVar('L:A32NX_ENGINE_N1:1', 'number', 500);
    const [N1Eng2] = useSimVar('L:A32NX_ENGINE_N1:2', 'number', 500);
    const [N1IdleEng1] = useSimVar('L:A32NX_ENGINE_IDLE_N1:1', 'number', 500);
    const [N1IdleEng2] = useSimVar('L:A32NX_ENGINE_IDLE_N1:2', 'number', 500);
    const N1AboveIdle = Math.floor(N1Eng1) > N1IdleEng1 ? 1 : 0;
    const N2AboveIdle = Math.floor(N1Eng2) > N1IdleEng2 ? 1 : 0;
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

    useEffect(() => {
        if (eng1FireTest === 0 && eng2FireTest === 0 && apuFireTest === 0 && cargoFireTest === 0) {
            masterWarning(0);
        }
    }, [eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest]);

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
    const [greenSysPressurised] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool', 500);
    const [greenHydEng1PBAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool', 500);
    const [blueLP] = useSimVar('L:A32NX_HYD_BLUE_EDPUMP_LOW_PRESS', 'bool', 500);
    const [blueSysPressurised] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool', 500);
    const [blueRvrLow] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR_LEVEL_IS_LOW', 'bool', 500);
    const [blueElecPumpPBAuto] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'bool', 500);
    const [yellowLP] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'bool', 500);
    const [yellowSysPressurised] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool', 500);
    const [eng1pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool', 500);
    const [eng2pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'bool', 500);
    const [hydPTU] = useSimVar('L:A32NX_HYD_PTU_ON_ECAM_MEMO', 'bool', 500);
    const [ratDeployed] = useSimVar('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100', 500);

    /* F/CTL */
    const fcdc1DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_1');
    const fcdc2DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_1');
    const fcdc1DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_2');
    const fcdc2DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_2');
    const fcdc1DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_3');
    const fcdc2DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_3');
    const fcdc1DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_4');
    const fcdc2DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_4');

    const spoilersArmed = fcdc1DiscreteWord4.getBitValueOr(27, false) || fcdc2DiscreteWord4.getBitValueOr(27, false);
    const speedBrakeCommand = fcdc1DiscreteWord4.getBitValueOr(28, false) || fcdc2DiscreteWord4.getBitValueOr(28, false);

    // ELAC 1 FAULT computation
    const se1f = (fcdc1DiscreteWord1.getBitValueOr(19, false) || fcdc2DiscreteWord1.getBitValueOr(19, false))
    && (fcdc1DiscreteWord1.getBitValueOr(20, false) || fcdc2DiscreteWord1.getBitValueOr(20, false));
    const elac1FaultCondition = !([1, 10].includes(flightPhase) && (fcdc1DiscreteWord3.getBitValueOr(19, false) || fcdc2DiscreteWord3.getBitValueOr(19, false)))
    && dcESSBusPowered
    && ((fcdc1DiscreteWord1.getBitValueOr(23, false) || fcdc2DiscreteWord1.getBitValueOr(23, false)) || (!elac1HydConfirmNodeOutput && se1f));
    const elac1FaultLine123Display = !(fcdc1DiscreteWord3.getBitValueOr(19, false) || fcdc2DiscreteWord3.getBitValueOr(19, false))
    && (fcdc1DiscreteWord1.getBitValueOr(23, false) || fcdc2DiscreteWord1.getBitValueOr(23, false));
    const elac1FaultLine45Display = false;

    // ELAC 2 FAULT computation
    const se2f = (fcdc1DiscreteWord1.getBitValueOr(21, false) || fcdc2DiscreteWord1.getBitValueOr(21, false))
        && (fcdc1DiscreteWord1.getBitValueOr(22, false) || fcdc2DiscreteWord1.getBitValueOr(22, false));
    const elac2FaultCondition = !([1, 10].includes(flightPhase) && (fcdc1DiscreteWord3.getBitValueOr(20, false) || fcdc2DiscreteWord3.getBitValueOr(20, false)))
        && dc2BusPowered
        && ((fcdc1DiscreteWord1.getBitValueOr(24, false) || fcdc2DiscreteWord1.getBitValueOr(24, false))
        || (!elac2HydConfirmNodeOutput && se2f));
    const elac2FaultLine123Display = !(fcdc1DiscreteWord3.getBitValueOr(20, false) || fcdc2DiscreteWord3.getBitValueOr(20, false))
        && (fcdc1DiscreteWord1.getBitValueOr(24, false) || fcdc2DiscreteWord1.getBitValueOr(24, false));
    const elac2FaultLine45Display = false;

    // SEC 1 FAULT computation
    const ss1f = fcdc1DiscreteWord1.getBitValueOr(25, false) || fcdc2DiscreteWord1.getBitValueOr(25, false);
    const sec1FaultCondition = !([1, 10].includes(flightPhase) && (fcdc1DiscreteWord3.getBitValueOr(27, false) || fcdc2DiscreteWord3.getBitValueOr(27, false)))
        && dcESSBusPowered
        && ss1f;
    const sec1FaultLine123Display = !(fcdc1DiscreteWord3.getBitValueOr(27, false) || fcdc2DiscreteWord3.getBitValueOr(27, false));
    const sec1FaultLine45Display = false;

    // SEC 2 FAULT computation
    const ss2f = fcdc1DiscreteWord1.getBitValueOr(26, false) || fcdc2DiscreteWord1.getBitValueOr(26, false);
    const sec2FaultCondition = !([1, 10].includes(flightPhase) && (fcdc1DiscreteWord3.getBitValueOr(28, false) || fcdc2DiscreteWord3.getBitValueOr(28, false)))
            && dc2BusPowered
            && ss2f;
    const sec2FaultLine123Display = !(fcdc1DiscreteWord3.getBitValueOr(28, false) || fcdc2DiscreteWord3.getBitValueOr(28, false));

    // SEC 3 FAULT computation
    const ss3f = fcdc1DiscreteWord1.getBitValueOr(29, false) || fcdc2DiscreteWord1.getBitValueOr(29, false);
    const sec3FaultCondition = !([1, 10].includes(flightPhase) && (fcdc1DiscreteWord3.getBitValueOr(29, false) || fcdc2DiscreteWord3.getBitValueOr(29, false)))
        && dc2BusPowered
        && ss3f;
    const sec3FaultLine123Display = !(fcdc1DiscreteWord3.getBitValueOr(29, false) || fcdc2DiscreteWord3.getBitValueOr(29, false));

    // FCDC 1+2 FAULT computation
    const SFCDC1FT = fcdc1DiscreteWord1.isFailureWarning() && fcdc1DiscreteWord2.isFailureWarning() && fcdc1DiscreteWord3.isFailureWarning();
    const SFCDC2FT = fcdc2DiscreteWord1.isFailureWarning() && fcdc2DiscreteWord2.isFailureWarning() && fcdc2DiscreteWord3.isFailureWarning();
    const SFCDC12FT = SFCDC1FT && SFCDC2FT;
    const fcdc12FaultCondition = SFCDC12FT && dc2BusPowered;
    const fcdc1FaultCondition = SFCDC1FT && !SFCDC12FT;
    const fcdc2FaultCondition = SFCDC2FT && !(SFCDC12FT || !dc2BusPowered);

    // ALTN LAW 2 computation
    const SPA2 = fcdc1DiscreteWord1.getBitValueOr(13, false) || fcdc2DiscreteWord1.getBitValueOr(13, false);
    const altn2Condition = SPA2 && ![1, 10].includes(flightPhase);

    // ALTN LAW 1 computation
    const SPA1 = fcdc1DiscreteWord1.getBitValueOr(12, false) || fcdc2DiscreteWord1.getBitValueOr(12, false);
    const altn1Condition = SPA1 && ![1, 10].includes(flightPhase);

    // DIRECT LAW computation
    const SPBUL = (false && SFCDC12FT) || (fcdc1DiscreteWord1.getBitValueOr(15, false) || fcdc2DiscreteWord1.getBitValueOr(15, false));
    const directLawCondition = SPBUL && ![1, 10].includes(flightPhase);

    // L+R ELEV FAULT computation
    const lhElevBlueFail = (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.getBitValueOr(15, false))
    || (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.getBitValueOr(15, false));
    const lhElevGreenFail = (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.getBitValueOr(16, false))
    || (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.getBitValueOr(16, false));
    const rhElevBlueFail = (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.getBitValueOr(17, false))
    || (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.getBitValueOr(17, false));
    const rhElevGreenFail = (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.getBitValueOr(18, false))
    || (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.getBitValueOr(18, false));
    const lrElevFaultCondition = lhElevBlueFail && lhElevGreenFail && rhElevBlueFail && rhElevGreenFail && ![1, 10].includes(flightPhase);

    /* LANDING GEAR AND LIGHTS */
    // const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 500);
    // const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 500);
    // const aircraftOnGround = left1LandingGear === 1 || right1LandingGear === 1;
    // FIXME The landing gear triggers the dual engine failure on loading
    const aircraftOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const [landingGearLeverDown] = useSimVar('GEAR HANDLE POSITION', 'bool', 500);
    const [landingLight2Retracted] = useSimVar('L:LANDING_2_Retracted', 'bool', 500);
    const [landingLight3Retracted] = useSimVar('L:LANDING_3_Retracted', 'bool', 500);
    const [autoBrakesArmedMode] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [antiskidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'bool', 500);
    const [lgciu1Fault] = useSimVar('L:A32NX_LGCIU_1_FAULT', 'bool', 500);
    const [lgciu2Fault] = useSimVar('L:A32NX_LGCIU_2_FAULT', 'bool', 500);

    /* OTHER STUFF */

    const [seatBelt] = useSimVar('A:CABIN SEATBELTS ALERT SWITCH', 'bool', 500);
    const [noSmoking] = useSimVar('L:A32NX_NO_SMOKING_MEMO', 'bool', 500);
    const [noSmokingSwitchPosition] = useSimVar('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'enum', 500);

    const [strobeLightsOn] = useSimVar('L:LIGHTING_STROBE_0', 'bool', 500);

    const [gpwsFlapMode] = useSimVar('L:A32NX_GPWS_FLAP_OFF', 'bool', 500);
    const [tomemo] = useSimVar('L:A32NX_FWS_TOMEMO', 'bool', 500);
    const [ldgmemo] = useSimVar('L:A32NX_FWS_LDGMEMO', 'bool', 500);
    const [toinhibit] = useSimVar('L:A32NX_FWS_TOINHIBIT', 'bool', 500);
    const [ldginhibit] = useSimVar('L:A32NX_FWS_LDGINHIBIT', 'bool', 500);

    const [autoBrake] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 500);
    const [flapsHandle] = useSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'enum', 500);
    const [flapsIndex] = useSimVar('L:A32NX_FLAPS_CONF_INDEX', 'number', 100);

    const [slatsAngle] = useSimVar('L:A32NX_LEFT_SLATS_ANGLE', 'degrees', 100);
    const slatsInfD = slatsAngle <= 17;
    const slatsSupG = slatsAngle >= 25;

    const [flapsAngle] = useSimVar('L:A32NX_LEFT_FLAPS_ANGLE', 'degrees', 100);
    const flapsInfA = flapsAngle <= 2;
    const flapsSupF = flapsAngle >= 24;

    const [toconfig] = useSimVar('L:A32NX_TO_CONFIG_NORMAL', 'bool', 100);

    const [adirsRemainingAlignTime] = useSimVar('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'seconds', 1000);
    const [adiru1State] = useSimVar('L:A32NX_ADIRS_ADIRU_1_STATE', 'enum', 500);
    const [adiru2State] = useSimVar('L:A32NX_ADIRS_ADIRU_2_STATE', 'enum', 500);
    const [adiru3State] = useSimVar('L:A32NX_ADIRS_ADIRU_3_STATE', 'enum', 500);

    const [callPushAll] = useSimVar('L:PUSH_OVHD_CALLS_ALL', 'bool', 100);
    const [callPushForward] = useSimVar('L:PUSH_OVHD_CALLS_FWD', 'bool', 100);
    const [callPushAft] = useSimVar('L:PUSH_OVHD_CALLS_AFT', 'bool', 100);
    const [cabinReady] = useSimVar('L:A32NX_CABIN_READY', 'bool');

    const [toconfigBtn] = useSimVar('L:A32NX_BTN_TOCONFIG', 'bool');
    const [flapsMcdu] = useSimVar('L:A32NX_TO_CONFIG_FLAPS', 'number', 500);
    const [flapsMcduEntered] = useSimVar('L:A32NX_TO_CONFIG_FLAPS_ENTERED', 'bool', 500);
    const [parkBrake] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'bool', 500);
    const [brakesHot] = useSimVar('L:A32NX_BRAKES_HOT', 'bool', 500);
    const [v1Speed] = useSimVar('L:AIRLINER_V1_SPEED', 'knots', 500);
    const [vrSpeed] = useSimVar('L:AIRLINER_VR_SPEED', 'knots', 500);
    const [v2Speed] = useSimVar('L:AIRLINER_V2_SPEED', 'knots');
    const [cabin] = useSimVar('INTERACTIVE POINT OPEN:0', 'percent', 1000);
    const [catering] = useSimVar('INTERACTIVE POINT OPEN:3', 'percent', 1000);
    const [cargofwdLocked] = useSimVar('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool', 1000);
    const [cargoaftLocked] = useSimVar('L:A32NX_AFT_DOOR_CARGO_LOCKED', 'bool', 1000);
    const [apuMasterSwitch] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
    const [flightPhaseInhibitOverride] = useSimVar('L:A32NX_FWS_INHIBOVRD', 'bool', 500);
    const [nwSteeringDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'bool', 500);
    const [predWSOn] = useSimVar('L:A32NX_SWITCH_RADAR_PWS_Position', 'bool', 1000);
    const [gpwsTerrOff] = useSimVar('L:A32NX_GPWS_TERR_OFF', 'bool', 500);
    const [gpwsSysOff] = useSimVar('L:A32NX_GPWS_SYS_OFF', 'Bool');
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
    const [manLandingElevation] = useSimVar('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'number', 500);
    const [ATTKnob] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum', 500);
    const [AIRKnob] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum', 500);

    const [radioAlt] = useSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'Feet', 500);
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
    const [pack1Fault] = useSimVar('L:A32NX_OVHD_COND_PACK_1_PB_HAS_FAULT', 'bool');
    const [pack2Fault] = useSimVar('L:A32NX_OVHD_COND_PACK_2_PB_HAS_FAULT', 'bool');
    const [pack1On] = useSimVar('L:A32NX_OVHD_COND_PACK_1_PB_IS_ON', 'bool');
    const [pack2On] = useSimVar('L:A32NX_OVHD_COND_PACK_2_PB_IS_ON', 'bool');
    const [excessPressure] = useSimVar('L:A32NX_PRESS_EXCESS_CAB_ALT', 'bool', 500);

    const [voiceVHF3] = useSimVar('A:COM ACTIVE FREQUENCY:3', 'number', 500);

    const [fwc1Normal] = useSimVar('L:A32NX_FWS_FWC_1_NORMAL', 'bool');
    const [fwc2Normal] = useSimVar('L:A32NX_FWS_FWC_2_NORMAL', 'bool');

    /* WARNINGS AND FAILURES */
    const landASAPRed: boolean = !!(!aircraftOnGround
    && (
        fireButton1 === 1
        || eng1FireTest === 1
        || fireButton2 === 1
        || eng2FireTest === 1
        || fireButtonAPU === 1
        || apuFireTest === 1
        || emergencyGeneratorOn
        || (engine1State === 0 && engine2State === 0)
        || (greenLP === 1 && yellowLP === 1)
        || (yellowLP === 1 && blueLP === 1)
        || (greenLP === 1 && blueLP === 1)
    ));

    const engDualFault = !!(!aircraftOnGround && (
        (fireButton1 === 1 && fireButton2 === 1)
        || (!engine1ValueSwitch && !engine2ValueSwitch)
        || (engine1State === 0 && engine2State === 0)
        || (!N1AboveIdle && !N2AboveIdle)
    ));

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
        SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'Bool', toggle);
    };

    const masterCaution = (toggle: number) => {
        SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'Bool', toggle);
    };

    useEffect(() => {
        masterWarning(0);
    }, [masterWarningButtonLeft, masterWarningButtonRight]);

    useEffect(() => {
        masterCaution(0);
    }, [masterCautionButtonLeft, masterCautionButtonRight]);

    useEffect(() => {
        if (clearButtonLeft === 1 || clearButtonRight === 1) {
            if (typeof failuresLeft !== 'undefined' && failuresLeft.length > 0) {
                const updatedLeftFailures = failuresLeft.slice(1);
                const updatedRecallFailures = allCurrentFailures.filter((item) => !updatedLeftFailures.includes(item));
                setRecallFailures(updatedRecallFailures);
                setFailuresLeft(updatedLeftFailures);
            }
        }
        setRecallReset(!recallReset);
        SimVar.SetSimVarValue('L:A32NX_BTN_CLR', 'Bool', 0);
        SimVar.SetSimVarValue('L:A32NX_BTN_CLR2', 'Bool', 0);
    }, [clearButtonLeft, clearButtonRight]);

    useEffect(() => {
        if (recallButton === 1) {
            if (recallFailures.length > 0) {
                const recall = recallFailures[0];
                const updatedRecallFailures = recallFailures.slice(1);
                const updatedLeftFailures: string[] = failuresLeft.concat([recall]);
                setRecallFailures(updatedRecallFailures);
                setFailuresLeft(updatedLeftFailures);
            }
            setRecallReset(!recallReset);
        }
    }, [recallButton]);

    /* TICK CHECK */
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

        const elac1HydraulicResult = elac1HydConfirmNode.write(!greenSysPressurised && !blueSysPressurised, deltaTime);
        if (elac1HydConfirmNodeOutput !== elac1HydraulicResult) {
            setElac1HydConfirmNodeOutput(elac1HydraulicResult);
        }

        const elac1FaultResult = elac1FaultConfirmNode.write(elac1FaultCondition, deltaTime);
        if (elac1FaultConfirmNodeOutput !== elac1FaultResult) {
            setElac1FaultConfirmNodeOutput(elac1FaultResult);
        }

        const elac2HydraulicResult = elac2HydConfirmNode.write((!greenSysPressurised || !yellowSysPressurised) && !blueSysPressurised, deltaTime);
        if (elac2HydConfirmNodeOutput !== elac2HydraulicResult) {
            setElac2HydConfirmNodeOutput(elac2HydraulicResult);
        }

        const elac2FaultResult = elac2FaultConfirmNode.write(elac2FaultCondition, deltaTime);
        if (elac2FaultConfirmNodeOutput !== elac2FaultResult) {
            setElac2FaultConfirmNodeOutput(elac2FaultResult);
        }

        const altn1Result = altn1LawConfirmNode.write(altn1Condition, deltaTime);
        if (altn1LawConfirmNodeOutput !== altn1Result) {
            setAltn1LawConfirmNodeOutput(altn1Result);
        }

        const altn2Result = altn2LawConfirmNode.write(altn2Condition, deltaTime);
        if (altn2LawConfirmNodeOutput !== altn2Result) {
            setAltn2LawConfirmNodeOutput(altn2Result);
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

    const EWDMessageFailures: EWDMessageDict = {
        3400210: { // OVERSPEED FLAPS FULL
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: flapsIndex === 5 && computedAirSpeedToNearest2 > 181,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['340021001', '340021002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400220: { // OVERSPEED FLAPS 3
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: flapsIndex === 4 && computedAirSpeedToNearest2 > 189,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['340022001', '340022002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400230: { // OVERSPEED FLAPS 2
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: flapsIndex === 3 && computedAirSpeedToNearest2 > 203,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['340023001', '340023002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400235: { // OVERSPEED FLAPS 1+F
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: flapsIndex === 2 && computedAirSpeedToNearest2 > 219,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['340023501', '340023502'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400240: { // OVERSPEED FLAPS 1
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: flapsIndex === 1 && computedAirSpeedToNearest2 > 233,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['340024001', '340024002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        7700027: { // DUAL ENGINE FAILURE
            flightPhaseInhib: [],
            simVarIsActive: engDualFault === true,
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
                throttle1Position !== 0 && !aircraftOnGround ? 1 : null,
                (throttle1Position !== 0 || throttle2Position !== 0) && aircraftOnGround ? 2 : null,
                !parkBrake && aircraftOnGround ? 3 : null,
                !parkBrake && aircraftOnGround ? 4 : null,
                aircraftOnGround ? 5 : null,
                aircraftOnGround ? 6 : null,
                !engine1ValueSwitch ? null : 7,
                !fireButton1 ? 8 : null,
                !aircraftOnGround && agent1Eng1Discharge === 1 && !eng1Agent1PB ? 9 : null,
                agent1Eng1Discharge === 2 && !aircraftOnGround && !eng1Agent1PB ? 10 : null,
                !eng1Agent1PB && aircraftOnGround ? 11 : null,
                !eng1Agent2PB && aircraftOnGround ? 12 : null,
                aircraftOnGround ? 13 : null,
                !aircraftOnGround ? 14 : null,
                agent2Eng1Discharge === 1 && !eng1Agent2PB ? 15 : null,
                (agent2Eng1Discharge === 1 && !eng1Agent2PB) || (agent2Eng1Discharge === 2 && !eng1Agent2PB) ? 16 : null,
            ],
            codesToReturn: ['260001001', '260001002', '260001003', '260001004', '260001005',
                '260001006', '260001007', '260001008', '260001009', '260001010', '260001011',
                '260001012', '260001013', '260001014', '260001015', '260001016', '260001017'],
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
                throttle2Position !== 0 && !aircraftOnGround ? 1 : null,
                (throttle1Position !== 0 || throttle2Position !== 0) && aircraftOnGround ? 2 : null,
                !parkBrake && aircraftOnGround ? 3 : null,
                !parkBrake && aircraftOnGround ? 4 : null,
                aircraftOnGround ? 5 : null,
                aircraftOnGround ? 6 : null,
                !engine2ValueSwitch ? null : 7,
                !fireButton2 ? 8 : null,
                !aircraftOnGround && agent1Eng2Discharge === 1 && !eng2Agent1PB ? 9 : null,
                agent1Eng2Discharge === 2 && !aircraftOnGround && !eng2Agent1PB ? 10 : null,
                !eng2Agent1PB && aircraftOnGround ? 11 : null,
                !eng2Agent2PB && aircraftOnGround ? 12 : null,
                aircraftOnGround ? 13 : null,
                !aircraftOnGround ? 14 : null,
                agent2Eng2Discharge === 1 && !eng2Agent2PB ? 15 : null,
                (agent2Eng2Discharge === 1 && !eng2Agent2PB) || (agent2Eng2Discharge === 2 && !eng2Agent2PB) ? 16 : null,
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
                agentAPUDischarge === 1 && !apuAgentPB ? 2 : null,
                agentAPUDischarge === 2 && !apuAgentPB ? 3 : null,
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
            simVarIsActive: (
                flapsMcduEntered === 1
                && flapsHandle !== flapsMcdu
                && [1, 2, 9].includes(flightPhase)
                && toconfigFailed
            )
            || (
                [3, 4, 5].includes(flightPhase) && (slatsInfD || slatsSupG)
            ),
            whichCodeToReturn: [0, 1],
            codesToReturn: ['270008501', '270008502'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        2700090: { // FLAPS NOT IN TO CONFIG
            flightPhaseInhib: [5, 6, 7, 8],
            simVarIsActive: (
                flapsMcduEntered === 1
                && flapsHandle !== flapsMcdu
                && [1, 2, 9].includes(flightPhase)
                && toconfigFailed
            )
            || (
                [3, 4, 5].includes(flightPhase) && (flapsInfA || flapsSupF)
            ),
            whichCodeToReturn: [0, 1],
            codesToReturn: ['270009001', '270009002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        2700110: { // ELAC 1 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: elac1FaultConfirmNodeOutput,
            whichCodeToReturn: [
                0,
                elac1FaultLine123Display ? 1 : null,
                elac1FaultLine123Display ? 2 : null,
                elac1FaultLine123Display ? 3 : null,
                elac1FaultLine45Display ? 4 : null,
                elac1FaultLine45Display ? 5 : null,
            ],
            codesToReturn: ['270011001', '270011002', '270011003', '270011004', '270011005', '270011006'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700120: { // ELAC 2 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: elac2FaultConfirmNodeOutput,
            whichCodeToReturn: [
                0,
                elac2FaultLine123Display ? 1 : null,
                elac2FaultLine123Display ? 2 : null,
                elac2FaultLine123Display ? 3 : null,
                elac2FaultLine45Display ? 4 : null,
                elac2FaultLine45Display ? 5 : null,
            ],
            codesToReturn: ['270012001', '270012002', '270012003', '270012004', '270012005', '270012006'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700210: { // SEC 1 FAULT
            flightPhaseInhib: [3, 4, 5],
            simVarIsActive: sec1FaultCondition,
            whichCodeToReturn: [
                0,
                sec1FaultLine123Display ? 1 : null,
                sec1FaultLine123Display ? 2 : null,
                sec1FaultLine123Display ? 3 : null,
                sec1FaultLine45Display ? 4 : null,
            ],
            codesToReturn: ['270021001', '270021002', '270021003', '270021004', '270021005'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700220: { // SEC 2 FAULT
            flightPhaseInhib: [3, 4, 5],
            simVarIsActive: sec2FaultCondition,
            whichCodeToReturn: [
                0,
                sec2FaultLine123Display ? 1 : null,
                sec2FaultLine123Display ? 2 : null,
                sec2FaultLine123Display ? 3 : null,
            ],
            codesToReturn: ['270022001', '270022002', '270022003', '270022004'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700230: { // SEC 3 FAULT
            flightPhaseInhib: [3, 4, 5],
            simVarIsActive: sec3FaultCondition,
            whichCodeToReturn: [
                0,
                sec3FaultLine123Display ? 1 : null,
                sec3FaultLine123Display ? 2 : null,
                sec3FaultLine123Display ? 3 : null,
            ],
            codesToReturn: ['270023001', '270023002', '270023003', '270023004'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700360: { // FCDC 1+2 FAULT
            flightPhaseInhib: [3, 4, 5, 7],
            simVarIsActive: fcdc12FaultCondition,
            whichCodeToReturn: [0, 1],
            codesToReturn: ['270036001', '270036002'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700365: { // DIRECT LAW
            flightPhaseInhib: [4, 5, 7, 8],
            simVarIsActive: directLawCondition,
            whichCodeToReturn: [0, 1, 2, 3, 4, null, 6, 7],
            codesToReturn: ['270036501', '270036502', '270036503', '270036504', '270036505', '270036506', '270036507', '270036508'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700375: { // ALTN 2
            flightPhaseInhib: [4, 5, 7, 8],
            simVarIsActive: altn2LawConfirmNodeOutput,
            whichCodeToReturn: [0, 1, null, 3, 4, null, 6],
            codesToReturn: ['270037501', '270037502', '270037503', '270037504', '270037505', '270037506', '270037507'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700390: { // ALTN 1
            flightPhaseInhib: [4, 5, 7, 8],
            simVarIsActive: altn1LawConfirmNodeOutput,
            whichCodeToReturn: [0, 1, null, 3, 4, null, 6],
            codesToReturn: ['270039001', '270039002', '270039003', '270039004', '270039005', '270039006', '270039007'],
            memoInhibit: false,
            failure: 2,
            sysPage: 10,
            side: 'LEFT',
        },
        2700400: { // L+R ELEV FAULT
            flightPhaseInhib: [],
            simVarIsActive: lrElevFaultCondition,
            whichCodeToReturn: [0, 1, 2, null, null, 5],
            codesToReturn: ['270040001', '270040002', '270040003', '270040004', '270040005', '270040006'],
            memoInhibit: false,
            failure: 3,
            sysPage: 10,
            side: 'LEFT',
        },
        2700555: { // FCDC 1 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: fcdc1FaultCondition,
            whichCodeToReturn: [0],
            codesToReturn: ['270055501'],
            memoInhibit: false,
            failure: 1,
            sysPage: -1,
            side: 'LEFT',
        },
        2700557: { // FCDC 2 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: fcdc2FaultCondition,
            whichCodeToReturn: [0],
            codesToReturn: ['270055701'],
            memoInhibit: false,
            failure: 1,
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
        2131221: { // EXCESS CAB ALT
            flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
            simVarIsActive: !!(!aircraftOnGround && excessPressure === 1),
            // TODO no separate slats indication
            whichCodeToReturn: [
                0,
                cabAltSetResetState1 ? 1 : null,
                cabAltSetResetState2 && seatBelt !== 1 ? 2 : null,
                cabAltSetResetState2 ? 3 : null,
                cabAltSetResetState1 ? 4 : null,
                cabAltSetResetState2 && (throttle1Position !== 0 || throttle2Position !== 0) && autoThrustStatus !== 2 ? 5 : null,
                cabAltSetResetState2 && !speedBrakeCommand ? 6 : null,
                cabAltSetResetState2 ? 7 : null,
                cabAltSetResetState2 && engSelectorPosition !== 2 ? 8 : null,
                cabAltSetResetState2 ? 9 : null,
                cabAltSetResetState1 && !cabAltSetResetState2 ? 10 : null,
                cabAltSetResetState2 ? 11 : null,
                cabAltSetResetState2 ? 12 : null,
                cabAltSetResetState2 ? 13 : null,
                14,
                15,
                16,
            ],
            codesToReturn: ['213122101', '213122102', '213122103', '213122104', '213122105',
                '213122106', '213122107', '213122108', '213122109', '213122110', '213122111', '213122112', '213122113', '213122114', '213122115', '213122116'],
            memoInhibit: false,
            failure: 3,
            sysPage: 2,
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
                !aircraftOnGround ? 5 : null,
                !aircraftOnGround ? 6 : null,
                aircraftOnGround ? 7 : null,
                aircraftOnGround ? 8 : null,
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
                !!((throttle1Position !== 35 && thrustLeverNotSet) || (throttle2Position !== 35 && thrustLeverNotSet))
            ),
            whichCodeToReturn: [
                0,
                autothrustLeverWarningFlex === 1 ? 1 : null,
                autothrustLeverWarningTOGA === 1 ? 2 : null,
            ],
            codesToReturn: ['770064701', '770064702', '770064703'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        2161207: { // PACK 1 ABNORMALLY OFF
            flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
            simVarIsActive: packOffNotFailed1.read(),
            whichCodeToReturn: [0],
            codesToReturn: ['216120701'],
            memoInhibit: false,
            failure: 2,
            sysPage: 1,
            side: 'LEFT',
        },
        2161208: { // PACK 2 ABNORMALLY OFF
            flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
            simVarIsActive: packOffNotFailed2.read(),
            whichCodeToReturn: [0],
            codesToReturn: ['216120801'],
            memoInhibit: false,
            failure: 2,
            sysPage: 1,
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
        3200180: { // LGCIU 1 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: lgciu1Fault && !(lgciu1Fault && lgciu2Fault) && dcESSBusPowered,
            whichCodeToReturn: [0, !gpwsSysOff ? 1 : null],
            codesToReturn: ['320018001', '320018002'],
            memoInhibit: false,
            failure: 1,
            sysPage: -1,
            side: 'LEFT',
        },
        3200190: { // LGCIU 2 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: lgciu2Fault && !(lgciu1Fault && lgciu2Fault) && dc2BusPowered,
            whichCodeToReturn: [0],
            codesToReturn: ['320019001'],
            memoInhibit: false,
            failure: 1,
            sysPage: -1,
            side: 'LEFT',
        },
        3200195: { // LGCIU 1+2 FAULT
            flightPhaseInhib: [4, 5, 7, 8],
            simVarIsActive: lgciu1Fault && lgciu2Fault && dc2BusPowered && dcESSBusPowered,
            whichCodeToReturn: [0, 1, !gpwsSysOff ? 2 : null],
            codesToReturn: ['320019501', '320019502', '320019503'],
            memoInhibit: false,
            failure: 2,
            sysPage: 9,
            side: 'LEFT',
        },
        3400140: { // RA 1 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: height1Failed && ac1BusPowered,
            whichCodeToReturn: [0],
            codesToReturn: ['340014001'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        3400150: { // RA 2 FAULT
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: height2Failed && ac2BusPowered,
            whichCodeToReturn: [0],
            codesToReturn: ['340015001'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
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
            simVarIsActive: !!(flightPhase === 6 && tcasSensitivity === 1),
            whichCodeToReturn: [0],
            codesToReturn: ['340050701'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        3200010: { // L/G-BRAKES OVHT
            flightPhaseInhib: [4, 8, 9, 10],
            simVarIsActive: (toconfig === 1 || flightPhase === 3)
            && brakesHot === 1,
            whichCodeToReturn: [
                0,
                !aircraftOnGround ? 1 : null,
                [1, 10].includes(flightPhase) ? 2 : null,
                !aircraftOnGround ? 3 : null,
                [1, 2].includes(flightPhase) && !brakeFan ? 4 : null,
                aircraftOnGround ? 5 : null,
                !aircraftOnGround ? 6 : null,
                !aircraftOnGround ? 7 : null,
                !aircraftOnGround ? 8 : null,
            ],
            codesToReturn: ['320001001', '320001002', '320001003', '320001004', '320001005', '320001006', '320001007', '320001008', '320001009'],
            memoInhibit: false,
            failure: 2,
            sysPage: 9,
            side: 'LEFT',
        },
        3081186: { // SEVERE ICE DETECTED
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: iceSevereDetectedTimer.read(),
            whichCodeToReturn: [
                0,
                !wingAntiIce ? 1 : null,
                engSelectorPosition !== 2 ? 2 : null,
            ],
            codesToReturn: ['308128001', '308128002', '308128003'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        3081280: { // ICE DETECTED
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: iceDetectedTimer2.read(),
            whichCodeToReturn: [
                0,
                !eng1AntiIce ? 1 : null,
                !eng2AntiIce ? 2 : null,
            ],
            codesToReturn: ['308128001', '308128002', '308128003'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        2900310: // *HYD  - Blue
        {
            flightPhaseInhib: [4, 5],
            simVarIsActive: !!(!(blueRvrLow === 1 || !blueElecPumpPBAuto)
            && (!dcESSBusPowered || !ac1BusPowered)
            && blueLP === 1
            && ![1, 10].includes(flightPhase)
            && !emergencyGeneratorOn),
            whichCodeToReturn: [0],
            codesToReturn: ['290031001'],
            memoInhibit: false,
            failure: 2,
            sysPage: 4,
            side: 'RIGHT',
        },
        2900312: // *HYD  - Green Engine 1 //
        {
            flightPhaseInhib: [],
            simVarIsActive: ![1, 10, 2, 9].includes(flightPhase)
            // && ENG 1 OUT - not implemented
            && greenLP === 1
            && !greenHydEng1PBAuto
            && !emergencyGeneratorOn,
            whichCodeToReturn: [0],
            codesToReturn: ['290031201'],
            memoInhibit: false,
            failure: 2,
            sysPage: 4,
            side: 'RIGHT',
        },
        3100010: // FWC 1 FAULT
        {
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: !fwc1Normal && acESSBusPowered,
            whichCodeToReturn: [0],
            codesToReturn: ['310001001'],
            memoInhibit: false,
            failure: 2,
            sysPage: -1,
            side: 'LEFT',
        },
        3100011: // FWC 2 FAULT
        {
            flightPhaseInhib: [3, 4, 5, 7, 8],
            simVarIsActive: !fwc2Normal && ac2BusPowered,
            whichCodeToReturn: [0],
            codesToReturn: ['310001101'],
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
                noSmoking === 1 && seatBelt === 1 ? 3 : 2,
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
            simVarIsActive: !!ldgmemo && !tomemo,
            whichCodeToReturn: [
                landingGearLeverDown === 1 ? 1 : 0,
                noSmokingSwitchPosition !== 2 && seatBelt === 1 ? 3 : 2,
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
                adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 && engine1State < 4) || (engine2State > 0 && engine2State < 4)),
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
                adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 && engine1State < 4) || (engine2State > 0 && engine2State < 4)),
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
                simVarIsActive: !!(noSmoking === 1 && !configPortableDevices),
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
                simVarIsActive: !!(noSmoking === 1 && configPortableDevices),
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
                simVarIsActive: !!(!aircraftOnGround && strobeLightsOn === 2),
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
                flightPhaseInhib: [],
                simVarIsActive: !!toinhibit,
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
                simVarIsActive: !!ldginhibit,
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
                simVarIsActive: !!(!landASAPRed && !aircraftOnGround && (
                    engine1State === 0
                    || engine2State === 0
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
            flightPhaseInhib: [],
            simVarIsActive: speedBrakeCommand && ![1, 8, 9, 10].includes(flightPhase),
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
            simVarIsActive: !!(gpwsTerrOff === 1 && ![1, 10].includes(flightPhase)),
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
        '0000567': // VHF3 VOICE
        {
            flightPhaseInhib: [],
            simVarIsActive: voiceVHF3 !== 0 && [1, 2, 6, 9, 10].includes(flightPhase),
            whichCodeToReturn: [0],
            codesToReturn: ['000056701'],
            memoInhibit: false,
            failure: 0,
            sysPage: -1,
            side: 'RIGHT',
        },
    };

    /* TO CONFIG */

    useEffect(() => {
        if (tomemo === 1 && toconfigBtn === 1) {
            // TODO Note that fuel tank low pressure and gravity feed warnings are not included
            let systemStatus = false;
            if (engine1Generator && engine2Generator && !greenLP && !yellowLP && !blueLP && eng1pumpPBisAuto && eng2pumpPBisAuto) {
                systemStatus = true;
            }
            const speeds = !!(v1Speed <= vrSpeed && vrSpeed <= v2Speed);
            const doors = !!(cabin === 0 && catering === 0 && cargoaftLocked && cargofwdLocked);
            const flapsAgree = !flapsMcduEntered || flapsHandle === flapsMcdu;
            const sb = !speedBrakeCommand;

            if (systemStatus && speeds && !brakesHot && doors && flapsAgree && sb) {
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 1);
                setToConfigFailed(false);
            } else {
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 0);
                setToConfigFailed(true);
            }
        } else {
            setToConfigFailed(false);
        }
    }, [
        engine1Generator, engine2Generator, blueLP, greenLP, yellowLP, eng1pumpPBisAuto, eng2pumpPBisAuto,
        flapsMcdu, flapsMcduEntered, speedBrakeCommand, parkBrake, v1Speed, vrSpeed, v2Speed, cabin,
        catering, cargoaftLocked, cargofwdLocked, toconfigBtn, tomemo, flapsHandle, brakesHot,
    ]);

    useEffect(() => {
        if (callPushAft || callPushAll || callPushForward) {
            SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'bool', 1);
        }
    }, [callPushAft, callPushAll, callPushForward]);

    useEffect(() => {
        // Special case: None of the FWCs is able to generate alerts!
        if (!fwc1Normal && !fwc2Normal) {
            setMemoMessageLeft([
                '0',
                '310000701',
                '310000702',
                '310000703',
            ]);
            setMemoMessageRight([
                '310000704',
                '310000705',
                '310000706',
                '310000707',
                '310000708',
                '310000709',
            ]);
            setRecallFailures([]);
            return;
        }
        let tempMemoArrayLeft:string[] = [];
        let tempMemoArrayRight:string[] = [];
        const allFailureKeys: string[] = [];
        let tempFailureArrayLeft:string[] = [];
        let failureKeysLeft: string[] = failuresLeft;
        let recallFailureKeys: string[] = recallFailures;
        let tempFailureArrayRight:string[] = [];
        const failureKeysRight: string[] = failuresRight;
        let leftFailureSystemCount = 0;
        let rightFailureSystemCount = 0;
        // Update failuresLeft list in case failure has been resolved
        for (const [key, value] of Object.entries(EWDMessageFailures)) {
            if (!value.simVarIsActive) {
                failureKeysLeft = failureKeysLeft.filter((e) => e !== key);
                recallFailureKeys = recallFailures.filter((e) => e !== key);
            }
        }
        setRecallFailures(recallFailureKeys);
        // Failures first
        for (const [key, value] of Object.entries(EWDMessageFailures)) {
            if (value.simVarIsActive && (!value.flightPhaseInhib.some((e) => e === flightPhase) || flightPhaseInhibitOverride)) {
                if (value.side === 'LEFT') {
                    allFailureKeys.push(key);
                }

                if ((value.side === 'LEFT' && !failuresLeft.includes(key) && !recallFailureKeys.includes(key)) || (value.side === 'RIGHT' && !failuresRight.includes(key))) {
                    if (value.side === 'LEFT') {
                        failureKeysLeft.push(key);
                    } else {
                        failureKeysRight.push(key);
                    }

                    if (value.failure === 3) {
                        masterWarning(1);
                    }
                    if (value.failure === 2) {
                        masterCaution(1);
                    }
                } else if (![eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest].every((e) => e === 0)) {
                    masterWarning(1);
                }
                const newCode: string[] = [];
                if (!recallFailureKeys.includes(key)) {
                    const codeIndex = value.whichCodeToReturn.filter((e) => e !== null);
                    codeIndex.forEach((e: number) => {
                        newCode.push(value.codesToReturn[e]);
                    });
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
        for (const [, value] of Object.entries(EWDMessageFailures)) {
            if (value.side === 'LEFT') {
                mesgFailOrderLeft.push(...value.codesToReturn);
            } else {
                mesgFailOrderRight.push(...value.codesToReturn);
            }
        }
        const orderedFailureArrayLeft = mapOrder(tempFailureArrayLeft, mesgFailOrderLeft);
        const orderedFailureArrayRight = mapOrder(tempFailureArrayRight, mesgFailOrderRight);

        setAllCurrentFailures(allFailureKeys);
        setFailuresLeft(failureKeysLeft);
        setFailuresRight(failureKeysRight);

        if (tempFailureArrayLeft.length > 0) {
            setMemoMessageLeft(orderedFailureArrayLeft);
        }

        for (const [, value] of Object.entries(EWDMessageMemos)) {
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
        for (const [, value] of Object.entries(EWDMessageMemos)) {
            if (value.side === 'LEFT') {
                mesgOrderLeft.push(...value.codesToReturn);
            } else {
                mesgOrderRight.push(...value.codesToReturn);
            }
        }
        const orderedMemoArrayLeft = mapOrder(tempMemoArrayLeft, mesgOrderLeft);
        let orderedMemoArrayRight = mapOrder(tempMemoArrayRight, mesgOrderRight);

        if (!failLeft) {
            setMemoMessageLeft(orderedMemoArrayLeft);
            if (orderedFailureArrayRight.length === 0) {
                masterCaution(0);
                masterWarning(0);
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
                orderedMemoArrayRight = [...specLinesInMemo, ...orderedFailureArrayRight, ...filteredMemo];
            } else {
                orderedMemoArrayRight = [...orderedFailureArrayRight, ...orderedMemoArrayRight];
            }
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
        altn1LawConfirmNodeOutput,
        altn2LawConfirmNodeOutput,
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
        dc2BusPowered,
        dcESSBusPowered,
        dmcSwitchingKnob,
        directLawCondition,
        elac1FaultConfirmNodeOutput,
        elac1FaultLine123Display,
        elac2FaultConfirmNodeOutput,
        elac2FaultLine123Display,
        sec1FaultCondition,
        sec1FaultLine123Display,
        sec2FaultCondition,
        sec2FaultLine123Display,
        sec3FaultCondition,
        sec3FaultLine123Display,
        lrElevFaultCondition,
        fcdc12FaultCondition,
        fcdc1FaultCondition,
        fcdc2FaultCondition,
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
        engDualFault,
        engSelectorPosition,
        excessPressure,
        fac1Failed,
        fireButton1,
        fireButton2,
        fireButtonAPU,
        flapsInfA,
        flapsSupF,
        flapsHandle,
        flapsIndex,
        flightPhase,
        flightPhaseInhibitOverride,
        fobRounded,
        fuel,
        fuelXFeedPBOn,
        fwc1Normal,
        fwc2Normal,
        gpwsFlapMode,
        gpwsFlaps3,
        gpwsTerrOff,
        greenHydEng1PBAuto,
        height1Failed,
        height2Failed,
        hydPTU,
        iceDetectedTimer1,
        iceDetectedTimer2,
        iceNotDetTimer1,
        iceNotDetTimer2,
        iceSevereDetectedTimer,
        landASAPRed,
        landingLight2Retracted,
        landingLight3Retracted,
        ldginhibit,
        ldgmemo,
        leftOuterInnerValve,
        lgciu1Fault,
        lgciu2Fault,
        manLandingElevation,
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
        recallReset,
        rightOuterInnerValve,
        seatBelt,
        slatsInfD,
        slatsSupG,
        speedBrakeCommand,
        spoilersArmed,
        strobeLightsOn,
        tcasFault,
        tcasMode,
        tcasSensitivity,
        toconfig,
        toconfigFailed,
        toinhibit,
        throttle1Position,
        throttle2Position,
        thrustLeverNotSet,
        tomemo,
        unit,
        usrStartRefueling,
        wingAntiIce,
        voiceVHF3,
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

    useEffect(() => {
        SimVar.SetSimVarValue('L:A32NX_STATUS_LEFT_LINE_8', 'string', '000000001');
    }, []);

    return null;
};

export default PseudoFWC;
