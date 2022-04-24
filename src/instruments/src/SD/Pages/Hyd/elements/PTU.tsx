import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';
import { Triangle } from '../../../Common/Shapes';

import { ptuArray } from '../utils';

// Definition of low pressure in PSI
const LOW_PRESSURE = 1450;

interface PTUProps {
    x: number,
    y: number,
    greenPressure: number,
    yellowPressure: number,
    yellowElectricPumpStatus: boolean,
    validSDAC: boolean
}

interface PressureChartType {
    high: string,
    low: string,
    highValue: number,
    lowValue: number,
    lowReservoir: number,
    highReservoir: number,
    ptuScenario: string
}

const PTU = ({ x, y, greenPressure, yellowPressure, yellowElectricPumpStatus, validSDAC } : PTUProps) => {
    const [ptuActive, setPtuActive] = useState(false);
    // PTU variables
    const [ptuValveOpen] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 500);
    const [ptuFault] = useSimVar('L:A32NX_HYD_PTU_FAULT', 'boolean', 500);
    const [ptuScenario, setPtuScenario] = useState('normal');
    const [showPTUFlow, setShowPTUFlow] = useState(false);
    const [greenReservoirLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL', 'gallon', 1000);
    const [yellowReservoirLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL', 'gallon', 1000);

    const greenReservoirL = greenReservoirLevel * 3.79;
    const yellowReservoirL = yellowReservoirLevel * 3.79;

    const [pressureChart, setPressureChart] = useState<PressureChartType>({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal', lowReservoir: -1, highReservoir: -1 });

    const semiCircleD = `M${x - 16},${y} C${x - 16},${y + 24} ${x + 16},${y + 24} ${x + 16},${y}`;

    const result: any = ptuArray.find(({ scenario }) => scenario === ptuScenario);
    const ptu1 = result.format.find(({ id }) => id === 'ptu1');
    const ptu2 = result.format.find(({ id }) => id === 'ptu2');
    const ptu3 = result.format.find(({ id }) => id === 'ptu3');
    const ptu4 = result.format.find(({ id }) => id === 'ptu4');
    const ptu5 = result.format.find(({ id }) => id === 'ptu5');
    const triangle1 = result.format.find(({ id }) => id === 'triangle1');
    const triangle2 = result.format.find(({ id }) => id === 'triangle2');
    const triangle3 = result.format.find(({ id }) => id === 'triangle3');

    useEffect(() => {
        // Determine high/low pressure when PTU flow is inactive
        if (ptuActive && showPTUFlow) {
            if (yellowPressure > greenPressure) {
                setPressureChart({
                    high: 'YELLOW',
                    low: 'GREEN',
                    highValue: yellowPressure,
                    lowValue: greenPressure,
                    highReservoir: yellowReservoirL,
                    lowReservoir: greenReservoirL,
                    ptuScenario: 'right-to-left',
                });
            } else {
                setPressureChart({
                    high: 'GREEN',
                    low: 'YELLOW',
                    highValue: greenPressure,
                    lowValue: yellowPressure,
                    highReservoir: greenReservoirL,
                    lowReservoir: yellowReservoirL,
                    ptuScenario: 'left-to-right',
                });
            }
        } else {
            setPressureChart({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal', lowReservoir: -1, highReservoir: -1 });
        }
        console.log(`Reset pressure chart scenario is ${pressureChart.ptuScenario}`);
    }, [ptuActive]);

    useEffect(() => {
        console.log('Pressure chart updated so checking flow scenarios');
        setPtuScenario(pressureChart.ptuScenario);
        if (pressureChart.highValue - pressureChart.lowValue > 200) {
            console.log('Start showing');
            // Flow direction has occured
            setShowPTUFlow(true);
        }
        if (ptuActive && pressureChart.highValue - pressureChart.lowValue > -300) {
            console.log('Stop showing');
            // Flow direction has occured
            setShowPTUFlow(false);
            setPtuScenario('normal');
        }
    }, [pressureChart]);

    useEffect(() => {
        // Check if PTU flow should be displayed
        console.log(`Current scenario is ${ptuScenario}`);
        if (
            ptuValveOpen === 1
            && pressureChart.lowValue < LOW_PRESSURE
            && (pressureChart.ptuScenario === 'right-to-left' ? !yellowElectricPumpStatus : true)
            && (
                (pressureChart.highValue > 1450
                    && pressureChart.lowReservoir < 2.5
                    && validSDAC // TODO pressure of lower pressure system is valid
                )
                || (
                    pressureChart.lowValue > 1500
                    && pressureChart.lowReservoir > 2.5
                    && validSDAC // TODO pressure of larger pressure system is valid
                )
            )
        ) {
            console.log('PTU active');
            setPtuActive(true);
        } else {
            console.log('PTU inactive');
            setPtuActive(false);
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus]);

    return (
        <>
            <line id="ptu1" className={ptu1.className} x1={x - 82} y1={y} x2={x - 190} y2={y} />
            <line id="ptu2" className={ptu2.className} x1={x - 82} y1={y} x2={x - 16} y2={y} />
            <path id="ptu3" className={ptu3.className} d={semiCircleD} />
            <line id="ptu4" className={ptu4.className} x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line id="ptu5" className={ptu5.className} x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className={`RatPtuElec ${validSDAC ? 'FillWhite' : 'FillAmber'}`} x={x + 92} y={y} alignmentBaseline="central">{validSDAC ? 'PTU' : 'XX'}</text>
            <Triangle x={triangle1.orientation < 0 ? x - 100 : x - 82} y={y} colour={triangle1.colour} fill={triangle1.fill} orientation={triangle1.orientation} />
            <Triangle x={triangle2.orientation > 0 ? x + 70 : x + 50} y={y} colour={triangle2.colour} fill={triangle2.fill} orientation={triangle2.orientation} />
            <Triangle x={triangle3.orientation > 0 ? x + 135 : x + 117} y={y} colour={triangle3.colour} fill={triangle3.fill} orientation={triangle3.orientation} />
        </>
    );
};

export default PTU;
