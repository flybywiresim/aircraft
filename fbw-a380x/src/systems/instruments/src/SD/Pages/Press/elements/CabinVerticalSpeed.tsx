import { useArinc429Var } from '@flybywiresim/fbw-sdk';
import { GaugeComponent, GaugeMarkerComponent, ThrottlePositionDonutComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position, ValidRedundantSystem } from '@instruments/common/types';
import React from 'react';

const CabinVerticalSpeed: React.FC<Position & ValidRedundantSystem> = ({ x, y, system }) => {
  const [mancabinVs] = useSimVar('L:A32NX_PRESS_MAN_CABIN_VS', 'feet per minute', 500);
  const cabinVsArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_VS_B${system}`, 500);
  const cabinVs = cabinVsArinc.isNormalOperation() ? cabinVsArinc.value : mancabinVs;

  const cabinVsTargetArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_VS_TARGET_B${system}`, 500);
  const cabinVsTarget = cabinVsTargetArinc.isNormalOperation() ? cabinVsTargetArinc.value : null;
  const [cabVsAutoMode] = useSimVar('L:A32NX_OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO', 'bool', 500);

  const radius = 88;
  const min = -2;
  const max = 2;
  const startAngle = 180;
  const endAngle = 0;

  return (
    <>
      <g id="VsIndicator">
        <text className="F29 LS1 Center Green" x={x - 109} y={y - 142}>
          {cabVsAutoMode ? 'AUTO' : 'MAN'}
        </text>
        <text className="F29 LS1 Center White" x={x - 15} y={y - 142}>
          V/S
        </text>
        <text className="F24 Center Cyan" x={x - 43} y={y - 105}>
          FT/MIN
        </text>
        <text
          className={`F35 EndAlign  ${Math.abs(Math.round(cabinVs / 50) * 50) > 1800 ? 'GreenTextPulse' : 'Green'}`}
          x={x + 128}
          y={y + 13}
        >
          {Math.round(cabinVs / 50) * 50}
        </text>

        <GaugeComponent
          x={x}
          y={y}
          radius={radius}
          startAngle={158}
          endAngle={22}
          visible
          className="GaugeComponent Gauge"
        >
          <GaugeMarkerComponent
            value={2}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeText"
            showValue
            textNudgeY={14}
          />
          <GaugeMarkerComponent
            value={1}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeText"
            showValue
            textNudgeX={12}
            textNudgeY={12}
          />
          <GaugeMarkerComponent
            value={0}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeText"
            showValue
            textNudgeX={8}
            textNudgeY={2}
          />
          <GaugeMarkerComponent
            value={-1}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeText"
            showValue
            textNudgeX={12}
            textNudgeY={-12}
          />
          <GaugeMarkerComponent
            value={-2}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeText"
            showValue
            textNudgeY={-11}
          />
          <GaugeMarkerComponent
            value={Math.abs(((cabinVs / 50) * 50) / 1000) <= 2.25 ? ((cabinVs / 50) * 50) / 1000 : 2.25}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className={`GaugeIndicator ${Math.abs(Math.round(cabinVs / 50) * 50) > 1800 ? 'GreenIndicatorPulse' : ''}`}
            indicator
            multiplierOuter={1.01}
          />
          <ThrottlePositionDonutComponent
            value={((cabinVsTarget / 50) * 50) / 1000}
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className={`SW3 NoFill ${cabVsAutoMode ? 'Magenta' : 'Cyan'} ${cabinVsTarget === null ? 'Hide' : 'Show'}`}
            outerMultiplier={1.1}
            donutRadius={6}
          />
        </GaugeComponent>
      </g>
    </>
  );
};

export default CabinVerticalSpeed;
