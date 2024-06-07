import React, { FC } from 'react';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';

interface SlatFlapActuatorIndicationProps {
    x: number,
    y: number,
    type: 'SLATS' | 'FLAPS',
}

export const SlatFlapActuatorIndication: FC<SlatFlapActuatorIndicationProps> = ({ x, y, type }) => {
    const powerSourceInfoAvail = true;
    const powerSourceFailed = false;
    const actuatorFailed = false;

    return (
        <g id={`${type}-actuators`} transform={`translate(${x} ${y})`}>
            <path className='White SW1 LineRound' d='m10,0 h -10 v 52 h98 v-52 h-10' />

            <text x={13} y={10} className='F23 White'>{type}</text>

            <ActuatorIndication
                x={19}
                y={17}
                type={type === 'SLATS' ? ActuatorType.EHA : ActuatorType.Conventional}
                powerSource={type === 'SLATS' ? ElecPowerSource.AcEss : HydraulicPowerSource.Green}
            />
            <ActuatorIndication
                x={53}
                y={17}
                type={ActuatorType.Conventional}
                powerSource={type === 'SLATS' ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
            />
        </g>
    );
};
