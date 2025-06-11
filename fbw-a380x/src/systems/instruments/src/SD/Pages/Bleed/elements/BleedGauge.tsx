import React, { FC } from 'react';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import Valve from './Valve';

interface BleedGaugeProps {
  x: number;
  y: number;
  engine: number;
  sdacDatum: boolean;
  packValveOpen: boolean;
  packFlowRate: number;
}

const BleedGauge: FC<BleedGaugeProps> = ({ x, y, engine, sdacDatum, packValveOpen, packFlowRate }) => {
  const radius = 41;
  const startAngle = -90;
  const endAngle = 90;
  const min = 0;
  const max = 1;

  return (
    <g id={`BleedGauge-${engine}`} style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      {/* Flow control valve */}
      <Valve
        x={0}
        y={0}
        radius={19.5}
        css={`
          ${packValveOpen ? 'Green' : 'Amber'} Line NoFill
        `}
        position={packValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />

      <path
        className={`${packValveOpen ? 'Green' : 'Amber'} Line NoFill`}
        d={`M-1,-51 l 0,-13 l ${engine % 2 === 0 ? '-' : ''}69, 0`}
      />

      {/* Pack inlet flow */}
      <GaugeComponent
        x={0}
        y={0}
        radius={radius}
        startAngle={startAngle}
        endAngle={endAngle}
        visible
        className="White SW2 NoFill"
      >
        <GaugeMarkerComponent
          value={0}
          x={0}
          y={0}
          min={min}
          max={max}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="White SW2"
          showValue={false}
        />
        <GaugeMarkerComponent
          value={0.5}
          x={0}
          y={0}
          min={min}
          max={max}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="White SW2"
          showValue={false}
        />
        <GaugeMarkerComponent
          value={1}
          x={0}
          y={0}
          min={min}
          max={max}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="White SW2"
          showValue={false}
        />
        {sdacDatum && (
          <GaugeMarkerComponent
            // value={packInletFlowPercentage < 80 ? 80 : packInletFlowPercentage}
            value={packFlowRate}
            x={0}
            y={0}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeIndicator Gauge LineRound"
            indicator
            halfIndicator
            multiplierInner={0.47}
            multiplierOuter={1.15}
          />
        )}
      </GaugeComponent>
    </g>
  );
};

export default BleedGauge;
