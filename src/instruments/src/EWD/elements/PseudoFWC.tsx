import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { NXDataStore } from '@shared/persistence';
import { usePersistentProperty } from '@instruments/common/persistence';

const mapOrder = (array, order) => {
    array.sort((a, b) => {
        if (order.indexOf(a) > order.indexOf(b)) {
            return 1;
        }
        return -1;
    });
    return array;
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
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);
    const [gpwsFlapMode] = useSimVar('L:A32NX_GPWS_FLAP_OFF', 'bool', 1000);
    const [tomemo] = useSimVar('L:A32NX_FWC_TOMEMO', 'bool', 1000);
    const [ldgmemo] = useSimVar('L:A32NX_FWC_LDGMEMO', 'bool', 1000);

    const [autoBrake] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum', 1000);
    const [cabinReady] = useSimVar('L:A32NX_CABIN_READY', 'bool', 1000);
    const [flapsHandle] = useSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'enum', 1000);
    const [toconfig] = useSimVar('L:A32NX_TO_CONFIG_NORMAL', 'bool', 1000);

    // Check out updateTakeoffConfigWarnings(_test) {

    const EWDMessageBoolean = {
        '0000010': {
            flightPhaseInhib: [1, 3, 6, 10],
            simVarIsActive: () => fuel === 100 || usrStartRefueling === 1,
            numberOfCodesToReturn: 1,
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
        },
        '0000050': {
            flightPhaseInhib: [],
            simVarIsActive: () => fuel === 100 || usrStartRefueling,
            numberOfCodesToReturn: 1,
            whichCodeToReturn: [0],
            codesToReturn: ['000005001'],
            memoInhibit: tomemo || ldgmemo,
        },
        '0000055':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => spoilersArmed,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000005501'],
                memoInhibit: tomemo || ldgmemo,
            },
        '0000080':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => seatBelt,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000008001'],
                memoInhibit: tomemo || ldgmemo,
            },
        '0000090':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking && !configPortableDevices,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000009001'],
                memoInhibit: tomemo || ldgmemo,
            },
        '0000095':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking && configPortableDevices,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000009501'],
                memoInhibit: tomemo || ldgmemo,
            },
        '0000100':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => flightPhase >= 6 && flightPhase <= 8 && strobeLightsOn === 2,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000010001'],
                memoInhibit: tomemo || ldgmemo,
            },
        '0000105':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => leftOuterInnerValve || rightOuterInnerValve,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000010501'], // config memo
                memoInhibit: tomemo === 1 || ldgmemo === 1,
            },
        '0000110':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => fob < 3000,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [unit === '1' ? 0 : 1],
                codesToReturn: ['000011001', '0000011002'], // config memo
                memoInhibit: tomemo || ldgmemo,
            },
        '0000305':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => gpwsFlapMode,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: [0],
                codesToReturn: ['000030501'], // Not inhibited
                memoInhibit: tomemo || ldgmemo,
            },
    };

    useEffect(() => {
        let tempMemoArray = memoMessage;
        for (const [key, value] of Object.entries(EWDMessageBoolean)) {
            if (value.simVarIsActive()) {
                if (value.numberOfCodesToReturn === 1 && !value.memoInhibit) {
                    if (!value.flightPhaseInhib.some((e) => e === flightPhase)) {
                        const newCode = value.codesToReturn[value.whichCodeToReturn[0]];
                        // Check memoMessage does not already have current code
                        if (!tempMemoArray.some((e) => newCode.includes(e))) {
                            if (value.codesToReturn.length > 1) {
                                // setMemoMessage((memoMessage) => mapOrder(memoMessage.filter((e) => !value[0].codesToReturn.includes(e)).concat(newCode), mesgOrder));
                                const tempArray = tempMemoArray.filter((e) => !value.codesToReturn.includes(e));
                                tempMemoArray = tempArray;
                                tempMemoArray.push(newCode);
                                // console.log('Inside codesToReturn > 1');
                                // console.log(tempMemoArray);
                            } else {
                                // setMemoMessage((memoMessage) => mapOrder(memoMessage.concat(newCode), mesgOrder));
                                tempMemoArray.push(newCode);
                                // console.log('Insider else');
                                // console.log(tempMemoArray);
                            }
                        }
                    }
                } else {
                    // console.log('More than one');
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
        fob, unit, gpwsFlapMode, autoBrake,
    ]);

    useEffect(() => {
        // console.log('Inside memoMessage');
        // console.log(JSON.stringify(memoMessage));
        [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
            SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${value}`, 'number', -1);
        });
        if (memoMessage.length > 0) {
            memoMessage.forEach((value, index) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`, 'number', parseInt(value));
            });
        }
    }, [memoMessage]);

    return (<></>);
};

export default PseudoFWC;
