import React, { FC } from 'react';
import {
  ActuatorIndication,
  ActuatorType,
  ElecPowerSource,
  HydraulicPowerSource,
  powerSourceIsHydraulic,
} from './ActuatorIndication';
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
  x: number;
  y: number;
  side: AileronSide;
  position: AileronPosition;
  onGround: boolean;
}

export const Aileron: FC<AileronProps> = ({ x, y, side, position, onGround }) => {
  const deflectionInfoValid = true;
  const [aileronDeflection]: [number, (v: number) => void] = useSimVar(
    `L:A32NX_HYD_AILERON_${side}_${position}_DEFLECTION`,
    'number',
    100,
  );

  let actuator1PowerSource: HydraulicPowerSource;
  let actuator2PowerSource: HydraulicPowerSource | ElecPowerSource;
  if (position === AileronPosition.Outboard) {
    actuator1PowerSource = HydraulicPowerSource.Green;
    actuator2PowerSource = HydraulicPowerSource.Yellow;
  } else if (position === AileronPosition.Mid) {
    actuator1PowerSource = HydraulicPowerSource.Yellow;
    actuator2PowerSource = ElecPowerSource.AcEss;
  } else {
    actuator1PowerSource = HydraulicPowerSource.Green;
    actuator2PowerSource = ElecPowerSource.AcEha;
  }

  let actuatorIndicationX: number;
  if (position === AileronPosition.Mid) {
    actuatorIndicationX = -5;
  } else if (
    (side === AileronSide.Left && position === AileronPosition.Outboard) ||
    (side === AileronSide.Right && position === AileronPosition.Inboard)
  ) {
    actuatorIndicationX = -13;
  } else {
    actuatorIndicationX = 2;
  }

  const [powerSource1Avail]: [boolean, (v: boolean) => void] = useSimVar(
    `L:A32NX_HYD_${actuator1PowerSource}_SYSTEM_1_SECTION_PRESSURE_SWITCH`,
    'boolean',
    1000,
  );
  const [powerSource2Avail]: [boolean, (v: boolean) => void] = useSimVar(
    powerSourceIsHydraulic(actuator2PowerSource)
      ? `L:A32NX_HYD_${actuator2PowerSource}_SYSTEM_1_SECTION_PRESSURE_SWITCH`
      : `L:A32NX_ELEC_${actuator2PowerSource}_BUS_IS_POWERED`,
    'boolean',
    1000,
  );

  return (
    <g id={`aileron-${side}-${position}`} transform={`translate(${x} ${y})`}>
      <VerticalDeflectionIndication
        powerAvail={powerSource1Avail || powerSource2Avail}
        deflectionInfoValid={deflectionInfoValid}
        deflection={(side === AileronSide.Left ? -aileronDeflection : aileronDeflection) * MIN_VERTICAL_DEFLECTION}
        showAileronDroopSymbol
        onGround={onGround}
      />

      <ActuatorIndication
        x={actuatorIndicationX}
        y={128}
        type={ActuatorType.Conventional}
        powerSource={actuator1PowerSource}
        powerSourceAvailable={powerSource1Avail}
      />
      <ActuatorIndication
        x={actuatorIndicationX}
        y={159}
        type={position === AileronPosition.Outboard ? ActuatorType.Conventional : ActuatorType.EHA}
        powerSource={actuator2PowerSource}
        powerSourceAvailable={powerSource2Avail}
      />
    </g>
  );
};
