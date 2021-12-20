import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type EGTProps = {
    engine: 1 | 2,
    x: number,
    y: number,

};

const EGT: React.FC<EGTProps> = ({ x, y, engine }) => {
    const [EGTemperature] = useSimVar(`L:A32NX_ENGINE_EGT:${engine}`, 'celsius', 100);
    const radius = 48;
    const startAngle = 270;
    const endAngle = 90;
    const min = 0;
    const max = 1200;

    return (
        <>
            <g id={`EGT-indicator-${engine}`}>
                <text className="Large End Green" x={x + 26} y={y + 6}>{Math.round(EGTemperature)}</text>
                <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                    <GaugeComponent x={x} y={y} radius={radius} startAngle={endAngle - 20} endAngle={endAngle} visible className="GaugeComponent Gauge Red" />
                    <GaugeMarkerComponent
                        value={min}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Medium"
                    />
                    <GaugeMarkerComponent value={600} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge" />
                    <GaugeMarkerComponent value={max} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge Red" />
                    <rect x={x - 28} y={y - 12} width={56} height={20} className="darkGreyBox" />
                    <GaugeMarkerComponent
                        value={EGTemperature}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeIndicator Gauge"
                        multiplierInner={0.6}
                        indicator
                        halfIndicator
                    />
                </GaugeComponent>

            </g>
        </>
    );
};

export default EGT;
