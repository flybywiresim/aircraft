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
  const radius = 39;
  const startAngle = -90;
  const endAngle = 90;
  const min = 0;
  const max = 1;

  return (
    <g id={`BleedGauge-${engine}`}>
      {/* Pack inlet flow */}
      <GaugeComponent
        x={x}
        y={y}
        radius={radius}
        startAngle={startAngle}
        endAngle={endAngle}
        visible
        className="GaugeComponent Gauge"
      >
        <GaugeMarkerComponent
          value={0}
          x={x}
          y={y}
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
          x={x}
          y={y}
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
          x={x}
          y={y}
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
            x={x}
            y={y}
            min={min}
            max={max}
            radius={radius}
            startAngle={startAngle}
            endAngle={endAngle}
            className="GaugeIndicator Gauge LineRound"
            indicator
            multiplierOuter={1.1}
          />
        )}
      </GaugeComponent>

      {/* Flow control valve */}
      <Valve x={x} y={y} radius={19} css="BackgroundFill Background" position="H" sdacDatum={sdacDatum} />
      <Valve
        x={x}
        y={y}
        radius={19}
        css={`
          ${packValveOpen ? 'Green' : 'Amber'} Line
        `}
        position={packValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />

      <path
        className={`${packValveOpen ? 'Green' : 'Amber'} Line`}
        d={`M${x},${y - 49} l 0,-12 l ${engine % 2 === 0 ? '-' : ''}67, 0`}
      />
    </g>
  );
};

export default BleedGauge;
