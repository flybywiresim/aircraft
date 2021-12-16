import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
// import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type N1Props = {
    engine: 1 | 2,
    x: number,
    y: number,

};

const N1: React.FC<N1Props> = ({ x, y, engine }) => {
    const radius = 50;
    const startAngle = 220;
    const endAngle = 70;
    const min = 1.5;
    const max = 11;

    return (
        <>
            <g id={`N1-indicator-${engine}`}>
                <text className="Large End Green" x={x + 33} y={y + 35}>0</text>
                <text className="Large End Green" x={x + 42} y={y + 35}>.</text>
                <text className="Medium End Green" x={x + 55} y={y + 35}>0</text>
                <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                    <GaugeComponent x={x} y={y} radius={radius} startAngle={50} endAngle={endAngle} visible className="GaugeComponent Gauge Red" />
                    <GaugeMarkerComponent
                        value={5}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Medium"
                        showValue
                        textNudgeY={5}
                        textNudgeX={10}
                    />
                    <GaugeMarkerComponent value={6} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={7} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={8} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={9} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent
                        value={10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Medium"
                        showValue
                        textNudgeY={5}
                        textNudgeX={-10}
                    />
                    <GaugeMarkerComponent value={11} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Red" />
                    <GaugeMarkerComponent
                        value={4}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeIndicator"
                        indicator
                    />
                </GaugeComponent>
            </g>
        </>
    );
};

export default N1;
