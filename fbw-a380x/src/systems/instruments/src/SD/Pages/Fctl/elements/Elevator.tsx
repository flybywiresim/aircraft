import React, { FC, useEffect } from 'react';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { MIN_VERTICAL_DEFLECTION, VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export enum ElevatorSide {
    Left = 'LEFT',
    Right = 'RIGHT',
}

export enum ElevatorPosition {
    Inboard = 'INWARD',
    Outboard = 'OUTWARD',
}

interface ElevatorProps {
    x: number,
    y: number,
    side: ElevatorSide,
    position: ElevatorPosition,
    onGround: boolean,
}

export const Elevator: FC<ElevatorProps> = ({ x, y, side, position, onGround }) => {
    const [elevatorDeflection]: [number, (v: number) => void] = useSimVar(`L:A32NX_HYD_ELEVATOR_${side}_${position}_DEFLECTION`, 'number', 100);
    const deflectionInfoValid = true;

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
                deflection={elevatorDeflection * MIN_VERTICAL_DEFLECTION}
                onGround={onGround}
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
