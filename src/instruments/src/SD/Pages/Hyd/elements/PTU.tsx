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
    ptuScenario: string
}

const PTU = ({ x, y, greenPressure, yellowPressure, yellowElectricPumpStatus, validSDAC } : PTUProps) => {
    const [ptuActive, setPtuActive] = useState(false);
    // PTU variables
    const [ptuAvailable] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 500);
    const [ptuFault] = useSimVar('L:A32NX_HYD_PTU_FAULT', 'boolean', 500);
    const [ptuScenario, setPtuScenario] = useState('normal');

    const [pressureChart, setPressureChart] = useState<PressureChartType>({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal' });

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

    const setPressures = (clearState = false) => {
        if (clearState) {
            setPressureChart({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal' });
        } else if (yellowPressure > greenPressure) {
            setPressureChart({
                high: 'YELLOW',
                low: 'GREEN',
                highValue: yellowPressure,
                lowValue: greenPressure,
                ptuScenario: 'right-to-left',
            });
        } else {
            setPressureChart({
                high: 'GREEN',
                low: 'YELLOW',
                highValue: greenPressure,
                lowValue: yellowPressure,
                ptuScenario: 'left-to-right',
            });
        }
    };

    useEffect(() => {
        setPtuScenario(pressureChart.ptuScenario);
    }, [pressureChart]);

    // PTU logic
    useEffect(() => {
        console.log(`PTU avail is ${ptuAvailable}`);
        if (ptuAvailable === 1) {
            console.log('PTU avail');
            setPtuActive(true);
        }

        if (ptuActive && (yellowPressure > LOW_PRESSURE || greenPressure > LOW_PRESSURE)) {
            const pressureDifferential = Math.abs(greenPressure - yellowPressure);
            const maxPressure = Math.max(yellowPressure, greenPressure);
            let negativePressureDifferential = 0;

            if (pressureChart.lowValue < 0) {
                negativePressureDifferential = greenPressure > yellowPressure ? yellowPressure - greenPressure : greenPressure - yellowPressure;
            } else {
                negativePressureDifferential = pressureChart.lowValue - pressureChart.highValue;
            }
            console.log(`Negative diff is ${negativePressureDifferential}`);
            if (greenPressure > yellowPressure && yellowElectricPumpStatus) {
                // Check if yellow electric pump is on for pressure transfer from green to yellow only
                setPtuScenario('PTU-off');
                console.log('Green > Yellow and pump');
            } else if (pressureDifferential > 200 && maxPressure > 1450 && ptuAvailable === 1) {
                setPressures();
                setPtuActive(true);
                console.log('Show flow');
            } else if (negativePressureDifferential <= -300 && ptuActive) {
                setPressures(true);
                setPtuActive(false);
                console.log('PTU active and negative dif < -300');
            } else if (ptuFault === 1 && !ptuAvailable) {
                setPtuScenario('PTU-off');
                console.log('Fault');
            } else {
                setPtuScenario('normal');
                console.log('Situation normal');
            }
        } else if (ptuFault === 1 && !ptuAvailable) {
            setPtuScenario('PTU-off');
            console.log('Fault');
        } else {
            setPtuScenario('normal');
            console.log('Situation normal');
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus, ptuAvailable, ptuFault]);

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
