import React, { FC } from 'react';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';

interface OilPressureGaugeProps {
  x: number;
  y: number;
  engine: number;
  active: boolean;
}

const OilPressureGauge: FC<OilPressureGaugeProps> = ({ x, y, engine, active }) => {
  const [engineOilPressure] = useSimVar(`ENG OIL PRESSURE:${engine}`, 'psi', 100);
  const radius = 45;
  const startAngle = -90;
  const endAngle = 90;
  const min = 0;
  const max = 500;

  const needleValue =
    engineOilPressure <= 100 ? (225 / 100) * engineOilPressure : 225 + (225 / 400) * engineOilPressure;

  return (
    <g id={`OilPressureGauge-${engine}`}>
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
            <GaugeComponent
              x={x}
              y={y}
              radius={radius - 1}
              startAngle={startAngle}
              endAngle={startAngle + 22}
              visible
              className="GaugeComponent Gauge SW6RedLine"
            />
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
              value={250}
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
              value={Math.round(needleValue)}
              x={x}
              y={y}
              min={min}
              max={max}
              radius={radius}
              startAngle={startAngle}
              endAngle={endAngle}
              className={`${engineOilPressure < 25 ? 'RedGaugeIndicator ' : 'GaugeIndicator '} Gauge LineRound SW4 `}
              indicator
              halfIndicator
              multiplierInner={0.8}
              multiplierOuter={1.2}
            />
          </>
        )}
      </GaugeComponent>
      {active && (
        <text x={x + 28} y={y} className={`${engineOilPressure < 25 ? 'Red' : 'Green'} EndAlign F29`}>
          {engineOilPressure < 0 ? 0 : Math.round(engineOilPressure)}
        </text>
      )}
    </g>
  );
};

export default OilPressureGauge;
