import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';

const STAT_INV_VOLTAGE_NORMAL_RANGE_LOWER = 110;
const STAT_INV_VOLTAGE_NORMAL_RANGE_UPPER = 120;
const STAT_INV_FREQUENCY_NORMAL_RANGE_LOWER = 390;
const STAT_INV_FREQUENCY_NORMAL_RANGE_UPPER = 410;

interface StaticInverterProps {
  x: number;
  y: number;
}

export const StaticInverter: FC<StaticInverterProps> = ({ x, y }) => {
  const [potential] = useSimVar('L:A32NX_ELEC_STAT_INV_POTENTIAL', 'volts', 500);
  const [frequency] = useSimVar('L:A32NX_ELEC_STAT_INV_FREQUENCY', 'volts', 500);

  const statInvFreqNormal =
    frequency > STAT_INV_FREQUENCY_NORMAL_RANGE_LOWER && frequency < STAT_INV_FREQUENCY_NORMAL_RANGE_UPPER;
  const statInvVoltageNormal =
    potential > STAT_INV_VOLTAGE_NORMAL_RANGE_LOWER && potential < STAT_INV_VOLTAGE_NORMAL_RANGE_UPPER;

  const [staticInvertedDcCtorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_7XB_IS_CLOSED', 'number', 500);
  const [staticInvertedToAcEmerCtorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XB.2_IS_CLOSED', 'number', 500);

  const statInvFailed = false;

  let triangleColor = 'White';
  if (statInvFailed) {
    triangleColor = 'Amber';
  } else if (
    staticInvertedDcCtorClosed &&
    (!statInvFreqNormal || !statInvVoltageNormal || !staticInvertedToAcEmerCtorClosed)
  ) {
    triangleColor = 'Amber';
  } else if (staticInvertedDcCtorClosed && staticInvertedToAcEmerCtorClosed) {
    triangleColor = 'Green';
  }

  const showStaticInvIndication = staticInvertedDcCtorClosed || staticInvertedToAcEmerCtorClosed;

  return (
    <g id="static-inverter-indication" transform={`translate(${x} ${y})`}>
      <text x={24} y={showStaticInvIndication ? -17 : 10} className="F25 White LS1 WS-6">
        STAT INV
      </text>

      <g className={showStaticInvIndication ? '' : 'Hide'}>
        <path className="LightGrey SW3 NoFill" d="M 20,-41 l 0,86 l 133,0 l 0,-86 z" />

        {/* Voltage */}
        <text x={110} y={11} className={`F29 EndAlign ${statInvFreqNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(potential)}
        </text>
        {/* Frequency */}
        <text x={110} y={39} className={`F29 EndAlign ${statInvVoltageNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(frequency)}
        </text>
        <text className="Cyan F22" x={114} y={11}>
          V
        </text>
        <text className="Cyan F22" x={114} y={39}>
          HZ
        </text>
      </g>

      {/* STAT INV contactor indication */}
      <Triangle x={0} y={0} colour={triangleColor} fill={0} orientation={-90} scale={1} />
      <path
        className={`SW2 Green ${staticInvertedDcCtorClosed && staticInvertedToAcEmerCtorClosed ? '' : 'Hide'}`}
        d="M 0,0 l -43,0"
      />
    </g>
  );
};
