import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import React, { FC } from 'react';

interface AccumulatorProps {
  x: number;
  y: number;
  moreActive: boolean;
}

export const Accumulator: FC<AccumulatorProps> = ({ x, y, moreActive }) => {
  const AMBER_ARC_MAX = 3480;
  const GREEN_ARC_MIN = 4872;
  const GREEN_ARC_MAX = 5300;

  const GAUGE_MIN = 0;
  const GAUGE_MAX = 5;
  const GAUGE_RADIUS = 50;
  const GAUGE_START = 270;
  const GAUGE_END = 90;

  const AMBER_ARC_MAX_ANGLE = (GAUGE_START + ((GAUGE_START - GAUGE_END) * AMBER_ARC_MAX) / (GAUGE_MAX * 1000)) % 360;
  const GREEN_ARC_MIN_ANGLE = (GAUGE_START + ((GAUGE_START - GAUGE_END) * GREEN_ARC_MIN) / (GAUGE_MAX * 1000)) % 360;
  const GREEN_ARC_MAX_ANGLE = (GAUGE_START + ((GAUGE_START - GAUGE_END) * GREEN_ARC_MAX) / (GAUGE_MAX * 1000)) % 360;

  const gaugeMarkerClassName = 'White SW3';
  const gaugeMarkerTextClassName = 'White F24';

  return (
    <g id="wing-accu" transform={`translate(${x} ${y})`} visibility={moreActive ? 'visible' : 'hidden'}>
      <GaugeComponent
        x={0}
        y={0}
        radius={GAUGE_RADIUS}
        startAngle={GAUGE_START}
        endAngle={GAUGE_END}
        visible
        className="SW2 White NoFill"
      >
        <GaugeComponent
          x={0}
          y={0}
          radius={GAUGE_RADIUS - 2}
          startAngle={GAUGE_START}
          endAngle={AMBER_ARC_MAX_ANGLE}
          largeArc={0}
          visible
          className="SW6 Amber NoFill"
        >
          <GaugeComponent
            x={0}
            y={0}
            radius={GAUGE_RADIUS - 2}
            startAngle={GREEN_ARC_MIN_ANGLE}
            endAngle={GREEN_ARC_MAX_ANGLE}
            visible
            className="SW6 Green NoFill"
          >
            {/* 0 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MIN}
              max={GAUGE_MAX}
              value={0}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_START}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              textNudgeX={-28}
              textNudgeY={9}
              multiplierInner={0.75}
              showValue
              bold
            />
            {/* 2500 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MIN}
              max={GAUGE_MAX}
              value={2.5}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_START}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              multiplierInner={0.75}
              bold
            />
            {/* 5000 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MIN}
              max={GAUGE_MAX}
              value={5}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_START}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              showValue
              textNudgeX={30}
              textNudgeY={9}
              multiplierInner={0.75}
              bold
            />

            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MIN}
              radius={GAUGE_RADIUS}
              max={GAUGE_MAX}
              startAngle={GAUGE_START}
              endAngle={GAUGE_END}
              value={4.8}
              className="SW6 Green LineRound"
              multiplierInner={0.8}
              multiplierOuter={1.2}
              indicator
              halfIndicator
            />
          </GaugeComponent>
        </GaugeComponent>
      </GaugeComponent>

      <text className="F22 White LS1" x={-27} y={-1}>
        WING
      </text>
      <text className="F22 White LS1" x={-29} y={21}>
        ACCU
      </text>
      <text className="F22 Cyan WS-8" x={-62} y={44}>
        X 1000 PSI
      </text>
    </g>
  );
};
