import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';
import { Triangle } from '../../../Common/Shapes';

import { ptuArray } from '../common';

interface PTUProps {
    x: number,
    y: number,
}

const PTU = ({ x, y } : PTUProps) => {
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

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

    const [ptuActive, setPtuActive] = useState(0);
    // PTU variables
    const [ptuAvailable] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 500);
    const [ptuScenario, setPtuScenario] = useState('normal');

    const [, setElecRightFormat] = useState('hide');
    const [, setElecTriangleFill] = useState(0);
    const [, setElecTriangleColour] = useState('white');

    const [pressureChart, setPressureChart] = useState<PressureChartType>({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal' });

    type PressureChartType = {
        high: string,
        low: string,
        highValue: number,
        lowValue: number,
        ptuScenario: string
    }

    function setPressures(clearState = false) {
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
    }

    useEffect(() => {
        setPtuScenario(pressureChart.ptuScenario);
    }, [pressureChart]);

    // PTU logic
    useEffect(() => {
        if (yellowElectricPumpStatus) {
            setElecTriangleFill(1);
            setElecTriangleColour(yellowPressure <= 1450 ? 'Amber' : 'Green');
            setElecRightFormat(yellowPressure <= 1450 ? 'AmberLine' : 'GreenLine');
        } else {
            setElecTriangleFill(0);
            setElecTriangleColour('White');
            setElecRightFormat('Hide');
        }

        if (ptuAvailable && !yellowElectricPumpStatus) {
            // The PTU valve has to be open and the yellow electric pump should not be on
            const pressureDifferential = Math.abs(greenPressure - yellowPressure);
            const maxPressure = Math.max(yellowPressure, greenPressure);
            // const minPressure = Math.min(yellowPressure, greenPressure);
            const negativePressureDifferential = pressureChart.low === 'GREEN' ? pressureChart.lowValue - yellowPressure : pressureChart.lowValue - greenPressure;
            if (maxPressure < 1450 || (greenPressure > 2990 && yellowPressure > 2990)) {
                setPressures(true);
                setPtuActive(0);
            } else if (pressureDifferential > 200 && maxPressure > 1450 && !ptuActive) {
                setPtuActive(1);
                setPressures();
            } else if (negativePressureDifferential <= -500 && ptuActive) {
                setPressures(true);
                setPtuActive(0);
            }
        } else if (ptuAvailable && yellowElectricPumpStatus && greenPressure <= 2990) {
            setPtuScenario('right-to-left');
            setPtuActive(1);
        } else {
            setPtuScenario(ptuAvailable ? 'normal' : 'PTU-off');
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus, ptuAvailable]);

    return (
        <>
            <line id="ptu1" className={ptu1.className} x1={x - 82} y1={y} x2={x - 190} y2={y} />
            <line id="ptu2" className={ptu2.className} x1={x - 82} y1={y} x2={x - 16} y2={y} />
            <path id="ptu3" className={ptu3.className} d={semiCircleD} />
            <line id="ptu4" className={ptu4.className} x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line id="ptu5" className={ptu5.className} x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className="RatPtuElec FillWhite" x={x + 92} y={y} alignmentBaseline="central">PTU</text>
            <Triangle x={triangle1.orientation < 0 ? x - 100 : x - 82} y={y} colour={triangle1.colour} fill={triangle1.fill} orientation={triangle1.orientation} />
            <Triangle x={triangle2.orientation > 0 ? x + 70 : x + 50} y={y} colour={triangle2.colour} fill={triangle2.fill} orientation={triangle2.orientation} />
            <Triangle x={triangle3.orientation > 0 ? x + 135 : x + 117} y={y} colour={triangle3.colour} fill={triangle3.fill} orientation={triangle3.orientation} />
        </>
    );
};

export default PTU;
