import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import Valve from './Valve';

interface EngineBleedProps {
    x: number,
    y: number,
    engine: 1 | 2,
    sdacDatum: boolean,
    enginePRValveOpen: boolean,
    packFlowValveOpen: boolean
}

const EngineBleed: FC<EngineBleedProps> = ({ x, y, engine, sdacDatum, enginePRValveOpen, packFlowValveOpen }) => {
    const [engineN1] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
    const [engineN1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 500);
    const engineN1BelowIdle = (engineN1 + 2) < engineN1Idle;
    const [engineHPValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_HP_VALVE_OPEN`, 'bool', 500);
    // const [enginePRValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PR_VALVE_OPEN`, 'bool', 500);
    const [precoolerOutletTemp] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PRECOOLER_OUTLET_TEMPERATURE`, 'celsius', 100);
    const precoolerOutletTempFive = Math.round(precoolerOutletTemp / 5) * 5;
    const [precoolerInletPress] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PRECOOLER_INLET_PRESSURE`, 'psi', 10);
    const precoolerInletPressTwo = Math.round(precoolerInletPress / 2) * 2;

    return (
        <g id={`bleed-${engine}`}>

            {/* Air Cond shape and labels */}
            <path className="GreyStroke Stroke1" d={`M ${x},${y} l -47,10 l 0,123 l 14,0`} />
            <path className="GreyStroke Stroke1" d={`M ${x - 47},${y + 64} l 14,0`} />
            <path className="GreyStroke Stroke1" d={`M ${x},${y} l +47,10 l 0,123 l -14,0`} />
            <path className="GreyStroke Stroke1" d={`M ${x + 47},${y + 64} l -14,0`} />
            <text x={x - 56} y={y + 64} className="White Standard End">C</text>
            <text x={x + 58} y={y + 64} className="White Standard">H</text>
            <text x={x - 55} y={y + 132} className="White Standard End">LO</text>
            <text x={x + 61} y={y + 132} className="White Standard">HI</text>

            {/* Pack inlet Flow */}
            <BleedGauge x={x} y={y + 150} sdacDatum={sdacDatum} packFlowValveOpen={packFlowValveOpen} engine={engine} />

            {/* Engine Bleed temp */}
            <path className="GreyStroke Stroke2" d={`M ${x},${y + 247} l -27,0 l 0,54 l 54,0 l 0,-54 l -27,0`} />
            <text x={engine === 1 ? x + 40 : x - 70} y={y + 270} className="Cyan Standard">PSI</text>
            <text x={engine === 1 ? x + 40 : x - 70} y={y + 298} className="Cyan Standard">°C</text>
            {/* Precooler outlet pressure */}
            <text
                x={x}
                y={y + 270}
                className={`Large Center ${!sdacDatum || precoolerInletPressTwo <= 4 || precoolerInletPressTwo > 60 ? 'Amber' : 'Green'}`}
            >
                {!sdacDatum ? 'XX' : precoolerInletPressTwo}
            </text>
            {/* Precooler outlet temperature */}
            <text
                x={x + 20}
                y={y + 295}
                className={`Large End ${!sdacDatum || precoolerOutletTempFive < 150 || precoolerOutletTempFive > 257 ? 'Amber' : 'Green'}`}
            >
                {!sdacDatum ? 'XX' : precoolerOutletTempFive}
            </text>

            {/* Pressure regulating valve */}
            <path className={!engineN1BelowIdle && enginePRValveOpen ? 'GreenLine' : 'Hide'} d={`M ${x},${y + 340} l 0,-37`} />
            <Valve x={x} y={y + 355} radius={15} css="GreenLine" position={enginePRValveOpen ? 'V' : 'H'} sdacDatum={sdacDatum} />
            <path className={engineN1BelowIdle ? 'AmberLine' : 'GreenLine'} d={`M ${x},${y + 415} l 0,-45`} />
            <text x={x + 2} y={y + 433} className="White Center Standard">IP</text>

            {/* High pressure valve */}
            <Valve x={engine === 1 ? x + 47 : x - 47} y={y + 398} radius={15} css="GreenLine" position={engineHPValveOpen === 1 ? 'H' : 'V'} sdacDatum={sdacDatum} />
            <path className={engineN1BelowIdle ? 'AmberLine' : 'GreenLine'} d={`M ${engine === 1 ? x + 92 : x - 92},${y + 415} l 0,-17 l ${engine === 1 ? '-29' : '29'},0`} />
            <text x={engine === 1 ? x + 95 : x - 90} y={y + 433} className="White Center Standard">HP</text>
            <path className={engineHPValveOpen === 1 ? 'GreenLine' : 'Hide'} d={`M ${engine === 1 ? x + 33 : x - 33},${y + 398} l ${engine === 1 ? '-33' : '33'},0`} />

            <text x={engine === 1 ? x - 66 : x + 66} y={423} className={`Huge ${engineN1BelowIdle ? 'Amber' : 'White'}`}>{engine}</text>
        </g>
    );
};

