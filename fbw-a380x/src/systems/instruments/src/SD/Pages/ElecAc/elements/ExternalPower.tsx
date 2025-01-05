import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { AcElecBus } from './BusBar';

const EXT_PWR_VOLTAGE_NORMAL_RANGE_LOWER = 110;
const EXT_PWR_VOLTAGE_NORMAL_RANGE_UPPER = 120;
const EXT_PWR_FREQUENCY_NORMAL_RANGE_LOWER = 390;
const EXT_PWR_FREQUENCY_NORMAL_RANGE_UPPER = 410;

interface ExternalPowerProps {
  x: number;
  y: number;
  bus: AcElecBus;
}

export const ExternalPower: FC<ExternalPowerProps> = ({ x, y, bus }) => {
  const [potential] = useSimVar('L:A32NX_ELEC_EXT_PWR_POTENTIAL', 'volts', 500);
  const [frequency] = useSimVar('L:A32NX_ELEC_EXT_PWR_FREQUENCY', 'volts', 500);

  const extPwrFreqNormal =
    frequency > EXT_PWR_FREQUENCY_NORMAL_RANGE_LOWER && frequency < EXT_PWR_FREQUENCY_NORMAL_RANGE_UPPER;
  const extPwrVoltageNormal =
    potential > EXT_PWR_VOLTAGE_NORMAL_RANGE_LOWER && potential < EXT_PWR_VOLTAGE_NORMAL_RANGE_UPPER;

  const [lineContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_990XG${bus}_IS_CLOSED`, 'number', 500);

  const [extPwrConnected] = useSimVar(`L:A32NX_EXT_PWR_AVAIL:${bus}`, 'number', 500);
  let otherExtPwrConnected = false;
  if (bus % 2 === 1) {
    [otherExtPwrConnected] = useSimVar(`L:A32NX_EXT_PWR_AVAIL:${bus + 1}`, 'number', 500);
  }

  const [noseCompressed1] = useSimVar('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'number', 500);
  const [noseCompressed2] = useSimVar('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'number', 500);
  const onGround = noseCompressed1 || noseCompressed2;

  return (
    <>
      <g
        id={`external-power-${bus}-units`}
        transform={`translate(${x} ${y})`}
        className={bus % 2 === 1 && (extPwrConnected || otherExtPwrConnected) ? '' : 'Hide'}
      >
        <text className="Cyan F22" x={94} y={38}>
          V
        </text>
        <text className="Cyan F22" x={87} y={64}>
          HZ
        </text>
      </g>
      <g
        id={`external-power-${bus}-indication`}
        transform={`translate(${x} ${y})`}
        className={onGround || extPwrConnected ? '' : 'Hide'}
      >
        <text x={8} y={10} className="F22 White LS1">
          EXT
        </text>
        <text x={57} y={10} className="F22 White">
          {bus}
        </text>

        <g className={extPwrConnected ? '' : 'Hide'}>
          <path className="LightGrey SW3 NoFill StrokeRound" d="M 5,0 l -5,0 l 0,70 l 5,0" />
          <path className="LightGrey SW3 NoFill StrokeRound" d="M 71,0 l 5,0 l 0,70 l -5,0" />

          {/* Voltage */}
          <text x={69} y={38} className={`F29 EndAlign ${extPwrFreqNormal ? 'Green' : 'Amber'} LS1`}>
            {Math.round(potential)}
          </text>
          {/* Frequency */}
          <text x={69} y={65} className={`F29 EndAlign ${extPwrVoltageNormal ? 'Green' : 'Amber'} LS1`}>
            {Math.round(frequency)}
          </text>
        </g>

        {/* GEN line contactor indication */}
        <Triangle
          x={bus <= 2 ? 40 : 36}
          y={-29}
          colour={lineContactorClosed ? 'Green' : 'White'}
          fill={0}
          orientation={0}
          scale={1}
        />
        <path className={`SW2 Green ${lineContactorClosed ? '' : 'Hide'}`} d={`M ${bus <= 2 ? 40 : 36},-29 l 0,-43`} />
      </g>
    </>
  );
};
