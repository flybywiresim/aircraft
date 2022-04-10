import React from 'react';

interface HydEngValveProps {
    system: string,
    x: number,
    y: number,
    fireValve: number,
    hydLevelLow: boolean
}

const HydEngValve = ({ system, x, y, fireValve, hydLevelLow } : HydEngValveProps) => {
    if (system === 'BLUE') {
        return (
            <line className={!hydLevelLow ? 'GreenLine' : 'AmberLine'} x1={x} y1={y + 33} x2={x} y2={y} />
        );
    }

    return (
        <>
            <circle className={fireValve ? 'GreenLine' : 'AmberLine'} cx={x} cy={y + 16} r="16" />
            <line className={fireValve ? 'GreenLine' : 'Hide'} x1={x} y1={y + 32} x2={x} y2={y} />
            <line className={fireValve ? 'Hide' : 'AmberLine'} x1={x - 10} y1={y + 16} x2={x + 10} y2={y + 16} />
        </>
    );
};

export default HydEngValve;
