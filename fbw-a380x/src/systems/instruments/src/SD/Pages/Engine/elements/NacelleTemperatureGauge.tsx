import React, { FC } from 'react';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';

interface NacelleTemperatureGaugeProps {
  x: number;
  y: number;
  engine: number;
  active: boolean;
  value: number;
}

const NacelleTemperatureGauge: FC<NacelleTemperatureGaugeProps> = ({ x, y, engine, active, value }) => {
  const radius = 45;
  const startAngle = -90;
  const endAngle = 90;
  const min = 0;
  const max = 500;

  return (
    <g id={`NacelleTemperatureGauge-${engine}`}>
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
        {!active && (
          <text x={x} y={y - 4} className="Amber F29 MiddleAlign">
            XX
          </text>
        )}
        {active && (
          <>
            <GaugeMarkerComponent
              value={300}
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
              multiplierInner={0.6}
              multiplierOuter={1.25}
            />
          </>
        )}
      </GaugeComponent>
      {engine === 1 && (
        <text x={x - 50} y={y + 29} className="White F21">
          0
        </text>
      )}
      {engine === 4 && (
        <text x={x + 15} y={y + 29} className="White F21">
          500
        </text>
      )}
      {engine === 2 && (
        <>
          <text x={x + 180} y={y - 36} className="F25 EndAlign White">
            NAC
          </text>
          <text x={x + 170} y={y - 10} className="F25 EndAlign Cyan">
            °C
          </text>
        </>
      )}
    </g>
  );
};

export default NacelleTemperatureGauge;
