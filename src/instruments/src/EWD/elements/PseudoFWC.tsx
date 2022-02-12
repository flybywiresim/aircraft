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
    const [gpwsFlapMode] = useSimVar('L:A32NX_GPWD_FLAPS_OFF', 'bool', 1000);
    const [tomemo] = useSimVar('L:A32NX_FWC_TOMEMO', 'bool', 1000);
    const [ldgmemo] = useSimVar('L:A32NX_FWC_LDGMEMO', 'bool', 1000);

    const EWDMessageBoolean = {
        '0000050': {
            flightPhaseInhib: [],
            simVarIsActive: () => fuel === 100 || usrStartRefueling === 1,
            numberOfCodesToReturn: 1,
            whichCodeToReturn: 0,
            codesToReturn: ['000005001'],
            memoInhibit: ['config'],
        },
        '0000055':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => spoilersArmed === 1,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000005501'],
                memoInhibit: 0,
            },
        '0000080':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => seatBelt === 1,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000008001'],
            },
        '0000090':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking === 1 && configPortableDevices === 0,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000009001'],
            },
        '0000095':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => noSmoking === 1 && configPortableDevices === 1,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000009501'],
            },
        '0000100':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => flightPhase >= 6 && flightPhase <= 8 && strobeLightsOn === 2,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000010001'],
            },
        '0000105':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => leftOuterInnerValve === 1 || rightOuterInnerValve === 1,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000010501'], // config memo
            },
        '0000110':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => fob < 3000,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: unit === '1' ? 0 : 1,
                codesToReturn: ['000011001', '0000011002'], // config memo
            },
        '0000305':
            {
                flightPhaseInhib: [],
                simVarIsActive: () => gpwsFlapMode === 1,
                numberOfCodesToReturn: 1,
                whichCodeToReturn: 0,
                codesToReturn: ['000030501'], // Not inhibited
            },
    };

    useEffect(() => {
        let tempMemoArray = memoMessage;
        for (const [key, value] of Object.entries(EWDMessageBoolean)) {
            if (value.simVarIsActive()) {
                if (value.numberOfCodesToReturn === 1) {
                    if (!value.flightPhaseInhib.some((e) => e === flightPhase)) {
                        const newCode = value.codesToReturn[value.whichCodeToReturn];
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
        console.log(orderedMemoArray);
        setMemoMessage(orderedMemoArray);
    }, [flightPhase,
        fuel, usrStartRefueling, engine1State, engine2State, spoilersArmed, seatBelt, noSmoking, configPortableDevices, strobeLightsOn, leftOuterInnerValve, rightOuterInnerValve,
        fob, unit, gpwsFlapMode,
    ]);

    useEffect(() => {
        console.log('Inside memoMessage');
        console.log(JSON.stringify(memoMessage));
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
