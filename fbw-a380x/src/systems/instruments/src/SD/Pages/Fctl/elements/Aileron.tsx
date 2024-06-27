import React, { FC } from 'react';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { MIN_VERTICAL_DEFLECTION, VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export enum AileronSide {
    Left = 'LEFT',
    Right = 'RIGHT',
}

export enum AileronPosition {
    Inboard = 'INWARD',
    Mid = 'MIDDLE',
    Outboard = 'OUTWARD',
}

interface AileronProps {
    x: number,
    y: number,
    side: AileronSide,
    position: AileronPosition,
    onGround: boolean,
}

export const Aileron: FC<AileronProps> = ({ x, y, side, position, onGround }) => {
    const deflectionInfoValid = true;
    const [aileronDeflection]: [number, (v: number) => void] = useSimVar(`L:A32NX_HYD_AILERON_${side}_${position}_DEFLECTION`, 'number', 100);

    const powerSource1Avail = true;
    const powerSource2Avail = true;

    let acutator1PowerSource: HydraulicPowerSource;
    let acutator2PowerSource: HydraulicPowerSource | ElecPowerSource;
    if (position === AileronPosition.Outboard) {
        acutator1PowerSource = HydraulicPowerSource.Green;
        acutator2PowerSource = HydraulicPowerSource.Yellow;
    } else if (position === AileronPosition.Mid) {
        acutator1PowerSource = HydraulicPowerSource.Yellow;
        acutator2PowerSource = ElecPowerSource.AcEss;
    } else {
        acutator1PowerSource = HydraulicPowerSource.Green;
        acutator2PowerSource = ElecPowerSource.AcEha;
    }

    let actuatorIndicationX: number;
    if (position === AileronPosition.Mid) {
        actuatorIndicationX = -5;
    } else if ((side === AileronSide.Left && position === AileronPosition.Outboard)
        || (side === AileronSide.Right && position === AileronPosition.Inboard)) {
        actuatorIndicationX = -13;
    } else {
        actuatorIndicationX = 2;
    }

    return (
        <g id={`aileron-${side}-${position}`} transform={`translate(${x} ${y})`}>
            <VerticalDeflectionIndication
                powerAvail={powerSource1Avail || powerSource2Avail}
                deflectionInfoValid={deflectionInfoValid}
                deflection={aileronDeflection * MIN_VERTICAL_DEFLECTION}
                showAileronDroopSymbol
                onGround={onGround}
            />

            <ActuatorIndication
                x={actuatorIndicationX}
                y={128}
                type={ActuatorType.Conventional}
                powerSource={acutator1PowerSource}
            />
            <ActuatorIndication
                x={actuatorIndicationX}
                y={159}
                type={position === AileronPosition.Outboard ? ActuatorType.Conventional : ActuatorType.EHA}
                powerSource={acutator2PowerSource}
            />
        </g>
    );
};
