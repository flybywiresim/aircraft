import React from 'react';
import { SvgGroup } from '../../Common/SvgGroup';
import { render } from '../../../Common';
import { setIsEcamPage } from '../../../Common/defaults';
import { useSimVar } from '../../../Common/simVars';
import Valve from './Valve';

import '../../Common/CommonStyles.scss';

setIsEcamPage('cond_page');

export const CondPage = () => {
    // Disaply trim valve position for each zone
    const gaugeOffset = -43; // Gauges range is from -43 degree to +43 degree

    const [cockpitSelectedTemp] = useSimVar('L:A32NX_OVHD_COND_CKPT_SELECTOR_KNOB', 'number', 1000);
    const [cockpitTrimTemp] = useSimVar('L:A32NX_COND_CKPT_DUCT_TEMP', 'celsius', 1000);
    const [cockpitCabinTemp] = useSimVar('L:A32NX_COND_CKPT_TEMP', 'celsius', 1000);

    const [fwdSelectedTemp] = useSimVar('L:A32NX_OVHD_COND_FWD_SELECTOR_KNOB', 'number', 1000);
    const [fwdTrimTemp] = useSimVar('L:A32NX_COND_FWD_DUCT_TEMP', 'celsius', 1000);
    const [fwdCabinTemp] = useSimVar('L:A32NX_COND_FWD_TEMP', 'celsius', 1000);

    const [aftSelectedTemp] = useSimVar('L:A32NX_OVHD_COND_AFT_SELECTOR_KNOB', 'number', 1000);
    const [aftTrimTemp] = useSimVar('L:A32NX_COND_AFT_DUCT_TEMP', 'celsius', 1000);
    const [aftCabinTemp] = useSimVar('L:A32NX_COND_AFT_TEMP', 'celsius', 1000);

    // Note: There is a state where the hot air valve can be closed and classed as normal
    // This is not modelled at present. Re-check when packs are done.
    const [hotAir] = useSimVar('L:A32NX_AIRCOND_HOTAIR_TOGGLE', 'bool', 1000);

    return (
        <svg id="cond-page" className="ecam-common-styles" viewBox="0 0 768 768" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
            {/* Title and unit */}
            <g id="titleAndWarnings">
                <text className="Title UnderlineWhite" x="7" y="33">COND</text>
                <text className="Huge" x="630" y="32">TEMP</text>
                <text className="Huge" x="715" y="32">:</text>
                <text id="CondTempUnit" className="Standard Cyan" x="726" y="31">°C</text>
                { /* Not yet implemented
                    <text id="LeftFanWarning" className="Large Amber" x="180" y="75">FAN</text>
                    <text id="RightFanWarning" className="Large Amber" x="510" y="75">FAN</text>
                    <text id="AltnMode" className="Large Green" x="310" y="45">ALTN MODE</text>
                */}
            </g>

            {/* Plane shape */}
            <path id="UpperPlaneSymbol" className="LightGreyLine" d="m 95,128 l 27,-9 l 11,-12 a 75 75 0 0 1 40 -13 h 430 l 12,10" />
            <path id="LowerPlaneSymbol" className="LightGreyLine" d="m 94,172 a 150 150 0 0 0 60 18 h 20 m 49,0 h 122 m 49,0 h 120 m 50,0 h 38 l 12,-10" />
            <path id="PlaneSeperators" className="LightGreyLine" d="m 278,94 v96 m 179,0 v-54" />

            {/* Cockpit */}
            <CondUnit title="CKPT" selectedTemp={cockpitSelectedTemp} cabinTemp={cockpitCabinTemp} trimTemp={cockpitTrimTemp} x={153} y={105} offset={gaugeOffset} hotAir={hotAir} />

            {/* Fwd */}
            <CondUnit title="FWD" selectedTemp={fwdSelectedTemp} cabinTemp={fwdCabinTemp} trimTemp={fwdTrimTemp} x={324} y={105} offset={gaugeOffset} hotAir={hotAir} />

            {/*  Aft */}
            <CondUnit title="AFT" selectedTemp={aftSelectedTemp} cabinTemp={aftCabinTemp} trimTemp={aftTrimTemp} x={494} y={105} offset={gaugeOffset} hotAir={hotAir} />

            {/* Valve and tubes */}
            <g id="ValveAndTubes">
                <text className="MediumLarge" x="565" y="276">
                    <tspan x="706" y="306" style={{ letterSpacing: '1px' }}>HOT</tspan>
                    <tspan x="706" y="336" style={{ letterSpacing: '2px' }}>AIR</tspan>
                </text>
                <Valve x={650} y={312} radius={21} position={hotAir ? 'H' : 'V'} css={hotAir ? 'GreenLine' : 'AmberLine'} sdacDatum />
                <line className={hotAir ? 'GreenLine' : 'AmberLine'} x1="195" y1="312" x2="627" y2="312" />
                <line className={hotAir ? 'GreenLine' : 'AmberLine'} x1="672" y1="312" x2="696" y2="312" />
            </g>
        </svg>
    );
};

type CondUnitProps = {
    title: string,
    selectedTemp: number,
    cabinTemp: number,
    trimTemp: number,
    x: number,
    y: number,
    offset: number,
    hotAir: number
}

const CondUnit = ({ title, selectedTemp, cabinTemp, trimTemp, x, y, offset, hotAir } : CondUnitProps) => {
    const rotateTemp = offset + (selectedTemp * 86 / 300);

    return (
        <SvgGroup x={x} y={y}>
            <text className="Large Center" x={47} y={23}>{title}</text>
            <text id="CkptCabinTemp" className="Large Green" x={26} y={56}>{cabinTemp.toFixed(0)}</text>
            <text id="CkptTrimTemp" className="Standard Green" x={29} y={106}>{trimTemp.toFixed(0)}</text>
            <text className="Standard" x={-2} y={147}>C</text>
            <text className="Standard" x={74} y={146}>H</text>
            <g id="CkptGauge" transform={`rotate(${rotateTemp.toFixed(0)} 42 158 )`}>
                <path className="GreenLine" d="m 37,137 l 10,0 l -5,-9 z" />
                <line className="GreenLine" x1={42} y1={158} x2={42} y2={138} />
            </g>
            <line className={hotAir ? 'GreenLine' : 'AmberLine'} x1={42} y1={207} x2={42} y2={158} />
            <g>
                <path className="WhiteLine" d="m 21,136 a 30 30 0 0 1 42 0" />
                <line className="WhiteLine" x1={42} y1={118} x2={42} y2={127} />
            </g>
        </SvgGroup>
    );
};

render(<CondPage />);
