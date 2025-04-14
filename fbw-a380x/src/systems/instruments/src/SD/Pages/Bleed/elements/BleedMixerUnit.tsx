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
    <g id="MixerUnit" style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <path className="Grey SW2 NoFill" d="M 105,14 h -105 v -14 h 441 v 14 h -98 m -54,0 h -130" />

      <GaugeMarkerComponent
        value={ramInletOpen ? 1 : 2}
        x={152}
        y={14}
        min={0}
        max={2}
        radius={44}
        startAngle={180}
        endAngle={270}
        className="Green SW3 LineRound"
        indicator
        halfIndicator
        multiplierOuter={1}
        multiplierInner={0.07}
      />
      <circle className="Green SW2 NoFill" cx={152} cy={14} r={4} />

      <GaugeMarkerComponent
        value={ramInletOpen ? 1 : 2}
        x={337}
        y={15}
        min={0}
        max={2}
        radius={44}
        startAngle={180}
        endAngle={270}
        className="Green SW3 LineRound"
        indicator
        halfIndicator
        multiplierOuter={1}
        multiplierInner={0.07}
      />
      <circle className="Green SW2 NoFill" cx={337} cy={15} r={4} />

      <Triangle
        x={114}
        y={-23}
        colour={airSuppliedToCabinAndCockpit ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.3}
      />
      <Triangle
        x={328}
        y={-23}
        colour={airSuppliedToCabinAndCockpit ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.3}
      />
    </g>
  );
};

export default BleedMixerUnit;
