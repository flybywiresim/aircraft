import React, { FC } from 'react';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { useSimVar } from '@flybywiresim/fbw-sdk';

interface SlatFlapActuatorIndicationProps {
  x: number;
  y: number;
  type: 'SLATS' | 'FLAPS';
}

export const SlatFlapActuatorIndication: FC<SlatFlapActuatorIndicationProps> = ({ x, y, type }) => {
  const [hydGreenAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH`,
    'boolean',
    1000,
  );
  const [hydYellowAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH`,
    'boolean',
    1000,
  );
  const [elecAcEssAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED`,
    'boolean',
    1000,
  );

  return (
    <g id={`${type}-actuators`} transform={`translate(${x} ${y})`}>
      <path className="White SW1 LineRound" d="m10,0 h -10 v 52 h98 v-52 h-10" />

      <text x={13} y={10} className="F23 White">
        {type}
      </text>

      <ActuatorIndication
        x={19}
        y={17}
        type={type === 'SLATS' ? ActuatorType.EHA : ActuatorType.Conventional}
        powerSource={type === 'SLATS' ? ElecPowerSource.AcEss : HydraulicPowerSource.Green}
        powerSourceAvailable={type === 'SLATS' ? elecAcEssAvailable : hydGreenAvailable}
      />
      <ActuatorIndication
        x={53}
        y={17}
        type={ActuatorType.Conventional}
        powerSource={type === 'SLATS' ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
        powerSourceAvailable={type === 'SLATS' ? hydGreenAvailable : hydYellowAvailable}
      />
    </g>
  );
};
