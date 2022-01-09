import {
    GaugeComponent,
    GaugeMarkerComponent, splitDecimals, GaugeMaxComponent, ThrottlePositionDonutComponent, valueRadianAngleConverter,
} from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type N1Props = {
    engine: 1 | 2,
    x: number,
    y: number,
    active: boolean,
};

const N1: React.FC<N1Props> = ({ x, y, engine, active }) => {
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const N1PercentSplit = splitDecimals(N1Percent);

    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);
    const [throttlePosition] = useSimVar(`L:A32NX_AUTOTHRUST_TLA_N1:${engine}`, 'number', 100);
    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT', 'number', 100);

    const availVisible = !!(N1Percent > Math.floor(N1Idle) && engineState === 2); // N1Percent sometimes does not reach N1Idle by .005 or so
    const [revVisible] = useSimVar(`L:A32NX_AUTOTHRUST_REVERSE:${engine}`, 'bool', 500);
    // Reverse cowl > 5% is treated like fully open, otherwise REV will not turn green for idle reverse
    const [revDoorOpenPercentage] = useSimVar(`A:TURB ENG REVERSE NOZZLE PERCENT:${engine}`, 'percent', 100);
    const availRevVisible = availVisible || revVisible;
    const availRevText = availVisible ? 'AVAIL' : 'REV';

    const radius = 64;
    const startAngle = 220;
    const endAngle = 70;
    const min = 1.5;
    const max = 11;

    return (
        <>
            <g id={`N1-indicator-${engine}`}>
                {!active
                    && (
                        <>
                            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent GaugeInactive" />
                            <AvailRev x={x} y={y} mesg={availRevText} visible={availRevVisible} active={active} revDoorOpen={revDoorOpenPercentage} />
                            <text className="Medium End Amber Spread" x={x + 45} y={y + 45}>XX</text>
                        </>
                    )}
                {active
                && (
                    <>
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
                            {/* N1 max limit  */}
                            <GaugeMarkerComponent
                                value={Math.abs(N1ThrustLimit / 10)}
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
                                value={Math.abs(N1ThrustLimit / 10)}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeThrustLimitIndicatorFill Gauge"
                            />
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
                            <AvailRev x={x} y={y} mesg={availRevText} visible={availRevVisible} active={active} revDoorOpen={revDoorOpenPercentage} />
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

                    </>
                )}
            </g>
        </>
    );
};

export default N1;

type AvailRevProps = {
    x: number,
    y: number,
    mesg: string,
    visible: boolean,
    active: boolean,
    revDoorOpen: number,
};

const AvailRev: React.FC<AvailRevProps> = ({ x, y, mesg, visible, active, revDoorOpen }) => (
    <>
        <g className={visible || !active ? 'Show' : 'Hide'}>
            <rect x={x - 19} y={y - 13} width={96} height={32} className="DarkGreyBox BackgroundFill" />
            {mesg === 'REV'
            && <text className={`Large End Spread ${active && Math.round(revDoorOpen) > 5 ? 'Green' : 'Amber'}`} x={active ? x + 60 : x + 50} y={y + 13}>{active ? 'REV' : 'XX'}</text>}
            {mesg === 'AVAIL'
            && <text className="Large End Spread Green" x={x + 74} y={y + 13}>AVAIL</text>}
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
        className="GreenLine"
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