export default EngineBleed;

interface BleedGaugeProps {
    x: number,
    y: number,
    engine: number,
    sdacDatum: boolean,
    packFlowValveOpen: boolean,
}

const BleedGauge: FC<BleedGaugeProps> = ({ x, y, engine, sdacDatum, packFlowValveOpen }) => {
    // TODO
    // Pack precpper outlet temp, pack inlet flow rate, pack bypass valve and pack outlet temp should be revised once the packs are modelled

    const [precoolerOutletTemp] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PRECOOLER_OUTLET_TEMPERATURE`, 'celsius', 500);
    const compressorOutletTemp = Math.round(precoolerOutletTemp / 5) * 5;

    const [packInletFlowPercentage] = useSimVar('L:A32NX_COND_PACK_FLOW', 'percent', 500);

    const [fwdCondSelectorKnob] = useSimVar('L:A32NX_OVHD_COND_FWD_SELECTOR_KNOB', 'number', 1000); // 0 to 300
    const packBypassValve = Math.round(fwdCondSelectorKnob / 300 * 100);
    const [fwdCabinTemp] = useSimVar('L:A32NX_COND_FWD_TEMP', 'celsius', 1000);
    const packOutletTemp = Math.round(fwdCabinTemp / 5) * 5;

    const radius = 38;
    const startAngle = -63;
    const endAngle = 63;
    const min = 80;
    const max = 120;
    const minBypass = 0;
    const maxBypass = 100;

    return (
        <g id={`Engine${engine}AirCond`}>
            {/* Pack Outlet Temp */}
            <text className="Large End Green" x={x + 15} y={y - 117}>{packOutletTemp}</text>
            <text x={x + 20} y={y - 117} className="Cyan Standard">°C</text>

            {/* Bypass valve */}
            <GaugeComponent x={x} y={y - 69} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                <GaugeMarkerComponent
                    value={50}
                    x={x}
                    y={y - 69}
                    min={minBypass}
                    max={maxBypass}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="WhiteStroke Stroke2"
                    showValue={false}
                    outer
                    multiplierOuter={1.1}
                />
                <GaugeMarkerComponent
                    value={packBypassValve}
                    x={x}
                    y={y - 69}
                    min={minBypass}
                    max={maxBypass}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="GaugeIndicator Gauge LineCapRound"
                    indicator
                    multiplierOuter={1.1}
                />
            </GaugeComponent>

            {/* Compressor Outlet Temp */}
            <text className={`Large End ${compressorOutletTemp > 230 || !sdacDatum ? 'Amber' : 'Green'}`} x={x + 20} y={y - 47}>{sdacDatum ? compressorOutletTemp : 'XX'}</text>
            <text x={x + 20} y={y - 47} className="Cyan Standard">°C</text>

            {/* Pack inlet flow */}
            <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="GaugeComponent Gauge">
                <GaugeMarkerComponent
                    value={100}
                    x={x}
                    y={y}
                    min={min}
                    max={max}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className="WhiteStroke Stroke2"
                    showValue={false}
                    outer
                    multiplierOuter={1.1}
                />
                <GaugeMarkerComponent
                    value={packInletFlowPercentage < 80 ? 80 : packInletFlowPercentage}
                    x={x}
                    y={y}
                    min={min}
                    max={max}
                    radius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    className={`${packFlowValveOpen ? 'GaugeIndicator' : 'AmberLine'} Gauge LineCapRound`}
                    indicator
                    multiplierOuter={1.1}
                />
            </GaugeComponent>

            {/* Flow control valve */}
            <Valve x={x} y={y} radius={15} css="GreenLine BackgroundFill" position={packFlowValveOpen ? 'V' : 'H'} sdacDatum={sdacDatum} />
        </g>
    );
};
