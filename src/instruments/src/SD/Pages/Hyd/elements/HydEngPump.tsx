import React from 'react';

interface HydEngPumpProps {
    system: string,
    pumpOn: number,
    x: number,
    y: number,
    hydLevelLow: boolean,
    fireValve: number,
    pumpDetectLowPressure: number
    pressure: number
}

const HydEngPump = ({ system, pumpOn, x, y, hydLevelLow, fireValve, pumpDetectLowPressure, pressure } : HydEngPumpProps) => {
    const lowPressure = 1450;
    if (system === 'BLUE') {
        return (
            <>
                <line className={pressure <= lowPressure ? 'AmberLine' : 'GreenLine'} x1={x} y1={y - 32} x2={x} y2={y - 80} />
                <rect className={pumpDetectLowPressure ? 'AmberLine' : 'GreenLine'} x={x - 16} y={y - 32} width={32} height={32} />
                <line className={!pumpDetectLowPressure ? 'GreenLine' : 'Hide'} x1={x} y1={y} x2={x} y2={y - 32} />
                <line className={pumpOn ? 'Hide' : 'AmberLine'} x1={x - 12} y1={y - 16} x2={x + 12} y2={y - 16} />
                <text id="ELEC-centre" className={pumpDetectLowPressure && pumpOn ? 'RatPtuElec FillAmber' : 'Hide'} x={x} y={y - 16} alignmentBaseline="central">LO</text>

            </>
        );
    }

    return (
        <>
            <rect className={pumpDetectLowPressure ? 'AmberLine' : 'GreenLine'} x={x - 16} y={y - 80} width={32} height={32} />
            <line className={!pumpDetectLowPressure ? 'GreenLine' : 'Hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'Hide' : 'AmberLine'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className={hydLevelLow || !fireValve ? 'AmberLine' : 'GreenLine'} x1={x} y1={y} x2={x} y2={y - 48} />
            <text
                id="ELEC-centre"
                className={
                    pumpDetectLowPressure && pumpOn ? 'RatPtuElec FillAmber' : 'Hide'
                }
                x={x}
                y={y - 64}
                alignmentBaseline="central"
            >
                LO

            </text>

        </>
    );
};

export default HydEngPump;
