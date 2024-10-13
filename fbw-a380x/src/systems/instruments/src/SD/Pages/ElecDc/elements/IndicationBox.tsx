import { Triangle } from '@instruments/common/Shapes';
import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

interface IndicationBoxProps {
  x: number;
  y: number;
  network: string;
  TR: string; // TR_1
}

const IndicationBox: FC<IndicationBoxProps> = ({ x, y, network, TR }) => {
  // const sdacDatum = true;
  const simVarString = ['1', '2'].includes(network) ? `${TR}_${network}` : `${network}_${TR}`;
  const [potential] = useSimVar(`L:A32NX_ELEC_${simVarString}_POTENTIAL`, 'volts', 500);
  const [current] = useSimVar(`L:A32NX_ELEC_${simVarString}_CURRENT`, 'volts', 500);
  const BatteryCharging = true;

  let TRX = ['1', '2'].includes(network) ? x + 61 : x + 102;
  let networkX = ['1', '2'].includes(network) ? x + 71 : x + 11;

  if (TR === 'BAT') {
    TRX = ['1', '2'].includes(network) ? x + 77 : x + 118;
    networkX = ['1', '2'].includes(network) ? x + 87 : x + 11;
  }

  let batteryChargingStatusX = x + 56;
  let batteryChargingStatusY = y + 108;
  let batteryChargingArrowY = batteryChargingStatusY;

  if (network === '1') {
    batteryChargingStatusX -= 11;
  } else if (network === 'ESS') {
    batteryChargingStatusX += 8;
  } else if (network === '2') {
    batteryChargingStatusX += 8;
  }

  if (current < 0) {
    batteryChargingStatusY -= 14;
    batteryChargingArrowY = network === 'ESS' ? batteryChargingArrowY + 63 : batteryChargingArrowY + 165;
  } else {
    batteryChargingStatusY += 14;
    batteryChargingArrowY = y + 108;
  }

  return (
    <>
      <g id={`battery-charging-${network}`} className={BatteryCharging && TR === 'BAT' ? 'Show' : 'Hide'}>
        <path
          className={`${current < 0 ? 'Amber' : 'Green'} SW2 `}
          d={`M ${batteryChargingStatusX},${batteryChargingStatusY} l 0,${network === 'ESS' ? '63' : '165'}`}
        />
        <Triangle
          x={batteryChargingStatusX}
          y={batteryChargingArrowY}
          colour={current < 0 ? 'Amber' : 'Green'}
          fill={0}
          orientation={current < 0 ? 180 : 0}
          scale={1}
        />
      </g>
      <g id={`${TR}-${network}-indication-box`}>
        <path
          className="LightGrey SW3 BackgroundFill"
          d={`M ${x},${y} l 0,106 l ${TR === 'TR' ? 114 : 126},0 l 0,-106 l ${TR === 'TR' ? -114 : -126},0`}
        />
        <text x={TRX} y={y + 28} className="F25 EndAlign White LS1">
          {TR}
        </text>
        <text x={networkX} y={y + 28} className="F25 White LS1">
          {network}
        </text>
        <g>
          <text className="Cyan F23" x={TR === 'TR' ? x + 72 : x + 76} y={y + 61}>
            V
          </text>
          <text className="Cyan F23" x={TR === 'TR' ? x + 72 : x + 76} y={y + 96}>
            A
          </text>
        </g>
        {/* Voltage */}
        <text x={TR === 'TR' ? x + 62 : x + 70} y={y + 61} className="F29 EndAlign Green">
          {Math.round(potential)}
        </text>
        {/* Current */}
        <text x={TR === 'TR' ? x + 62 : x + 70} y={y + 96} className="F29 EndAlign Green">
          {Math.round(current)}
        </text>
      </g>
    </>
  );
};

export default IndicationBox;
