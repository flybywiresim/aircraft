import React, { FC } from 'react';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { VerticalDeflectionIndication } from './VerticalDeflectionIndication';

export enum ElevatorSide {
    Left,
    Right,
}

export enum ElevatorPosition {
    Inboard,
    Outboard,
}

interface ElevatorProps {
    x: number,
    y: number,
    side: ElevatorSide,
    position: ElevatorPosition,
}

export const Elevator: FC<ElevatorProps> = ({ x, y, side, position }) => {
    const deflectionInfoValid = true;
    const elevatorDeflection = 0;

    const powerSource1Avail = true;
    const powerSource2Avail = true;

    let elecPowerSource: ElecPowerSource;
    let actuatorIndicationX: number;
    if ((side === ElevatorSide.Left && position === ElevatorPosition.Outboard)
        || (side === ElevatorSide.Right && position === ElevatorPosition.Inboard)) {
        elecPowerSource = ElecPowerSource.AcEha;
        actuatorIndicationX = -13;
    } else {
        elecPowerSource = ElecPowerSource.AcEss;
        actuatorIndicationX = -2;
    }

    return (
        <g id={`elevator-${side}-${position}`} transform={`translate(${x} ${y})`}>
            <VerticalDeflectionIndication
                powerAvail={powerSource1Avail || powerSource2Avail}
                deflectionInfoValid={deflectionInfoValid}
                deflection={elevatorDeflection}
            />

            <ActuatorIndication
                x={actuatorIndicationX}
                y={131}
                type={ActuatorType.Conventional}
                powerSource={side === ElevatorSide.Left ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
            />
            <ActuatorIndication
                x={actuatorIndicationX}
                y={161}
                type={ActuatorType.EHA}
                powerSource={elecPowerSource}
            />
        </g>
    );
};
