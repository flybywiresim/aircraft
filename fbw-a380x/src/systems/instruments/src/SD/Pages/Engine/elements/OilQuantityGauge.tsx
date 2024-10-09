import React, { FC } from 'react';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';

interface OilQuantityGaugeProps {
  x: number;
  y: number;
  engine: number;
  active: boolean;
  value: number;
}

const OilQuantityGauge: FC<OilQuantityGaugeProps> = ({ x, y, engine, active, value }) => {
  const radius = 53;
  const startAngle = -90;
  const endAngle = 90;
  const min = 0;
  const max = 19.3; // TODO maximum should be 18.3 but values as high as 19.0 are appearing in current model

  return (
    <g id={`OilQuantityGauge-${engine}`}>
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
        {!active && (
          <text x={x} y={y - 4} className="Amber F29 MiddleAlign">
            XX
          </text>
        )}
        {active && (
          <>
            <GaugeMarkerComponent
              value={min}
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
              value={3.7}
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
              value={max / 2}
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
              value={max}
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
              value={value}
              x={x}
              y={y}
              min={min}
              max={max}
              radius={radius}
              startAngle={startAngle}
              endAngle={endAngle}
              className="GaugeIndicator Gauge LineRound SW4"
              indicator
              halfIndicator
              multiplierInner={0.8}
              multiplierOuter={1.2}
            />
          </>
        )}
      </GaugeComponent>
    </g>
  );
};

export default OilQuantityGauge;
