import { GaugeComponent, GaugeMarkerComponent, splitDecimals, ThrottlePositionDonutComponent, valueRadianAngleConverter } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position, EngineNumber, FadecActive, n1Degraded } from '@instruments/common/types';
import React from 'react';

const N1: React.FC<Position & EngineNumber & FadecActive & n1Degraded> = ({ x, y, engine, active, n1Degraded }) => {
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
    const N1PercentSplit = splitDecimals(N1Percent);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const [throttlePosition] = useSimVar(`L:A32NX_AUTOTHRUST_TLA_N1:${engine}`, 'number', 100);

    const radius = 64;
    const startAngle = 230;
    const endAngle = 90;
    const min = 2;
    const max = 11.1;

    const xDegraded = x + 2;

    return (
        <>
            <g id={`N1-indicator-${engine}`}>
                {!active
                    && (
                        <>
                            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className='GaugeComponent SW2 WhiteLine' />
                            <text className='F26 End Amber Spread' x={x + 48} y={y + 45}>XX</text>
                        </>
                    )}
                {active && !n1Degraded
                && (
                    <>
                        <text className='F26 End Green' x={x + 6} y={y + 45}>{N1PercentSplit[0]}</text>
                        <text className='F26 End Green' x={x + 20} y={y + 45}>.</text>
                        <text className='F20 End Green' x={x + 36} y={y + 45}>{N1PercentSplit[1]}</text>
                    </>
                )}
                {active && n1Degraded
                && (
                    <>
                        <text className='F26 End Green' x={xDegraded + 46} y={y + 45}>{N1PercentSplit[0]}</text>
                        <text className='F26 End Green' x={xDegraded + 60} y={y + 45}>.</text>
                        <text className='F20 End Green' x={xDegraded + 76} y={y + 45}>{N1PercentSplit[1]}</text>
                        <GaugeComponent x={xDegraded} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className='GaugeComponent Gauge'>
                            <GaugeComponent x={xDegraded} y={y} radius={radius - 2} startAngle={endAngle - 24} endAngle={endAngle} visible className='GaugeComponent Gauge ThickRedLine' />
                            <GaugeMarkerComponent
                                value={2}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge'
                                showValue
                                textNudgeY={-5}
                                textNudgeX={13}
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={4}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge'
                                textNudgeY={6}
                                textNudgeX={13}
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={6}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge'
                                showValue
                                textNudgeX={7}
                                textNudgeY={11}
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={8}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge'
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={10}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeText Gauge'
                                showValue
                                textNudgeY={0}
                                textNudgeX={-13}
                                multiplierInner={0.9}
                            />
                            <rect x={xDegraded - 13} y={y + 19} width={96} height={30} className='DarkGreyBox' />
                            <GaugeMarkerComponent
                                value={N1Percent <= N1Idle ? N1Idle / 10 : N1Percent / 10}
                                x={xDegraded}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='GaugeIndicator Gauge'
                                multiplierOuter={1.10}
                                indicator
                            />
                        </GaugeComponent>
                        <N1CommandAndTrend
                            N1Actual={N1Percent <= N1Idle ? N1Idle / 10 : N1Percent / 10}
                            x={xDegraded}
                            y={y}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            engine={engine}
                        />
                        <ThrottlePositionDonutComponent
                            value={throttlePosition < 0.3 ? 0.3 : throttlePosition / 10}
                            x={xDegraded}
                            y={y}
                            min={min}
                            max={max}
                            radius={radius}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className='DonutThrottleIndicator'
                        />

                    </>
                )}
            </g>
        </>
    );
};

export default N1;

interface N1CommandAndTrendProps {
    x: number,
    y: number,
    radius: number,
    N1Actual: number,
    startAngle,
    endAngle,
    min: number,
    max: number,
    engine: 1 | 2 | 3 | 4
}

const N1CommandAndTrend: React.FC<N1CommandAndTrendProps> = ({ x, y, radius, startAngle, endAngle, min, max, N1Actual, engine }) => {
    const [N1Commanded] = useSimVar(`L:A32NX_AUTOTHRUST_N1_COMMANDED:${engine}`, 'number', 100);
    const [autothrustStatus] = useSimVar('L:A32NX_AUTOTHRUST_STATUS', 'enum', 100);

    const n1ActualXY = valueRadianAngleConverter({ value: N1Actual, min, max, endAngle, startAngle, perpendicular: true });
    const n1CommandXY = valueRadianAngleConverter({ value: N1Commanded / 10, min, max, endAngle, startAngle, perpendicular: true });

    const n1CommandPlusArrow = valueRadianAngleConverter({
        value: N1Commanded / 10,
        min,
        max,
        endAngle: (N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1CommandXY.angle + 20),
        startAngle: (N1Actual > (N1Commanded / 10) ? n1CommandXY.angle - 24 : n1CommandXY.angle),
        perpendicular: false,
    });

    const n1CommandArrow = valueRadianAngleConverter({ value: N1Commanded / 10, min, max, endAngle, startAngle, perpendicular: false });
    const n1ActualArrowXY = {
        x: x + (n1CommandPlusArrow.x * radius * 0.50),
        y: y + (n1CommandPlusArrow.y * radius * 0.50),
    };
    const n1CommandArrowXY = {
        x: x + (n1CommandArrow.x * radius * 0.50), // Based on 20 degree angle and hypotenuse of 0.5
        y: y + (n1CommandArrow.y * radius * 0.50),
    };

    // console.log(Math.abs(N1Actual - (N1Commanded / 10)));

    const radiusDivide = radius / 5;
    const commandAndTrendRadius = [radius - radiusDivide, radius - (2 * radiusDivide), radius - (3 * radiusDivide), radius - (4 * radiusDivide)];
    const N1CommandArray : any[] = [];
    commandAndTrendRadius.forEach((commandradius) => N1CommandArray.push(<GaugeComponent
        x={x}
        y={y}
        radius={radius - commandradius}
        startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
        endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
        visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
        className='GreenLine'
    />));

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
                    multiplierOuter={0.51}
                    className={`GreenLine ${autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3 ? 'Show' : 'Hide'}`}
                    indicator
                />
                <line
                    x2={n1ActualArrowXY.x}
                    y2={n1ActualArrowXY.y}
                    x1={n1CommandArrowXY.x}
                    y1={n1CommandArrowXY.y}
                    className={`GreenLine ${autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3 ? 'Show' : 'Hide'}`}
                />
                {N1CommandArray}
            </g>
        </>
    );
};
