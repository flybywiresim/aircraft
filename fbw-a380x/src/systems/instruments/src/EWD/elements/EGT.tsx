import React from 'react';
import { GaugeComponent, GaugeMarkerComponent, GaugeMaxEGTComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { EGTProps } from '@instruments/common/types';

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

const EGT: React.FC<EGTProps> = ({ x, y, engine, active }) => {
    const [EGTemperature] = useSimVar(`L:A32NX_ENGINE_EGT:${engine}`, 'celsius');
    const radius = 68;
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
                            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className='GaugeComponent WhiteLine SW2' />
                            <text className='F26 End Amber' x={x + 17} y={y + 11.7}>XX</text>
                        </>
                    )}
                {active && (
                    <>
                        <text className={`Large End ${EGTColour}`} x={x + 33} y={y + 11.7}>{Math.round(EGTemperature)}</text>
                        <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className='GaugeComponent Gauge'>
                            <GaugeComponent x={x} y={y} radius={radius - 2} startAngle={endAngle - 20} endAngle={endAngle} visible className='GaugeComponent Gauge ThickRedLine' />
                            <GaugeMarkerComponent
                                value={min}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge Medium'
                            />
                            <GaugeMarkerComponent value={600} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className='GaugeText Gauge' />
                            <GaugeMarkerComponent value={max} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className='GaugeText Gauge RedLine' />
                            <GaugeMaxEGTComponent
                                value={modeEGTMax}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeThrustLimitIndicatorFill Gauge'
                            />
                            <rect x={x - 36} y={y - 11} width={72} height={26} className='DarkGreyBox' />
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
                                multiplierInner={0.75}
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
