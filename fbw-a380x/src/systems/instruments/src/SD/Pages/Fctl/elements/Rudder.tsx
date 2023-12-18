import React, { FC } from 'react';
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
import { RudderTrim } from './RudderTrim';

export enum RudderPosition {
    Upper,
    Lower,
}

interface RudderProps {
    x: number,
    y: number,
    position: RudderPosition,
}

export const Rudder: FC<RudderProps> = ({ x, y, position }) => {
    const deflectionInfoValid = true;
    const rudderDeflection = 0;

    const powerSource1Avail = true;
    const powerSource2Avail = true;

    return (
        <g id={`rudder-${position}`} transform={`translate(${x} ${y})`}>
            <HorizontalDeflectionIndication
                powerAvail={powerSource1Avail || powerSource2Avail}
                deflectionInfoValid={deflectionInfoValid}
                deflection={rudderDeflection}
                position={position}
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
