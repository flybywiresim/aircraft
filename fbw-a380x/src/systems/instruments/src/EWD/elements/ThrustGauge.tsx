import {
    GaugeComponent,
    GaugeMarkerComponent, GaugeThrustComponent, splitDecimals, ThrottlePositionDonutComponent,
    ThrustTransientComponent,
} from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position, EngineNumber, FadecActive, n1Degraded } from '@instruments/common/types';
import React from 'react';

const ThrustGauge: React.FC<Position & EngineNumber & FadecActive & n1Degraded> = ({ x, y, engine, active, n1Degraded }) => {
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'number', 100);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'number', 1000);

    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);
    const [throttlePosition] = useSimVar(`L:A32NX_AUTOTHRUST_TLA:${engine}`, 'number', 100);
    const [throttlePositionN1] = useSimVar(`L:A32NX_AUTOTHRUST_TLA_N1:${engine}`, 'number', 100);
    const [thrustLimitIdle] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE', 'number', 100);
    const [thrustLimitToga] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA', 'number', 100);
    // No ACUTE yet, so we assume thrust = currentN1 / togaLimit
    const throttleTarget = (throttlePositionN1 - thrustLimitIdle) / (thrustLimitToga - thrustLimitIdle);

    const ThrustPercent = Math.min(1, Math.max(0, (N1Percent - thrustLimitIdle)/(thrustLimitToga - thrustLimitIdle))) * 100;
    const ThrustPercentSplit = splitDecimals(ThrustPercent);


    const availVisible = !!(N1Percent > Math.floor(N1Idle) && engineState === 2); // N1Percent sometimes does not reach N1Idle by .005 or so
    const [revDoorOpened] = useSimVar(`L:A32NX_REVERSER_${engine}_DEPLOYED`, 'bool', 100);
    const [revDoorTransittt] = useSimVar(`L:A32NX_REVERSER_${engine}_DEPLOYING`, 'bool', 100);
    const [revAthr] = useSimVar(`L:A32NX_AUTOTHRUST_REVERSE:${engine}`, 'bool', 100);
    const revVisible = revDoorTransittt ||  revDoorOpened || revAthr;
    const availRevVisible = availVisible || (revVisible && [2, 3].includes(engine));
    const availRevText = availVisible ? 'AVAIL' : 'REV';

    const radius = 64;
    const startAngle = 230;
    const endAngle = 90;
    const min = 0;
    const max = 10;
    const revStartAngle = 130;
    const revEndAngle = 230;
    const revRadius = 58;
    const revMin = 0;
    const revMax = 3;

    return (
        <>
            <g id={`Thrust-indicator-${engine}`}>
                {(!active || n1Degraded)
                    && (
                        <>
                            <GaugeComponent x={x} y={y + 20} radius={radius} startAngle={320} endAngle={40} visible largeArc={0} sweep={0} className='GaugeComponent SW2 AmberLine' />
                            <text className='F26 End Amber Spread' x={x + 55} y={y - 48}>THR XX</text>
                        </>
                    )}
                {active && !n1Degraded
                && (
                    <>
                        {(!revVisible || [1, 4].includes(engine))
                    && (
                        <>
                            <text className='F26 End Green' x={x + 48} y={y + 47}>{ThrustPercentSplit[0]}</text>
                            <text className='F26 End Green' x={x + 62} y={y + 47}>.</text>
                            <text className='F20 End Green' x={x + 78} y={y + 47}>{ThrustPercentSplit[1]}</text>
                            <GaugeThrustComponent
                                x={x}
                                y={y}
                                // TODO valueIdle={thrustLimitIdle / 10}
                                // TODO valueMax={thrustLimit / 10}
                                valueIdle={0.3}
                                valueMax={10}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                min={min}
                                max={max}
                                visible={availVisible || engineState === 1}
                                className='GaugeComponent GaugeThrustFill'
                            />
                            <AvailRev x={x - 18} y={y - 14} mesg={availRevText} visible={availRevVisible} revDoorOpen={revDoorOpened} />
                            <ThrottlePositionDonutComponent
                                value={throttleTarget * 10}
                                x={x}
                                y={y}
                                min={min}
                                max={max}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                className='DonutThrottleIndicator'
                            />
                            <ThrustTransientComponent
                                x={x}
                                y={y}
                                thrustActual={ThrustPercent / 100}
                                thrustTarget={throttleTarget}
                                radius={radius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                visible
                                className='TransientIndicator'
                            />
                        </>
                    )}
                        <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className='GaugeComponent Gauge'>
                            <GaugeMarkerComponent
                                value={0}
                                x={x}
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
                                value={2.5}
                                x={x}
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
                                value={5}
                                x={x}
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
                                value={7.5}
                                x={x}
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
                                x={x}
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
                            {(!revVisible || [1, 4].includes(engine))
                    && (
                        <>
                            <rect x={x - 11} y={y + 21} width={96} height={30} className='DarkGreyBox' />
                            <GaugeMarkerComponent
                                value={ThrustPercent / 10}
                                x={x}
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
                        </>
                    )}
                        </GaugeComponent>
                    </>
                )}
                {active && revVisible && [2, 3].includes(engine)
                && (
                    <>
                        <GaugeThrustComponent
                            x={x}
                            y={y}
                            valueIdle={0.04}
                            valueMax={2.6}
                            radius={revRadius}
                            startAngle={revStartAngle}
                            endAngle={revEndAngle}
                            min={revMin}
                            max={revMax}
                            visible={revVisible || engineState === 1}
                            className='GaugeComponent GaugeThrustFill'
                            reverse
                        />
                        {/* reverse */}
                        <GaugeComponent x={x} y={y} radius={revRadius} startAngle={revStartAngle} endAngle={revEndAngle} visible className='GaugeComponent Gauge'>
                            <AvailRev x={x - 18} y={y - 14} mesg={availRevText} visible={availRevVisible} revDoorOpen={revDoorOpened} />
                            <GaugeMarkerComponent
                                value={0}
                                x={x}
                                y={y}
                                min={revMin}
                                max={revMax}
                                radius={revRadius}
                                startAngle={revStartAngle}
                                endAngle={revEndAngle}
                                className='GaugeText Gauge'
                                textNudgeY={0}
                                textNudgeX={-13}
                                multiplierInner={1.1}
                            />
                            <GaugeMarkerComponent
                                value={-ThrustPercent / 10}
                                x={x}
                                y={y}
                                min={revMin}
                                max={revMax}
                                radius={revRadius}
                                startAngle={revStartAngle}
                                endAngle={revEndAngle}
                                className='GaugeIndicator Gauge'
                                multiplierOuter={1.10}
                                indicator
                                reverse
                            />
                        </GaugeComponent>
                        <ThrottlePositionDonutComponent
                            value={(throttlePosition / 8)+2.5}
                            x={x}
                            y={y}
                            min={revMin}
                            max={revMax}
                            radius={revRadius}
                            startAngle={revStartAngle}
                            endAngle={revEndAngle}
                            className='DonutThrottleIndicator'
                        />

                    </>
                )}
            </g>
        </>
    );
};

export default ThrustGauge;

type AvailRevProps = {
    x: number,
    y: number,
    mesg: string,
    visible: boolean,
    revDoorOpen: boolean,
};

const AvailRev: React.FC<AvailRevProps> = ({ x, y, mesg, visible, revDoorOpen }) => (
    <>
        <g className={visible ? 'Show' : 'Hide'}>
            <rect x={x - 28} y={y - 13} width={90} height={24} className='DarkGreyBox BackgroundFill' />
            {mesg === 'REV'
            && <text className={`F26 Spread Centre ${revDoorOpen ? 'Green' : 'Amber'}`} x={x - 8} y={y + 9}>REV</text>}
            {mesg === 'AVAIL'
            && <text className='F26 Spread Centre Green' x={x - 26} y={y + 9}>AVAIL</text>}
        </g>
    </>
);
