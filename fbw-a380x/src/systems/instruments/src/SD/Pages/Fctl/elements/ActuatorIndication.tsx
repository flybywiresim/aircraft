import React, { FC } from 'react';

export enum ActuatorType {
    Conventional,
    EHA,
}

export enum HydraulicPowerSource {
    Green,
    Yellow,
}

export enum ElecPowerSource {
    AcEss,
    AcEha,
    Ac1,
}

interface ActuatorIndicationProps {
    x: number,
    y: number,
    type: ActuatorType,
    powerSource: HydraulicPowerSource | ElecPowerSource
}

export const ActuatorIndication: FC<ActuatorIndicationProps> = ({ x, y, type, powerSource }) => {
    const powerSourceInfoAvail = true;
    const powerSourceFailed = false;
    const actuatorFailed = false;

    return (
        <g transform={`translate(${x} ${y})`}>
            <path className="Grey Fill" d="m0,0 h 25 v 25 h-25 z" />
            <path className={`Amber SW3 ${actuatorFailed ? '' : 'Hide'}`} d="m0,0 h 25 v 25 h-25 z" />

            {type === ActuatorType.Conventional && (
                <text
                    className={`F26 ${powerSourceFailed ? 'Amber' : 'Green'} ${powerSourceInfoAvail ? '' : 'Hide'}`}
                    x="6"
                    y="23"
                >
                    {powerSource === HydraulicPowerSource.Green ? 'G' : 'Y'}
                </text>
            )}
            {type === ActuatorType.EHA && (
                <path className={`SW4 LineRound LineJoinRound ${powerSourceFailed ? 'Amber' : 'Green'}`} d="m17,6 l -7,7 h 7 l-7,7" />
            )}
        </g>
    );
};

interface EbhaActuatorIndicationProps {
    x: number,
    y: number,
    hydraulicPowerSource: HydraulicPowerSource,
    elecPowerSource: ElecPowerSource,
}

export const EbhaActuatorIndication: FC<EbhaActuatorIndicationProps> = ({ x, y, hydraulicPowerSource, elecPowerSource }) => {
    const powerSourceInfoAvail = true;
    const powerSourceFailed = false;
    const actuatorHydPartFailed = false;
    const actuatorElecPartFailed = false;

    return (
        <g transform={`translate(${x} ${y})`}>
            <path className="Grey Fill" d="m0,0 h 40 v 25 h-40 z" />
            <path className={`Amber SW3 LineRound ${actuatorHydPartFailed ? '' : 'Hide'}`} d="m20,0 h -20 v 25 h20" />
            <path className={`Amber SW3 LineRound ${actuatorElecPartFailed ? '' : 'Hide'}`} d="m20,0 h 20 v 25 h-20" />

            <text
                className={`F26 ${powerSourceFailed ? 'Amber' : 'Green'} ${powerSourceInfoAvail ? '' : 'Hide'}`}
                x="3"
                y="23"
            >
                {hydraulicPowerSource === HydraulicPowerSource.Green ? 'G' : 'Y'}
            </text>

            <path className={`SW4 LineRound LineJoinRound ${powerSourceFailed ? 'Amber' : 'Green'}`} d="m34,6 l -7,7 h 7 l-7,7" />

        </g>
    );
};
