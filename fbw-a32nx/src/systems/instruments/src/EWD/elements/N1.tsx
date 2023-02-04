import {
    GaugeComponent,
    GaugeMarkerComponent, splitDecimals, GaugeMaxComponent, ThrottlePositionDonutComponent, valueRadianAngleConverter,
} from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import React from 'react';

interface AvailRevProps {
    x: number,
    y: number,
    mesg: string,
    visible: boolean,
    active: boolean,
    revDoorOpen: number,
}

const AvailRev: React.FC<AvailRevProps> = ({ x, y, mesg, visible, active, revDoorOpen }) => (
    <>
        <g className={visible || !active ? 'Show' : 'Hide'}>
            <rect x={x - 17} y={y - 16} width={96} height={34} className="DarkGreyBox BackgroundFill" />
            {mesg === 'REV'
            && <text className={`Huge Center ${active && Math.round(revDoorOpen) > 5 ? 'Green' : 'Amber'}`} x={x + 34} y={y + 13}>{active ? 'REV' : 'XX'}</text>}
            {mesg === 'AVAIL'
            && <text className="Huge End Green" x={x + 79} y={y + 13}>AVAIL</text>}
        </g>
    </>
);

interface N1CommandAndTrendProps {
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
    const n1CommandXY = valueRadianAngleConverter({ value: (N1Commanded / 10), min, max, endAngle, startAngle, perpendicular: true });

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
        x: (n1CommandPlusArrow.x * radius * 0.50),
        y: (n1CommandPlusArrow.y * radius * 0.50),
    };
    const n1CommandArrowXY = {
        x: (n1CommandArrow.x * radius * 0.50), // Based on 20 degree angle and hypotenuse of 0.5
        y: (n1CommandArrow.y * radius * 0.50),
    };

    const radiusDivide = radius / 5;
    const commandAndTrendRadius = [radius - radiusDivide, radius - (2 * radiusDivide), radius - (3 * radiusDivide), radius - (4 * radiusDivide)];
    const N1CommandArray : any[] = [];
    commandAndTrendRadius.forEach((commandradius) => N1CommandArray.push(<GaugeComponent
        x={0}
        y={0}
        radius={radius - commandradius}
        startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1ActualXY.angle}
        endAngle={N1Actual > (N1Commanded / 10) ? n1ActualXY.angle : n1CommandXY.angle}
        visible={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3}
        className="GreenLine"
    />));

    return (
        <Layer x={x} y={y} className={autothrustStatus === 2 && Math.abs(N1Actual - (N1Commanded / 10)) > 0.3 ? 'Show' : 'Hide'}>
            <GaugeMarkerComponent
                value={N1Commanded / 10}
                x={0}
                y={0}
                min={min}
                max={max}
                radius={radius}
                startAngle={startAngle}
                endAngle={endAngle}
                multiplierOuter={0.8}
                className="GreenLine"
                indicator
            />
            <GaugeMarkerComponent
                value={N1Commanded / 10}
                x={0}
                y={0}
                min={min}
                max={max}
                radius={radius}
                startAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle - 20 : n1CommandXY.angle}
                endAngle={N1Actual > (N1Commanded / 10) ? n1CommandXY.angle : n1CommandXY.angle + 20}
                multiplierOuter={0.51}
                className="GreenLine"
                indicator
            />
            <line
                x2={n1ActualArrowXY.x}
                y2={n1ActualArrowXY.y}
                x1={n1CommandArrowXY.x}
                y1={n1CommandArrowXY.y}
                className="GreenLine"
            />
            {N1CommandArray}
        </Layer>
    );
};

interface N1Props {
    engine: 1 | 2,
    x: number,
    y: number,
    active: boolean,
}

