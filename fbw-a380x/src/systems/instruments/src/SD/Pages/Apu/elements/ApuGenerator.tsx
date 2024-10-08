import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';

const APU_GEN_LOAD_NORMAL_RANGE_UPPER = 108;
const APU_GEN_VOLTAGE_NORMAL_RANGE_LOWER = 110;
const APU_GEN_VOLTAGE_NORMAL_RANGE_UPPER = 120;
const APU_GEN_FREQUENCY_NORMAL_RANGE_LOWER = 390;
const APU_GEN_FREQUENCY_NORMAL_RANGE_UPPER = 410;

interface ApuGeneratorProps {
  x: number;
  y: number;
  position: 1 | 2;
}

export const ApuGenerator: FC<ApuGeneratorProps> = ({ x, y, position }) => {
  const [load] = useSimVar(`L:A32NX_ELEC_APU_GEN_${position}_LOAD`, 'number', 500);
  const [potential] = useSimVar(`L:A32NX_ELEC_APU_GEN_${position}_POTENTIAL`, 'volts', 500);
  const [frequency] = useSimVar(`L:A32NX_ELEC_APU_GEN_${position}_FREQUENCY`, 'hertz', 500);

  const apuGenLoadNormal = load < APU_GEN_LOAD_NORMAL_RANGE_UPPER;
  const apuGenFreqNormal =
    frequency > APU_GEN_FREQUENCY_NORMAL_RANGE_LOWER && frequency < APU_GEN_FREQUENCY_NORMAL_RANGE_UPPER;
  const apuGenVoltageNormal =
    potential > APU_GEN_VOLTAGE_NORMAL_RANGE_LOWER && potential < APU_GEN_VOLTAGE_NORMAL_RANGE_UPPER;

  const [lineContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_990XS${position}_IS_CLOSED`, 'number', 500);
  const [genPushbuttonAuto] = useSimVar(`APU GENERATOR SWITCH:${position}`, 'number', 500);
  const [masterSwPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);

  return (
    <g id={`apu-gen-${position}-indication`} transform={`translate(${x} ${y})`}>
      <text
        x={position === 1 ? 8 : 7}
        y={10}
        className={`F22 ${genPushbuttonAuto || !masterSwPbOn ? 'White' : 'Amber'}`}
      >
        GEN
      </text>
      <text
        x={position === 1 ? 65 : 64}
        y={10}
        className={`F22 ${genPushbuttonAuto || !masterSwPbOn ? 'White' : 'Amber'}`}
      >
        {position === 1 ? 'A' : 'B'}
      </text>

      <path
        className={`White SW3 NoFill StrokeRound ${masterSwPbOn ? '' : 'Hide'}`}
        d="M 5,0 l -5,0 l 0,100 l 83,0 l 0,-100 l -5,0"
      />

      <g className={masterSwPbOn && genPushbuttonAuto ? '' : 'Hide'}>
        {/* Load */}
        <text x={73} y={42} className={`F29 EndAlign ${apuGenLoadNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(load)}
        </text>
        {/* Voltage */}
        <text x={73} y={67} className={`F29 EndAlign ${apuGenFreqNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(potential)}
        </text>
        {/* Frequency */}
        <text x={73} y={93} className={`F29 EndAlign ${apuGenVoltageNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(frequency)}
        </text>
      </g>
      <text x={72} y={62} className={`F29 EndAlign White LS1 ${genPushbuttonAuto || !masterSwPbOn ? 'Hide' : ''}`}>
        OFF
      </text>

      {/* GEN line contactor indication */}
      <Triangle
        x={position === 1 ? 43 : 39}
        y={-29}
        colour={lineContactorClosed ? 'Green' : 'White'}
        fill={0}
        orientation={0}
        scale={1}
      />
    </g>
  );
};
