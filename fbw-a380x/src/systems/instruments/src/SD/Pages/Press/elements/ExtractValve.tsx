import { GaugeMarkerComponent } from '@instruments/common/gauges';
import React from 'react';

interface ExtractValveProps {
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  radius: number;
  css?: string;
  circleCss?: string;
  startAngle?: number;
  endAngle?: number;
}

const ExtractValve: React.FC<ExtractValveProps> = ({
  x,
  y,
  value,
  min,
  max,
  radius,
  css = 'Green Line',
  circleCss = 'Green SW3 BackgroundFill',
  startAngle = 90,
  endAngle = 180,
}) => (
  <>
    <GaugeMarkerComponent
      value={value}
      x={x}
      y={y}
      min={min}
      max={max}
      radius={radius}
      startAngle={startAngle}
      endAngle={endAngle}
      className={css}
      indicator
      multiplierOuter={1}
    />
    <circle className={circleCss} cx={x} cy={y} r={4} />
  </>
);

export default ExtractValve;
