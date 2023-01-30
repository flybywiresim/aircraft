import React from 'react';
import { GaugeComponent, GaugeMarkerComponent, GaugeMaxComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';

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
        <Layer x={x} y={y} id={`EGT-indicator-${engine}`}>
            {!active
                    && (
                        <>
                            <GaugeComponent x={0} y={0} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent GaugeInactive" />
                            <text className="Large End Amber" x={20} y={6}>XX</text>
                        </>
                    )}
            {active && (
                <>
                    <text className={`Large End ${EGTColour}`} x={35} y={6}>{Math.round(EGTemperature)}</text>
                    <GaugeComponent x={0} y={0} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                        <GaugeComponent x={0} y={0} radius={radius} startAngle={endAngle - 20} endAngle={endAngle} visible className="GaugeComponent Gauge RedLine" />
                        <GaugeMarkerComponent
                            value={min}
                            x={0}
                            y={0}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className="GaugeText Gauge Medium"
                        />
                        <GaugeMarkerComponent value={600} x={0} y={0} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge" />
                        <GaugeMarkerComponent value={max} x={0} y={0} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Gauge RedLine" />
                        <GaugeMarkerComponent
                            value={modeEGTMax}
                            x={0}
                            y={0}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className="GaugeThrustLimitIndicator Gauge"
                        />
                        <GaugeMaxComponent
                            value={modeEGTMax}
                            x={0}
                            y={0}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className="GaugeThrustLimitIndicatorFill Gauge"
                        />
                        <rect x={-34} y={-16} width={69} height={24} className="DarkGreyBox" />
                        <GaugeMarkerComponent
                            value={EGTemperature}
                            x={0}
                            y={0}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className={`GaugeIndicator Gauge ${EGTColour}`}
                            multiplierInner={0.6}
                            multiplierOuter={1.08}
                            indicator
                            halfIndicator
                            roundLinecap
                        />
                    </GaugeComponent>
                </>
            )}
        </Layer>
    );
};

export default EGT;
