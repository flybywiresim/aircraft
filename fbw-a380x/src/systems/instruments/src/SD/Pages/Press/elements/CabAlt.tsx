import { useArinc429Var } from '@flybywiresim/fbw-sdk';
import { GaugeComponent, GaugeMarkerComponent, ThrottlePositionDonutComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position, ValidRedundantSystem } from '@instruments/common/types';
import React from 'react';

export const CabAlt: React.FC<Position & ValidRedundantSystem> = ({ x, y, system }) => {
  const [manCabinAlt] = useSimVar('L:A32NX_PRESS_MAN_CABIN_ALTITUDE', 'feet', 500);
  const cabinAltArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_ALTITUDE_B${system}`, 500);
  const cabinAlt = cabinAltArinc.isNormalOperation() ? cabinAltArinc.value : manCabinAlt;

  const cabAlt50 = Math.round(cabinAlt / 50) * 50;

  const cabinAltTargetArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_ALTITUDE_TARGET_B${system}`, 500);
  const cabinAltTarget = cabinAltTargetArinc.isNormalOperation() ? cabinAltTargetArinc.value : null;

  const cabAltTarget50 = Math.round(cabinAltTarget / 50) * 50;

  const [cabAltAutoMode] = useSimVar('L:A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO', 'bool', 500);

  const radius = 87;
  const startAngle = 212;
  const endAngle = 89;
  const maxValue = 12.5;

  return (
    <g id="DeltaPressure">
      <text className="F29 LS1 Center Green" x={x - 117} y={y - 142}>
        {cabAltAutoMode ? 'AUTO' : 'MAN'}
      </text>
      <text className="F29 LS1 Center White" x={x - 26} y={y - 142}>
        CAB ALT
      </text>
      <text className="F24 Center Cyan" x={x - 10} y={y - 105}>
        FT
      </text>
      <text className={`F35 EndAlign ${cabAlt50 >= 9550 ? 'Red' : 'Green'}`} x={x + 108} y={y + 66}>
        {cabAlt50}
      </text>
      <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="Gauge">
        <GaugeComponent
          x={x}
          y={y}
          radius={radius - 2}
          startAngle={endAngle - 50}
          endAngle={endAngle}
          visible
          className="GaugeComponent Gauge ThickRedLine"
        />
        <text className="GaugeText" x={x + 45} y={y + 6}>
          17
        </text>
        <GaugeMarkerComponent
          value={12.5}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
          textNudgeY={15}
          textNudgeX={-3}
        />
        <GaugeMarkerComponent
          value={10}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="GaugeText"
          showValue
          textNudgeY={14}
          textNudgeX={-3}
        />
        <GaugeMarkerComponent
          value={7.5}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={5}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          showValue
          className="GaugeText"
          textNudgeX={13}
          textNudgeY={12}
        />
        <GaugeMarkerComponent
          value={2.5}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={0}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="GaugeText"
          showValue
          textNudgeY={-4}
          textNudgeX={7}
        />
        <GaugeMarkerComponent
          value={cabAlt50 / 1000}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className={`GaugeIndicator SW4 ${cabAlt50 < -0.4 || cabAlt50 >= 8.5 ? 'Amber' : ''}`}
          indicator
          multiplierOuter={1.01}
        />
        <ThrottlePositionDonutComponent
          value={cabAltTarget50 / 1000}
          x={x}
          y={y}
          min={-0.6}
          max={maxValue}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className={`SW3 NoFill ${cabAltAutoMode ? 'Magenta' : 'Cyan'} ${cabinAltTarget === null ? 'Hide' : 'Show'}`}
          outerMultiplier={1.1}
          donutRadius={6}
        />
      </GaugeComponent>
    </g>
  );
};

export default CabAlt;
