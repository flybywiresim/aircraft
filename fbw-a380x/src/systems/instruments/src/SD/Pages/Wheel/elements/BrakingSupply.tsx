import React, { FC } from 'react';
import { ElecPowerSource, HydraulicPowerSource, PowerSupplyIndication, PowerSupplyType } from './PowerSupply';
import { WheelBogeyType } from './WheelBogey';

interface BrakingSupplyProps {
  x: number;
  y: number;
  type: WheelBogeyType;
}

export const BrakingSupply: FC<BrakingSupplyProps> = ({ x, y, type }) => (
  <g id="braking-power-supplies" transform={`translate(${x} ${y})`}>
    <PowerSupplyIndication
      x={-23}
      y={-30}
      type={PowerSupplyType.Conventional}
      powerSource={type === WheelBogeyType.WLG ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
    />
    <PowerSupplyIndication
      x={1}
      y={-30}
      type={PowerSupplyType.EHA}
      powerSource={type === WheelBogeyType.WLG ? ElecPowerSource.Ac4 : ElecPowerSource.Ac2}
    />
  </g>
);
