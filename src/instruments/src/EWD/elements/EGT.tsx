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
    const radius = 61;
    const startAngle = 270;
    const endAngle = 90;
    const min = 0;
    const max = 1200;

    return (
        <>
            <g id={`EGT-indicator-${engine}`}>
                <text className="Large End Green" x={x + 33} y={y + 7.7}>{Math.round(EGTemperature)}</text>
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
                        className="GaugeText Gauge Medium"
                    />
                    <GaugeMarkerComponent value={600} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge" />
                    <GaugeMarkerComponent value={max} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge Red" />
                    <rect x={x - 36} y={y - 15} width={72} height={26} className="DarkGreyBox" />
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

// getModeEGTMax() {
//     switch (this.throttleMode) {
//         case 4:
//             return this.timerTOGA > 0 ? 1060 : 1025;

//         case 1:
//         case 2:
//         case 3:
//         case 5:
//             return 1025;

//         default:
//             return 750;
//     }
// }