const N1: React.FC<N1Props> = ({ x, y, engine, active }) => {
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 60);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const N1PercentSplit = splitDecimals(N1Percent);

    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);
    const [throttlePosition] = useSimVar(`L:A32NX_AUTOTHRUST_TLA_N1:${engine}`, 'number', 60);
    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA', 'number', 60);

    const availVisible = !!(N1Percent > Math.floor(N1Idle) && engineState === 2); // N1Percent sometimes does not reach N1Idle by .005 or so
    const [revVisible] = useSimVar(`L:A32NX_AUTOTHRUST_REVERSE:${engine}`, 'bool', 500);
    // Reverse cowl > 5% is treated like fully open, otherwise REV will not turn green for idle reverse
    const [revDoorOpenPercentage] = useSimVar(`A:TURB ENG REVERSE NOZZLE PERCENT:${engine}`, 'percent', 100);
    const availRevVisible = availVisible || revVisible;
    const availRevText = availVisible ? 'AVAIL' : 'REV';

    const radius = 66;
    const startAngle = 220;
    const endAngle = 70;
    const min = 1.6;
    const max = 11;

    return (
        <Layer x={x} y={y} id={`N1-indicator-${engine}`}>
            {!active
                    && (
                        <>
                            <GaugeComponent x={0} y={0} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent GaugeInactive" />
                            <AvailRev x={0} y={0} mesg={availRevText} visible={availRevVisible} active={active} revDoorOpen={revDoorOpenPercentage} />
                            <text className="Standard End Amber" x={48} y={46}>XX</text>
                        </>
                    )}
            {active
                && (
                    <>
                        <text className="Huge End Green" x={44} y={47}>{N1PercentSplit[0]}</text>
                        <text className="Large End Green" x={56} y={46}>.</text>
                        <text className="Standard End Green" x={72} y={46}>{N1PercentSplit[1]}</text>
                        <GaugeComponent x={0} y={0} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                            <GaugeComponent x={0} y={0} radius={radius} startAngle={endAngle - 20} endAngle={endAngle} visible className="GaugeComponent Gauge RedLine" />
                            <GaugeMarkerComponent
                                value={2}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeText Gauge"
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={5}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeText Gauge Medium"
                                textClassName="Standard"
                                useCentralAlignmentBaseline={false}
                                showValue
                                textNudgeY={17}
                                textNudgeX={13}
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={6}
                                x={0}
                                y={0}
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
                                x={0}
                                y={0}
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
                                x={0}
                                y={0}
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
                                x={0}
                                y={0}
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
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeText Gauge Medium"
                                textClassName="Standard"
                                useCentralAlignmentBaseline={false}
                                showValue
                                textNudgeY={16}
                                textNudgeX={-14}
                                multiplierInner={0.9}
                            />
                            <GaugeMarkerComponent
                                value={11}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeText Gauge RedLine"
                                multiplierInner={0.9}
                            />
                            <rect x={-17} y={18} width={96} height={34} className="DarkGreyBox" />
                            {/* N1 max limit */}
                            <GaugeMarkerComponent
                                value={Math.abs(N1ThrustLimit / 10)}
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
                                value={Math.abs(N1ThrustLimit / 10)}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeThrustLimitIndicatorFill Gauge"
                            />
                            <GaugeMarkerComponent
                                value={Math.max(Math.min(N1Percent, 110), 20) / 10}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className="GaugeIndicator Gauge"
                                indicator
                                roundLinecap
                            />
                            <AvailRev x={0} y={0} mesg={availRevText} visible={availRevVisible} active={active} revDoorOpen={revDoorOpenPercentage} />
                            <N1CommandAndTrend
                                N1Actual={Math.max(Math.min(N1Percent, 110), 20) / 10}
                                x={0}
                                y={0}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                engine={engine}
                            />
                        </GaugeComponent>
                        <ThrottlePositionDonutComponent
                            value={Math.max(Math.min(throttlePosition, 110), 20) / 10}
                            x={0}
                            y={0}
                            min={min}
                            max={max}
                            radius={radius * 1.03}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            className="DonutThrottleIndicator"
                        />

                    </>
                )}
        </Layer>
    );
};

export default N1;
