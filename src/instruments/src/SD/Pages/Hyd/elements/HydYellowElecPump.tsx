import React, { useEffect, useState } from 'react';
import { Triangle } from '../../../Common/Shapes';

interface HydYellowElecPumpProps {
    x: number,
    y: number,
    yellowPressure: number,
    yellowElectricPumpStatus: boolean,
    ACBus2IsPowered: boolean
}

const HydYellowElecPump = ({ x, y, yellowPressure, yellowElectricPumpStatus, ACBus2IsPowered }: HydYellowElecPumpProps) => {
    const [elecRightFormat, setElecRightFormat] = useState('hide');
    const [elecTriangleFill, setElecTriangleFill] = useState(0);
    const [elecTriangleColour, setElecTriangleColour] = useState('white');

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
    }, [yellowPressure, yellowElectricPumpStatus]);

    return (
        <g id="elec-pump">
            <text
                id="ELEC-right"
                className={!ACBus2IsPowered ? 'RatPtuElec FillAmber' : 'RatPtuElec FillWhite'}
                x={x + 48}
                y={y}
                alignmentBaseline="central"
            >
                ELEC

            </text>
            <Triangle x={x} y={y} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
            <line className={elecRightFormat} x1={x - 10} y1={y} x2={x} y2={y} />
        </g>
    );
};

export default HydYellowElecPump;
