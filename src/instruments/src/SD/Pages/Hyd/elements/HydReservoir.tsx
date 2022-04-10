import React, { useEffect } from 'react';
import { levels } from '../utils';

interface HydReservoirProps {
    system: string,
    x: number,
    y: number,
    fluidLevel: number,
    setHydLevel: React.RefCallback<
    Boolean>
}

const HydReservoir = ({ system, x, y, fluidLevel, setHydLevel } : HydReservoirProps) => {
    const fluidLevelInLitres = fluidLevel * 3.79;

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = y - reserveHeight;
    const lowerNorm = y - 96 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 96 / values[0].max;
    const fluidHeight = y - (fluidLevelPerPixel * fluidLevelInLitres);

    useEffect(() => {
        if (fluidLevelInLitres < values[0].low) {
            setHydLevel(true);
        } else {
            setHydLevel(false);
        }
    }, [fluidLevelInLitres]);

    return (
        <>
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={y - 96} x2={x} y2={y - 128} />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'WhiteLine'} x1={x} y1={upperReserve.toFixed(0)} x2={x} y2={y - 96} />
            <line className="GreenLine" x1={x} y1={y - 96} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="GreenLine" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="GreenLine" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="AmberLine" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={y} x2={x - 8} y2={y} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x - 8} y1={y} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
        </>
    );
};

export default HydReservoir;
