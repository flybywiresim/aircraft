import { GaugeComponent, GaugeMarkerComponent, ThrottlePositionDonutComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position } from '@instruments/common/types';
import React from 'react';

export const CabAlt: React.FC<Position> = ({ x, y }) => {
    const [cabinAlt] = useSimVar('L:A32NX_PRESS_CABIN_ALTITUDE', 'feet', 500);
    const cabAlt50 = Math.round(cabinAlt / 50) * 50;

    const [cabManMode] = useSimVar('L:A32NX_CAB_PRESS_MODE_MAN', 'bool', 500);

    const radius = 87;
    const startAngle = 212;
    const endAngle = 89;
    const maxValue = 12.5;

    return (
        <g id="DeltaPressure">
            <text className="F29 LS1 Center Green" x={x - 117} y={y - 142}>{!cabManMode ? 'AUTO' : 'MAN'}</text>
            <text className="F29 LS1 Center White" x={x - 26} y={y - 142}>CAB ALT</text>
            <text className="F24 Center Cyan" x={x - 10} y={y - 105}>FT</text>
            <text className={`F35 EndAlign ${cabAlt50 >= 9550 ? 'Red' : 'Green'}`} x={x + 108} y={y + 66}>
                {cabAlt50}
            </text>
            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="Gauge">
                <GaugeComponent x={x} y={y} radius={radius - 2} startAngle={endAngle - 50} endAngle={endAngle} visible className="GaugeComponent Gauge ThickRedLine" />
                <text className="GaugeText" x={x + 45} y={y + 6}>17</text>
                <GaugeMarkerComponent
                    value={12.5}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="Gauge"
                    textNudgeY={15}
                    textNudgeX={-3}
                />
                <GaugeMarkerComponent
                    value={10}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="GaugeText"
                    showValue
                    textNudgeY={14}
                    textNudgeX={-3}
                />
                <GaugeMarkerComponent
                    value={7.5}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="Gauge"
                />
                <GaugeMarkerComponent
                    value={5}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    showValue
                    className="GaugeText"
                    textNudgeX={13}
                    textNudgeY={12}
                />
                <GaugeMarkerComponent
                    value={2.5}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="Gauge"
                />
                <GaugeMarkerComponent
                    value={0}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="GaugeText"
                    showValue
                    textNudgeY={-4}
                    textNudgeX={7}
                />
                <GaugeMarkerComponent
                    value={cabAlt50 / 1000}
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className={`GaugeIndicator SW4 ${cabAlt50 < -0.4 || cabAlt50 >= 8.5 ? 'Amber' : ''}`}
                    indicator
                    multiplierOuter={1.01}
                />
                <ThrottlePositionDonutComponent
                    value={cabAlt50 / 1000} // TODO: Change this once we have cabin altitude target modelled
                    x={x}
                    y={y}
                    min={-0.6}
                    max={maxValue}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className={`SW3 NoFill ${!cabManMode ? 'Magenta' : 'Cyan'}`}
                    outerMultiplier={1.1}
                    donutRadius={6}
                />
            </GaugeComponent>
        </g>
    );
};

export default CabAlt;
