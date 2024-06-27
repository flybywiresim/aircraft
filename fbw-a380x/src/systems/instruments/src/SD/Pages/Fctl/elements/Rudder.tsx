import React, { FC } from 'react';
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HORIZONTAL_MAX_DEFLECTION, HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
import { RudderTrim } from './RudderTrim';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export enum RudderPosition {
    Upper = 'UPPER',
    Lower = 'LOWER',
}

interface RudderProps {
    x: number,
    y: number,
    position: RudderPosition,
    onGround: boolean,
}

export const Rudder: FC<RudderProps> = ({ x, y, position, onGround }) => {
    const deflectionInfoValid = true;
    const [rudderDeflection]: [number, (v: number) => void] = useSimVar(`L:A32NX_HYD_${position}_RUDDER_DEFLECTION`, 'number', 100);

    const powerSource1Avail = true;
    const powerSource2Avail = true;

    return (
        <g id={`rudder-${position}`} transform={`translate(${x} ${y})`}>
            <HorizontalDeflectionIndication
                powerAvail={powerSource1Avail || powerSource2Avail}
                deflectionInfoValid={deflectionInfoValid}
                deflection={rudderDeflection * HORIZONTAL_MAX_DEFLECTION}
                position={position}
                onGround={onGround}
            />

            <EbhaActuatorIndication
                x={-60}
                y={position === RudderPosition.Upper ? -39 : -2}
                hydraulicPowerSource={position === RudderPosition.Upper ? HydraulicPowerSource.Yellow : HydraulicPowerSource.Green}
                elecPowerSource={ElecPowerSource.AcEss}
            />
            <EbhaActuatorIndication
                x={-60}
                y={position === RudderPosition.Upper ? -8 : 30}
                hydraulicPowerSource={position === RudderPosition.Upper ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
                elecPowerSource={position === RudderPosition.Upper ? ElecPowerSource.AcEha : ElecPowerSource.Ac1}
            />
        </g>
    );
};
