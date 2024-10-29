import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { DcElecBus } from './BusBar';

interface BatToBusWireProps {
  x: number;
  y: number;
  bus: DcElecBus;
}

export const BatToBusWire: FC<BatToBusWireProps> = ({ x, y, bus }) => {
  const [current] = useSimVar(`L:A32NX_ELEC_BAT_${bus}_CURRENT`, 'volts', 500);

  // TODO APU should only be green when discharging to start APU
  const color = current > 0 || bus === DcElecBus.DcApu ? 'Green' : 'Amber';

  const charging = current > 0;
  const discharging = current < 0;

  let contactorName: string;
  if (bus <= 2) {
    contactorName = `990PB${bus}`;
  } else if (bus === DcElecBus.DcEssBus) {
    contactorName = '6PB3';
  } else {
    contactorName = '5PB';
  }

  const [batteryLineContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_${contactorName}_IS_CLOSED`, 'bool', 500);

  if (bus === DcElecBus.Dc1Bus) {
    const [emergencyLineContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_6PC1_IS_CLOSED', 'bool', 500);

    let triangleX = 0;
    let triangleY = 0;
    let triangleOrientation = 0;
    if (charging) {
      triangleX = 64;
      triangleY = -164;
      triangleOrientation = 0;
    } else if (discharging && batteryLineContactorClosed) {
      triangleX = 64;
      triangleY = 0;
      triangleOrientation = 180;
    } else if (discharging && emergencyLineContactorClosed) {
      triangleX = 154;
      triangleY = -92;
      triangleOrientation = 90;
    }

    return (
      <g id={`bat-to-bus-${bus}`} transform={`translate(${x} ${y})`}>
        {(charging || discharging) && (emergencyLineContactorClosed || batteryLineContactorClosed) && (
          <Triangle x={triangleX} y={triangleY} colour={color} fill={0} orientation={triangleOrientation} scale={1} />
        )}
        <path
          className={`${color} SW2 ${batteryLineContactorClosed ? 'Show' : 'Hide'}`}
          d={`M 64,${discharging ? -14 : 0} l 0,${discharging ? -78 : -92}`}
        />
        <path
          className={`${color} SW2 ${emergencyLineContactorClosed || batteryLineContactorClosed ? 'Show' : 'Hide'}`}
          d={`M 64,-92 l 0,${charging ? -58 : -76}`}
        />
        <path
          className={`${color} SW2 ${emergencyLineContactorClosed ? 'Show' : 'Hide'}`}
          d={`M 64,-92 l ${discharging ? 76 : 90},0`}
        />
      </g>
    );
  }

  let batToBusbarPath: string;
  let triangleX: number;
  let triangleY: number;
  if (bus === DcElecBus.DcEssBus) {
    batToBusbarPath = `M 93,${discharging ? -14 : 0} l 0,${charging || discharging ? -47 : -65}`;
    triangleX = 93;
    triangleY = charging ? -61 : 0;
  } else {
    batToBusbarPath = `M 64,${discharging ? -14 : 0}l 0,${charging || discharging ? -150 : -167}`;
    triangleX = 64;
    triangleY = charging ? -164 : 0;
  }

  return (
    <g
      id={`bat-to-bus-${bus}`}
      className={batteryLineContactorClosed ? 'Show' : 'Hide'}
      transform={`translate(${x} ${y})`}
    >
      {(charging || discharging) && (
        <Triangle x={triangleX} y={triangleY} colour={color} fill={0} orientation={charging ? 0 : 180} scale={1} />
      )}
      <path className={`${color} SW2`} d={batToBusbarPath} />
    </g>
  );
};
