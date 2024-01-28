import React, { FC } from 'react';

export enum PowerSupplyType {
    Conventional,
    EHA,
}

export enum HydraulicPowerSource {
    Green,
    Yellow,
}

export enum ElecPowerSource {
    Ac2,
    Ac3,
    Ac4,
}

interface PowerSupplyIndicationProps {
    x: number,
    y: number,
    type: PowerSupplyType,
    powerSource: HydraulicPowerSource | ElecPowerSource
}

export const PowerSupplyIndication: FC<PowerSupplyIndicationProps> = ({ x, y, type, powerSource }) => {
    const powerSourceInfoAvail = true;
    const powerSourceFailed = false;

    return (
        <g transform={`translate(${x} ${y})`}>
            <path className="Grey Fill" d="m0,0 h 21 v 21 h-21 z" />

            {type === PowerSupplyType.Conventional && (
                <text
                    className={`F22 ${powerSourceFailed ? 'Amber' : 'Green'} ${powerSourceInfoAvail ? '' : 'Hide'}`}
                    x="5"
                    y="19"
                >
                    {powerSource === HydraulicPowerSource.Green ? 'G' : 'Y'}
                </text>
            )}
            {type === PowerSupplyType.EHA && (
                <path className={`SW4 LineRound LineJoinRound ${powerSourceFailed ? 'Amber' : 'Green'}`} d="m14,4 l -7,7 h 7 l-7,7" />
            )}
        </g>
    );
};
