import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect } from 'react';

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
    const [engineStarter] = useSimVar(`GENERAL ENG STARTER:${engine}`, 'bool', 500);
    const [ignitionStarter] = useSimVar(`TURB ENG IS IGNITING:${engine}`, 'bool', 500);

    const availVisible = !!(N1Percent > Math.floor(N1Idle) && engineState === 2); // N1Percent sometimes does not reach N1Idle by .005 or so

    useEffect(() => {
        console.log(`Engine ${engine} Engine Starter is ${engineStarter}`);
        console.log(`Engine ${engine} Ignition starter si ${ignitionStarter}`);
        console.log(`Engine ${engine} Ignition starter si ${engineState}`);
    }, [engineStarter, ignitionStarter, engineState]);

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
                <text className="Medium End Green" x={x + 66} y={y + 45}>{N1PercentSplit[1]}</text>
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
                        className="GaugeText Medium"
                        showValue
                        textNudgeY={6}
                        textNudgeX={13}
                    />
                    <GaugeMarkerComponent value={6} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={7} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={8} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent value={9} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText" />
                    <GaugeMarkerComponent
                        value={10}
                        x={x}
                        y={y}
                        min={min}
                        max={max}
                        radius={radius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        className="GaugeText Medium"
                        showValue
                        textNudgeY={6}
                        textNudgeX={-13}
                    />
                    <GaugeMarkerComponent value={11} x={x} y={y} min={min} max={max} radius={radius} startAngle={startAngle} endAngle={endAngle} className="GaugeText Red" />
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
                        className="GaugeIndicator"
                        indicator
                    />
                    <Avail x={x} y={y} visible={availVisible} />
                </GaugeComponent>

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

// getModeN1Max() {
//     switch (this.throttleMode) {
//         case 4: return ((this.timerTOGA > 0) ? 101.5 : 100);
//         case 5: return 66.7;
//         default: return 100;
//     }
// }
