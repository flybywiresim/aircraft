import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import { GaugeMarkerComponent } from '@instruments/common/gauges';

interface BleedMixerUnitProps {
  x: number;
  y: number;
  _sdacDatum: boolean;
}

const BleedMixerUnit: FC<BleedMixerUnitProps> = ({ x, y, _sdacDatum }) => {
  // TODO Add Air supplied to cabin and cockpit simvar
  const [hpValve1] = useSimVar('L:A32NX_PNEU_ENG_1_HP_VALVE_OPEN', 'bool', 500);
  const [hpValve2] = useSimVar('L:A32NX_PNEU_ENG_2_HP_VALVE_OPEN', 'bool', 500);
  const airSuppliedToCabinAndCockpit = hpValve1 || hpValve2;
  // TODO: Replace with signal from systems once implemented
  const [ramInletOpen] = useSimVar('L:A32NX_OVHD_COND_RAM_AIR_PB_IS_ON', 'bool', 100);

  return (
    <g id="MixerUnit">
      <path className="Grey SW2" d={`M ${x},${y} l -228,0 l 0,16 l 102,0`} />
      <path className="Grey SW2" d={`M ${x},${y} l 210,0 l 0,16 l -100,0`} />
      <path className="Grey SW2" d={`M ${x - 74},${y + 16} l 133,0`} />

      <GaugeMarkerComponent
        value={ramInletOpen ? 1 : 2}
        x={x - 80}
        y={y + 16}
        min={0}
        max={2}
        radius={44}
        startAngle={180}
        endAngle={270}
        className="Green Line"
        indicator
        multiplierOuter={1}
      />
      <circle className="Green SW2 BackgroundFill" cx={x - 80} cy={y + 16} r={3} />

      <GaugeMarkerComponent
        value={ramInletOpen ? 1 : 2}
        x={x + 105}
        y={y + 16}
        min={0}
        max={2}
        radius={44}
        startAngle={180}
        endAngle={270}
        className="Green Line"
        indicator
        multiplierOuter={1}
      />
      <circle className="Green SW2 BackgroundFill" cx={x + 104} cy={y + 16} r={3} />

      <Triangle
        x={x - 116}
        y={y - 22}
        colour={airSuppliedToCabinAndCockpit ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.2}
      />
      <Triangle
        x={x + 98}
        y={y - 22}
        colour={airSuppliedToCabinAndCockpit ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.2}
      />
    </g>
  );
};

export default BleedMixerUnit;
