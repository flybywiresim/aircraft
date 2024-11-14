import React, { FC } from 'react';
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HORIZONTAL_MAX_DEFLECTION, HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export enum RudderPosition {
  Upper = 'UPPER',
  Lower = 'LOWER',
}

interface RudderProps {
  x: number;
  y: number;
  position: RudderPosition;
  onGround: boolean;
}

export const Rudder: FC<RudderProps> = ({ x, y, position, onGround }) => {
  const deflectionInfoValid = true;
  const [rudderDeflection]: [number, (v: number) => void] = useSimVar(
    `L:A32NX_HYD_${position}_RUDDER_DEFLECTION`,
    'number',
    100,
  );

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
  const [elecAc1Available]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_ELEC_AC_1_BUS_IS_POWERED`,
    'boolean',
    1000,
  );
  const [elecAcEhaAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_ELEC_247XP_BUS_IS_POWERED`,
    'boolean',
    1000,
  ); // 247XP = AC EHA bus
  const [elecAcEssAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED`,
    'boolean',
    1000,
  );

  const powerSource1Avail =
    position === RudderPosition.Upper
      ? elecAcEssAvailable || hydYellowAvailable
      : elecAcEssAvailable || hydGreenAvailable;
  const powerSource2Avail =
    position === RudderPosition.Upper
      ? elecAcEhaAvailable || hydGreenAvailable
      : elecAc1Available || hydYellowAvailable;

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
        hydraulicPowerSource={
          position === RudderPosition.Upper ? HydraulicPowerSource.Yellow : HydraulicPowerSource.Green
        }
        elecPowerSource={ElecPowerSource.AcEss}
        hydPowerAvailable={position === RudderPosition.Upper ? hydYellowAvailable : hydGreenAvailable}
        elecPowerAvailable={elecAcEssAvailable}
      />
      <EbhaActuatorIndication
        x={-60}
        y={position === RudderPosition.Upper ? -8 : 30}
        hydraulicPowerSource={
          position === RudderPosition.Upper ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow
        }
        elecPowerSource={position === RudderPosition.Upper ? ElecPowerSource.AcEha : ElecPowerSource.Ac1}
        hydPowerAvailable={position === RudderPosition.Upper ? hydGreenAvailable : hydYellowAvailable}
        elecPowerAvailable={position === RudderPosition.Upper ? elecAcEhaAvailable : elecAc1Available}
      />
    </g>
  );
};
