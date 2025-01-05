import React, { FC } from 'react';
import { ElecPowerSource, HydraulicPowerSource, PowerSupplyIndication, PowerSupplyType } from './PowerSupply';

interface BodyWheelSteeringProps {
  x: number;
  y: number;
}

export const BodyWheelSteering: FC<BodyWheelSteeringProps> = ({ x, y }) => (
  <g id="body-wheel-steering" transform={`translate(${x} ${y})`}>
    <path className="Green SW3 LineRound" d="m -10,0 h 4 M 10,0 h -4" />
    <circle className="Green NoFill SW3" r={4} cx={0} cy={0} />
    <PowerSupplyIndication
      x={-11}
      y={-32}
      type={PowerSupplyType.Conventional}
      powerSource={HydraulicPowerSource.Yellow}
    />
  </g>
);

interface NoseWheelSteeringProps {
  x: number;
  y: number;
}

export const NoseWheelSteering: FC<NoseWheelSteeringProps> = ({ x, y }) => (
  <g id="nose-wheel-steering" transform={`translate(${x} ${y})`}>
    <path className="Green SW3 LineRound" d="m -19,0 h 13 M 19,0 h -13" />
    <circle className="Green NoFill SW3" r={5} cx={0} cy={0} />
    <PowerSupplyIndication
      x={-23}
      y={-30}
      type={PowerSupplyType.Conventional}
      powerSource={HydraulicPowerSource.Green}
    />
    <PowerSupplyIndication x={2} y={-30} type={PowerSupplyType.EHA} powerSource={ElecPowerSource.Ac3} />
  </g>
);
