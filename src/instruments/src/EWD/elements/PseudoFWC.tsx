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
    const [memoMessage, setMemoMessage] = useState<string[]>([]);
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);
    const [fuel] = useSimVar('A:INTERACTIVE POINT OPEN:9', 'percent', 500);
    const [usrStartRefueling] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'bool', 500);
    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500);
    const [spoilersArmed] = useSimVar('L:A32NX_SPOILERS_ARMED', 'bool', 500);
    const [seatBelt] = useSimVar('A:CABIN SEATBELTS ALERT SWITCH', 'bool', 500);
    const [noSmoking] = useSimVar('L:A32NX_NO_SMOKING_MEMO', 'bool', 500);
    const configPortableDevices = parseInt(NXDataStore.get('CONFIG_USING_PORTABLE_DEVICES', '0'));
    const [strobeLightsOn] = useSimVar('L:LIGHTING_STROBE_0', 'bool', 500);
    const [leftOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'bool', 500);
    const [rightOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'bool', 500);
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 500);
    const fobRounded = Math.round(fob / 10) * 10;
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

    const [engine1Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL', 'bool', 500);
    const [engine2Generator] = useSimVar('L:A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL', 'bool', 500);
    const [greenLP] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'bool', 500);
    const [blueLP] = useSimVar('L:A32NX_HYD_BLUE_EDPUMP_LOW_PRESS', 'bool', 500);
    const [yellowLP] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'bool', 500);
    const [eng1pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool', 500);
    const [eng2pumpPBisAuto] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'bool', 500);

    const [toconfigBtn] = useSimVar('L:A32NX_BTN_TOCONFIG', 'bool', 500);
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

    const [eng1FireTest] = useSimVar('L:A32NX_FIRE_TEST_ENG1', 'bool', 500);
    const [eng2FireTest] = useSimVar('L:A32NX_FIRE_TEST_ENG2', 'bool', 500);
    const [apuFireTest] = useSimVar('L:A32NX_FIRE_TEST_APU', 'bool', 500);
    const onGround = Simplane.getIsGrounded();
    const [throttle1Position] = useSimVar('L:XMLVAR_Throttle1Position', 'number', 100);
    const [throttle2Position] = useSimVar('L:XMLVAR_Throttle2Position', 'number', 100);
    const [engine1ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:1', 'bool', 500);
    const [engine2ValueSwitch] = useSimVar('FUELSYSTEM VALVE SWITCH:2', 'bool', 500);
    const [parkingBrake] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'bool', 500);

    const [fireButton1] = useSimVar('L:A32NX_FIRE_BUTTON_ENG1', 'bool', 500);
    const [fireButton2] = useSimVar('L:A32NX_FIRE_BUTTON_ENG2', 'bool', 500);
    const [fireButtonAPU] = useSimVar('L:A32NX_FIRE_BUTTON_APU', 'bool', 500);

    const [eng1Agent1PB] = useSimVar('L:A32NX_FIRE_ENG1_AGENT1_Discharge', 'bool', 500);
    const [eng1Agent2PB] = useSimVar('L:A32NX_FIRE_ENG1_AGENT2_Discharge', 'bool', 500);
    const [eng2Agent1PB] = useSimVar('L:A32NX_FIRE_ENG2_AGENT1_Discharge', 'bool', 500);
    const [eng2Agent2PB] = useSimVar('L:A32NX_FIRE_ENG2_AGENT2_Discharge', 'bool', 500);
    const [apuAgentPB] = useSimVar('L:A32NX_FIRE_APU_AGENT1_Discharge', 'bool', 500);
    const [apuMasterSwitch] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
    const [timerEng1FirePBOut, setTimerEng1FirePBOut] = useState<number | null>(null);
    const [agent1Discharge, setAgent1Discharge] = useState(false);
    const [timerEng2FirePBOut, setTimerEng2FirePBOut] = useState<number | null>(null);
    const [agent2Discharge, setAgent2Discharge] = useState(false);

    // Check out updateTakeoffConfigWarnings(_test) {

    const EWDMessageBoolean = {
        '0000010': {
            flightPhaseInhib: [1, 3, 6, 10],
            simVarIsActive: () => tomemo,
            whichCodeToReturn: [
                autoBrake === 3 ? 1 : 0,
                noSmoking && configPortableDevices ? 3 : 2,
                cabinReady ? 5 : 4,
                spoilersArmed ? 7 : 6,
                flapsHandle >= 1 && flapsHandle <= 3 ? 9 : 8,
                toconfig ? 11 : 10,
            ],
            codesToReturn: ['000001001', '000001002', '000001003', '000001004', '000001005', '000001006', '000001007', '000001008', '000001009', '000001010', '000001011', '000001012'],
            memoInhibit: ldgmemo === 1,
            failure: 0,
            sysPage: '',
            side: 'LEFT',
        },
        '0000050': {
            flightPhaseInhib: [],
            simVarIsActive: () => fuel === 100 || usrStartRefueling,
            whichCodeToReturn: [0],
            codesToReturn: ['000005001'],
            memoInhibit: tomemo === 1 || ldgmemo === 1,
            failure: 0,
            sysPage: '',
            side: 'LEFT',
        },
        '0000030': {
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: () => adirsRemainingAlignTime >= 240 && [adiru1State, adiru2State, adiru3State].every((a) => a === 1),
            whichCodeToReturn: [
                adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
            ],
            codesToReturn: ['000003001', '000003002', '000003003', '000003004', '000003005', '000003006', '000003007', '000003008'],
            memoInhibit: tomemo === 1 || ldgmemo === 1,
            failure: 0,
            sysPage: '',
            side: 'LEFT',
        },
        '0000031': {
            flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
            simVarIsActive: () => adirsRemainingAlignTime > 0 && adirsRemainingAlignTime < 240 && [adiru1State, adiru2State, adiru3State].every((a) => a === 1),
            whichCodeToReturn: [
                adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
            ],
            codesToReturn: ['000003101', '000003102', '000003103', '000003104', '000003105', '000003106', '000003107', '000003108'],
            memoInhibit: tomemo === 1 || ldgmemo === 1,
            failure: 0,
            sysPage: '',
            side: 'LEFT',
        },
        '0000055':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => spoilersArmed,
                whichCodeToReturn: [0],
                codesToReturn: ['000005501'],
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000080':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => seatBelt,
                whichCodeToReturn: [0],
                codesToReturn: ['000008001'],
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000090':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking && !configPortableDevices,
                whichCodeToReturn: [0],
                codesToReturn: ['000009001'],
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000095':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking && configPortableDevices,
                whichCodeToReturn: [0],
                codesToReturn: ['000009501'],
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000100':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => flightPhase >= 6 && flightPhase <= 8 && strobeLightsOn === 2,
                whichCodeToReturn: [0],
                codesToReturn: ['000010001'],
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000105':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => leftOuterInnerValve || rightOuterInnerValve,
                whichCodeToReturn: [0],
                codesToReturn: ['000010501'], // config memo
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000110':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => fobRounded < 3000,
                whichCodeToReturn: [unit === '1' ? 0 : 1],
                codesToReturn: ['000011001', '0000011002'], // config memo
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '0000305':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => gpwsFlapMode,
                whichCodeToReturn: [0],
                codesToReturn: ['000030501'], // Not inhibited
                memoInhibit: tomemo === 1 || ldgmemo === 1,
                failure: 0,
                sysPage: '',
                side: 'LEFT',
            },
        '2600010': {
            flightPhaseInhib: [],
            simVarIsActive: () => eng1FireTest === 1 || fireButton1 === 1,
            whichCodeToReturn: [
                0,
                throttle1Position !== 1 && !onGround ? 1 : null,
                (throttle1Position !== 1 || throttle2Position !== 1) && onGround ? 2 : null,
                3,
                !parkBrake && onGround ? 4 : null,
                onGround ? 5 : null,
                onGround ? 6 : null,
                7,
                !fireButton1 ? 8 : null,
                !onGround && fireButton1 && !eng1Agent1PB ? 9 : null,
                eng1Agent1PB === 1 && !onGround && !eng1Agent1PB ? 10 : null,
                !agent2Discharge && onGround ? 11 : null,
                onGround ? 12 : null,
                !onGround ? 13 : null,
                !onGround && eng1Agent1PB === 1 && !eng1Agent2PB ? 14 : null,
                (!onGround && eng1Agent1PB === 1 && !eng1Agent2PB) || (!eng1Agent2PB && eng1Agent1PB) ? 15 : null,
            ],
            codesToReturn: ['260001001', '260001002', '260001003', '260001004', '260001005',
                '260001006', '260001007', '260001008', '260001009', '260001010', '260001011',
                '260001012', '260001013', '260001014', '260001015', '260001016'],
            memoInhibit: false,
            failure: 3,
            sysPage: 'ENG',
            side: 'LEFT',
        },
        '2600020': {
            flightPhaseInhib: [],
            simVarIsActive: () => eng2FireTest === 1 || fireButton2 === 1,
            whichCodeToReturn: [
                0,
                throttle2Position !== 1 && !onGround ? 1 : null,
                (throttle1Position !== 1 || throttle2Position !== 1) && onGround ? 2 : null,
                3,
                !parkBrake && onGround ? 4 : null,
                onGround ? 5 : null,
                onGround ? 6 : null,
                7,
                !fireButton2 ? 8 : null,
                !onGround && fireButton2 && !eng2Agent1PB ? 9 : null,
                eng2Agent1PB === 1 && !onGround && !eng2Agent1PB ? 10 : null,
                !agent2Discharge && onGround ? 11 : null,
                onGround ? 12 : null,
                !onGround ? 13 : null,
                !onGround && eng2Agent1PB === 1 && !eng2Agent2PB ? 14 : null,
                (!onGround && eng2Agent1PB === 1 && !eng2Agent2PB) || (!eng2Agent2PB && eng2Agent1PB) ? 15 : null,
            ],
            codesToReturn: ['260002001', '260002002', '260002003', '260002004', '260002005',
                '260002006', '260002007', '260002008', '260002009', '260002010', '260002011',
                '260002012', '260002013', '260002014', '260002015', '260002016'],
            memoInhibit: false,
            failure: 3,
            sysPage: 'ENG',
            side: 'LEFT',
        },
        '2600030': {
            flightPhaseInhib: [],
            simVarIsActive: () => apuFireTest === 1 || fireButtonAPU === 1,
            whichCodeToReturn: [
                0,
                !fireButtonAPU ? 1 : null,
                fireButtonAPU === 1 && !apuAgentPB ? 2 : null,
                // Countdown timer TODO
                fireButtonAPU === 1 && !apuAgentPB ? 3 : null,
                apuMasterSwitch === 1 ? 4 : null,
            ],
            codesToReturn: ['260003001', '260003002', '260003003', '260003004', '260003005'],
            memoInhibit: false,
            failure: 3,
            sysPage: 'APU',
            side: 'LEFT',
        },
    };

    useUpdate((deltaTime) => {
        if (timerEng1FirePBOut !== null) {
            if (setTimerEng1FirePBOut > 0) {
                if (deltaTime < 1000) {
                    setTimerEng1FirePBOut(setTimerEng1FirePBOut - (deltaTime / 1000));
                }
            } else {
                setTimerEng1FirePBOut(null);
                setAgent1Discharge(true);
            }
        }
        if (timerEng2FirePBOut !== null) {
            if (setTimerEng2FirePBOut > 0) {
                if (deltaTime < 1000) {
                    setTimerEng2FirePBOut(setTimerEng2FirePBOut - (deltaTime / 1000));
                }
            } else {
                setTimerEng2FirePBOut(null);
                setAgent2Discharge(true);
            }
        }
    });

    useEffect(() => {
        console.log('TO Config check');
        if (tomemo) {
        //  Note that fuel tank low pressure and gravity feed warnings are not included
            let systemStatus = false;
            if (engine1Generator && engine2Generator && !greenLP && !yellowLP && !blueLP && eng1pumpPBisAuto && eng2pumpPBisAuto) {
                systemStatus = true;
            }
            // console.log(`EnginGen ${engine1Generator}  ${engine2Generator} LP pumps ${!greenLP} && ${!yellowLP} && ${!blueLP} PBauto ${eng1pumpPBisAuto}  ${eng2pumpPBisAuto}`);
            const speeds = !!(v1Speed <= vrSpeed && vrSpeed <= v2Speed);
            const doors = !!(cabin === 0 && catering === 0 && cargoaftLocked && cargofwdLocked);
            const flapsAgree = !!(flapsMcduEntered && flapsHandle === flapsMcdu);
            const sb = speedBrake === 0;

            if (systemStatus && speeds && !brakesHot && doors && flapsAgree && sb) {
                // console.log('Config normal');
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 1);
            } else {
                console.log('Config not normal');
                console.log(`System status ${systemStatus} and speeds ${speeds} and brakes ${brakesHot}, and doors ${doors} and flaps ${flapsAgree} and speed brakes ${sb}`);
                SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', 0);
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
        console.log('FireText');
        if (eng1FireTest === 0 && eng2FireTest === 0 && apuFireTest === 0) {
            SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'bool', 0);
            SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'bool', 0);
        }
    }, [eng1FireTest, eng2FireTest, apuFireTest]);

    useEffect(() => {
        let tempMemoArray = memoMessage;
        const warningsCount = { 3: 0, 2: 0 };
        for (const [key, value] of Object.entries(EWDMessageBoolean)) {
            if (value.simVarIsActive()) {
                if (!value.memoInhibit) {
                    if (value.failure || !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                        if (value.failure === 3) {
                            SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', 1);
                            SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'Bool', 1);
                        }
                        if (value.failure === 2) {
                            SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'Bool', 1);
                            SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'Bool', 1);
                        }
                        console.log('Which Codes');
                        console.log(value.whichCodeToReturn);
                        const newCode: string[] = [];
                        const codeIndex = value.whichCodeToReturn.filter((e) => e !== null);
                        codeIndex.forEach((e: number) => {
                            newCode.push(value.codesToReturn[e]);
                        });

                        // Remove nulls from fire test
                        console.log('new code');
                        console.log(newCode);
                        // // Check memoMessage does not already have current code
                        // console.log('new code after');
                        // console.log(newCode1);
                        const tempArray = tempMemoArray.filter((e) => !value.codesToReturn.includes(e));
                        // console.log('Before concat');
                        // console.log(tempArray);
                        tempMemoArray = tempArray.concat(newCode);
                        console.log('After concat');
                        console.log(tempMemoArray);

                        if (value.sysPage !== '') {
                            const eicas = document.getElementsByTagName('a320-neo-eicas-element');
                            console.log(eicas);
                        }
                    }
                }
            } else {
                // Remove value if present
                // console.log('Inside delete bit');
                const codesToReturn = value.codesToReturn;
                // setMemoMessage((memoMessage) => memoMessage.filter((e) => !codesToReturn.includes(e)));
                // console.log(tempMemoArray);
                const tempArray = tempMemoArray.filter((e) => !codesToReturn.includes(e));
                tempMemoArray = tempArray;
            }
        }
        const mesgOrder: string[] = [];
        for (const [key, value] of Object.entries(EWDMessageBoolean)) {
            mesgOrder.push(...value.codesToReturn);
        }
        // console.log('Actual message order');
        // console.log(mesgOrder);
        // console.log('Message order');
        // console.log(tempMemoArray);
        const orderedMemoArray = mapOrder(tempMemoArray, mesgOrder);
        // console.log(orderedMemoArray);
        setMemoMessage(orderedMemoArray);
    }, [flightPhase,
        fuel, usrStartRefueling, engine1State, engine2State, spoilersArmed, seatBelt, noSmoking, configPortableDevices, strobeLightsOn, leftOuterInnerValve, rightOuterInnerValve,
        fobRounded, unit, gpwsFlapMode, autoBrake, flapsHandle, throttle1Position, throttle2Position,
        adiru1State, adiru2State, adiru3State, apuFireTest, apuAgentPB,
        cabinReady, toconfig, eng1Agent1PB, eng1Agent2PB, eng1FireTest, eng2FireTest,
        eng2Agent1PB, eng2Agent2PB, eng2FireTest, apuAgentPB, apuMasterSwitch,
        adirsMessage1(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
        adirsMessage2(adirsRemainingAlignTime, (engine1State > 0 || engine2State > 0)),
    ]);

    useEffect(() => {
        console.log('Inside memoMessage');
        console.log(JSON.stringify(memoMessage));
        [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
            SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${value}`, 'string', '');
        });
        if (memoMessage.length > 0) {
            memoMessage.forEach((value, index) => {
                // console.log(`Value for L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`);
                // console.log(parseInt(value));
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`, 'string', value);
            });
        }
    }, [memoMessage]);

    const [sim] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_1', 'number', 100);

    useEffect(() => {
        console.log('Freshly minted SimVar in PseudoFWC');
        console.log(sim);
    }, [sim]);

    return (<></>);
};

export default PseudoFWC;
