import React from 'react';
import { GaugeComponent, GaugeMarkerComponent, GaugeMaxComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';

const getModeEGTMax = () => {
    const [throttleMode] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', 'number', 500);
    const [togaWarning] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', 'boolean', 500);

    switch (throttleMode) {
    case 4:
        return togaWarning ? 1060 : 1025;

    case 1:
    case 2:
    case 3:
    case 5:
        return 1025;

    default:
        return 750;
    }
};

const warningEGTColor = (EGTemperature: number) => {
    if (EGTemperature > 1060) {
        return 'Red';
    }
    if (EGTemperature > getModeEGTMax()) {
        return 'Amber';
    }
    return 'Green';
};

type EGTProps = {
    engine: 1 | 2,
    x: number,
    y: number,
    active: boolean,
};

const EGT: React.FC<EGTProps> = ({ x, y, engine, active }) => {
    const [EGTemperature] = useSimVar(`L:A32NX_ENGINE_EGT:${engine}`, 'celsius', 100);
    const radius = 61;
    const startAngle = 270;
    const endAngle = 90;
    const min = 0;
    const max = 1200;

    const modeEGTMax = getModeEGTMax();
    const EGTColour = warningEGTColor(EGTemperature);

    return (
        <>
            <g id={`EGT-indicator-${engine}`}>
                {!active
                    && (
                        <>
                            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent GaugeInactive" />
                            <text className="Large End Amber" x={x + 20} y={y + 7.7}>XX</text>
                        </>
                    )}
                {active && (
                    <>
                        <text className={`Large End ${EGTColour}`} x={x + 33} y={y + 7.7}>{Math.round(EGTemperature)}</text>
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
                            <GaugeMarkerComponent
                                value={modeEGTMax}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeThrustLimitIndicator Gauge"
                            />
                            <GaugeMaxComponent
                                value={modeEGTMax}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeThrustLimitIndicatorFill Gauge"
                            />
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
                                className={`GaugeIndicator Gauge ${EGTColour}`}
                                multiplierInner={0.6}
                                indicator
                                halfIndicator
                            />
                        </GaugeComponent>
                    </>
                )}
            </g>
        </>
    );
};

export default EGT;
