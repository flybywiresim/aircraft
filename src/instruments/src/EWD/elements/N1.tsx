import { GaugeComponent, GaugeMarkerComponent, splitDecimals, GaugeMaxComponent, ThrottlePositionDonutComponent, valueRadianAngleConverter } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type N1Props = {
    engine: 1 | 2,
    x: number,
    y: number,

};

const N1: React.FC<N1Props> = ({ x, y, engine }) => {
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const N1PercentSplit = splitDecimals(N1Percent);

    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);
    const [throttlePosition] = useSimVar(`L:A32NX_AUTOTHRUST_TLA_N1:${engine}`, 'number', 100);
    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT', 'number', 100);

    const availVisible = !!(N1Percent > Math.floor(N1Idle) && engineState === 2); // N1Percent sometimes does not reach N1Idle by .005 or so

    const radius = 64;
    const startAngle = 220;
    const endAngle = 70;
    const min = 1.5;
    const max = 11;

    return (
        <>
            <g id={`N1-indicator-${engine}`}>
                <text className="Large End Green" x={x + 40} y={y + 45}>{N1PercentSplit[0]}</text>
                <text className="Large End Green" x={x + 54} y={y + 45}>.</text>
                <text className="Medium End Green" x={x + 70} y={y + 45}>{N1PercentSplit[1]}</text>
                <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                    <GaugeComponent x={x} y={y} radius={radius} startAngle={endAngle - 20} endAngle={endAngle} visible className="GaugeComponent Gauge Red" />
                    <GaugeMarkerComponent
                        value={5}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge Medium"
                        showValue
                        textNudgeY={6}
                        textNudgeX={13}
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={6}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge"
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={7}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge"
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={8}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge"
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={9}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge"
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge Medium"
                        showValue
                        textNudgeY={6}
                        textNudgeX={-13}
                        multiplierInner={0.9}
                    />
                    <GaugeMarkerComponent
                        value={11}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Gauge Red"
                        multiplierInner={0.9}
                    />
                    <rect x={x - 19} y={y + 19} width={96} height={30} className="DarkGreyBox" />
                    <GaugeMarkerComponent
                        value={N1Percent <= N1Idle ? N1Idle / 10 : N1Percent / 10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeIndicator Gauge"
                        indicator
                    />
                    {/* N1 max limit  */}
                    <GaugeMarkerComponent
                        value={N1ThrustLimit / 10}
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
                        value={N1ThrustLimit / 10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeThrustLimitIndicatorFill Gauge"
                    />
                    <Avail x={x} y={y} visible={availVisible} />
                    <N1CommandAndTrend
                        N1Actual={N1Percent <= N1Idle ? N1Idle / 10 : N1Percent / 10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        engine={engine}
                    />
                </GaugeComponent>
                {/* Throttle */}
                <ThrottlePositionDonutComponent
                    value={throttlePosition / 10}
                    x={x}
                    y={y}
                    min={min}
                    max={max}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="DonutThrottleIndicator"
                />
            </g>
        </>
    );
};

export default N1;

type AvailProps = {
    x: number,
    y: number,
    visible: boolean,

};

const Avail: React.FC<AvailProps> = ({ x, y, visible }) => (
    <>
        <g className={visible ? 'Show' : 'Hide'}>
            <rect x={x - 19} y={y - 13} width={96} height={32} className="DarkGreyBox BackgroundFill" />
            <text className="Large End Green Spread" x={x + 74} y={y + 13}>AVAIL</text>
        </g>
    </>
);

type N1CommandAndTrendProps = {
    x: number,
    y: number,
    radius: number,
    N1Actual: number,
    startAngle,
    endAngle,
    min: number,
    max: number,
    engine: 1 | 2,
}

const N1CommandAndTrend: React.FC<N1CommandAndTrendProps> = ({ x, y, radius, startAngle, endAngle, min, max, N1Actual, engine }) => {
    const [N1Commanded] = useSimVar(`L:A32NX_AUTOTHRUST_N1_COMMANDED:${engine}`, 'number', 100);
    const [autothrustStatus] = useSimVar('L:A32NX_AUTOTHRUST_STATUS', 'enum', 100);

    const n1ActualXY = valueRadianAngleConverter({ value: N1Actual, min, max, endAngle, startAngle, perpendicular: true });
    const n1CommandXY = valueRadianAngleConverter({ value: N1Commanded / 10, min, max, endAngle, startAngle, perpendicular: true });

    // console.log(Math.abs(N1Actual - (N1Commanded / 10)));

    const radiusDivide = radius / 5;
    const commandAndTrendRadius = [radius - radiusDivide, radius - (2 * radiusDivide), radius - (3 * radiusDivide), radius - (4 * radiusDivide)];

    return (
        <>
            <g>
                <GaugeMarkerComponent
                    value={N1Commanded / 10}
                    x={x}
                    y={y}
                    min={min}
                    max={max}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    multiplierOuter={0.8}
                    className={`GreenLine ${autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3 ? 'Show' : 'Hide'}`}
                    indicator
                />
                <GaugeMarkerComponent
                    value={N1Commanded / 10}
                    x={x}
                    y={y}
                    min={min}
                    max={max}
                    radius={radius}
                    startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle - 20 : n1CommandXY.angle}
                    endAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1CommandXY.angle + 20}
                    multiplierOuter={0.5}
                    className={`GreenLine ${autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3 ? 'Show' : 'Hide'}`}
                    indicator
                />
                <GaugeComponent
                    x={x}
                    y={y}
                    radius={radius - commandAndTrendRadius[0]}
                    startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
                    endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
                    visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
                    className="GreenLine"
                />
                <GaugeComponent
                    x={x}
                    y={y}
                    radius={radius - commandAndTrendRadius[1]}
                    startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
                    endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
                    visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
                    className="GreenLine"
                />
                <GaugeComponent
                    x={x}
                    y={y}
                    radius={radius - commandAndTrendRadius[2]}
                    startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
                    endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
                    visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
                    className="GreenLine"
                />
                <GaugeComponent
                    x={x}
                    y={y}
                    radius={radius - commandAndTrendRadius[3]}
                    startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
                    endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
                    visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
                    className="GreenLine"
                />
            </g>
        </>
    );
};
