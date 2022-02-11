import React, { useEffect, useState } from 'react';
// import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { NXDataStore } from '@shared/persistence';

const EWDMessageBoolean = {
    '0000050': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['fuel', 'usrStartRefueling'],
            simVarToCheckLogic: 'OR',
            simVarValueIfActive: [100, 1],
            simVarValueIfActiveNotNormal: [null, null],
            codesToReturn: ['000005001'],
        }],
    '0000055': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['spoilersArmed'],
            simVarToCheckLogic: 'OR',
            simVarValueIfActive: [1],
            simVarValueIfActiveNotNormal: [null],
            codesToReturn: ['000005501'],
        }],
    '0000080': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['seatBelt'],
            simVarToCheckLogic: 'OR',
            simVarValueIfActive: [1],
            simVarValueIfActiveNotNormal: [null],
            codesToReturn: ['000008001'],
        }],
    '0000090': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['noSmoking', 'configPortableDevices'],
            simVarToCheckLogic: 'AND',
            simVarValueIfActive: [1, 0],
            simVarValueIfActiveNotNormal: [null, null],
            codesToReturn: ['000009001'],
        }],
    '0000095': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['noSmoking', 'configPortableDevices'],
            simVarToCheckLogic: 'AND',
            simVarValueIfActive: [1, 1],
            simVarValueIfActiveNotNormal: [null, null],
            codesToReturn: ['000009501'],
        }],
    '0000100': [
        {
            flightPhaseInhib: [],
            simVarToCheck: ['flightPhase', 'strobeLightsOn'],
            simVarToCheckLogic: 'AND',
            simVarValueIfActive: [[1, 6, 7, 8], 2],
            simVarValueIfActiveNotNormal: [null, null],
            codesToReturn: ['000010001'],
        }],
}; // Change to array of objects as we'll need flightphase inhibited etc.

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
    // const [fettle, setFettle] = useState(false);
    // const [timer, setTimer] = useState(10);
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

    useEffect(() => {
        for (const [key, value] of Object.entries(EWDMessageBoolean)) {
            const simVarConditionals: any[] = [];
            // eslint-disable-next-line no-eval
            console.log(`Key is ${key}`);
            value[0].simVarToCheck.forEach((item, index) => {
                const currentValue = value[0].simVarValueIfActive[index];
                if (Array.isArray(currentValue)) {
                    simVarConditionals.push(currentValue.some((e) => e === eval(item)));
                } else {
                    simVarConditionals.push(eval(item) === value[0].simVarValueIfActive[index]);
                }
            });
            const simVarActive = value[0].simVarToCheckLogic === 'AND' ? simVarConditionals.every((e) => e === true) : simVarConditionals.some((e) => e === true);
            console.log(`Simvaractive is ${simVarActive}`);
            if (simVarActive) {
                if (value[0].codesToReturn.length === 1) {
                    // console.log(`Value is flight inhib is ${value[0].flightPhaseInhib.some((e) => e === flightPhase)}`);
                    if (!value[0].flightPhaseInhib.some((e) => e === flightPhase)) {
                        console.log(`setting memo with codes to return ${value[0].codesToReturn[0]}`);
                        // console.log(`Memo is ${JSON.stringify(memoMessage)}`);
                        const newCode = [value[0].codesToReturn[0]];
                        // console.log(`New code is ${newCode}`);
                        // Check memoMessage does not already have current code
                        if (!memoMessage.some((e) => newCode.includes(e))) {
                            // sort messages out
                            const mesgOrder = Object.keys(EWDMessageBoolean);
                            setMemoMessage((memoMessage) => mapOrder(memoMessage.concat(newCode), mesgOrder));
                        }
                    }
                } else {
                    // console.log('More than one');
                }
            } else {
                // Remove value if present
                const codesToReturn = value[0].codesToReturn;
                console.log('Remove the following');
                console.log(codesToReturn);
                setMemoMessage((memoMessage) => memoMessage.filter((e) => !codesToReturn.includes(e)));
            }
        }
    }, [flightPhase, fuel, usrStartRefueling, engine1State, engine2State, spoilersArmed, seatBelt, noSmoking, configPortableDevices, strobeLightsOn]);

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

    // useUpdate((deltaTime) => {
    //     if (timer !== null) {
    //         if (timer > 0) {
    //             setTimer(timer - (deltaTime / 1000));
    //         } else {
    //             setFettle(!fettle);
    //             setTimer(10);
    //         }
    //     }
    // });

    return (<></>);
};

export default PseudoFWC;
