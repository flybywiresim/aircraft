import './Cond.scss';
import ReactDOM from 'react-dom';
import React from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';

setIsEcamPage('cond_page');

export const CondPage = () => {
    // Disaply trim valve position for each zone
    const gaugeOffset = -50; // Gauges range is from -50 degree to +50 degree

    const [cockpitSelectedTemp] = useSimVar('L:A320_Neo_AIRCOND_LVL_1', 'number', 1000);
    const [cockpitTrimTemp] = useSimVar('L:A32NX_CKPT_TRIM_TEMP', 'celsius', 1000);
    const [cockpitCabinTemp] = useSimVar('L:A32NX_CKPT_TEMP', 'celsius', 1000);

    const [fwdSelectedTemp] = useSimVar('L:A320_Neo_AIRCOND_LVL_2', 'number', 1000);
    const [fwdTrimTemp] = useSimVar('L:A32NX_FWD_TRIM_TEMP', 'celsius', 1000);
    const [fwdCabinTemp] = useSimVar('L:A32NX_FWD_TEMP', 'celsius', 1000);

    const [aftSelectedTemp] = useSimVar('L:A320_Neo_AIRCOND_LVL_3', 'number', 1000);
    const [aftTrimTemp] = useSimVar('L:A32NX_AFT_TRIM_TEMP', 'celsius', 1000);
    const [aftCabinTemp] = useSimVar('L:A32NX_AFT_TEMP', 'celsius', 1000);

    // Note: There is a state where the hot air valve can be closed and classed as normal
    // This is not modelled at present. Re-check when packs are done.
    const [hotAir] = useSimVar('L:A32NX_AIRCOND_HOTAIR_TOGGLE', 'Bool', 1000);

    return (
        <>
            <svg id="cond-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                {/* Title and unit */}
                <g id="titleAndWarnings">
                    <text className="PageTitle" x="5" y="27">COND</text>
                    <text className="tempText" x="500" y="27">TEMP</text>
                    <text className="tempText" x="553" y="27">:</text>
                    <text id="CondTempUnit" className="UnitText" x="564" y="27">°C</text>
                    { /* Not yet implemented
                        <text id="LeftFanWarning" className="warningText" x="170" y="60">FAN</text>
                        <text id="RightFanWarning" className="warningText" x="350" y="60">FAN</text>
                        <text id="AltnMode" className="valueText" x="225" y="35">ALTN MODE</text>
                    */}
                </g>

                {/* Plane shape */}
                {/* eslint-disable-next-line max-len */}
                <path id="PlaneSymbol" className="CondPlane" d="m213.8428,68.36133l0,83.97584l55.55171,0m31.00094,0l51.73732,0l0,-50.70766m0,50.70766l55.55173,0m34.81534,0l22.46143,0.14881l14.27533,-10.61944m-265.3938,10.47063l-43.25439,0.17314m-31.10621,0.0111c-48.43094,0.21796 -46.00225,-7.78263 -67.15623,-15.92789m407.68806,-58.64412l-15.47207,-9.94078c-116.67487,0.0387 -207.24004,-0.30086 -323.91504,-0.12489c-20.94778,1.56194 -28.42552,8.14482 -31.50305,11.74302l-9.3201,10.8969l-27.55615,9.99176" />

                {/* Cockpit */}
                <CondUnit title="CKPT" selectedTemp={cockpitSelectedTemp} cabinTemp={cockpitCabinTemp} trimTemp={cockpitTrimTemp} x={153} offset={gaugeOffset} hotAir={hotAir} />

                {/* Fwd */}
                <CondUnit title="FWD" selectedTemp={fwdSelectedTemp} cabinTemp={fwdCabinTemp} trimTemp={fwdTrimTemp} x={283} offset={gaugeOffset} hotAir={hotAir} />

                {/*  Aft */}
                <CondUnit title="AFT" selectedTemp={aftSelectedTemp} cabinTemp={aftCabinTemp} trimTemp={aftTrimTemp} x={423} offset={gaugeOffset} hotAir={hotAir} />

                {/* Valve and tubes */}
                <g id="ValveAndTubes">
                    <text className="DuctStatus" x="565" y="276">
                        <tspan x="545" y="275">HOT</tspan>
                        <tspan x="545" y="300">AIR</tspan>
                    </text>
                    <g id="HotAirValve">
                        <circle className={hotAir ? 'st5' : 'pump-off'} cx="506" cy="280" r="16" />
                        <line className={hotAir ? 'st5' : 'Hide'} x1="490" y1="280" x2="522" y2="280" id="HotAirValveOpen" />
                        <line className={hotAir ? 'Hide' : 'pump-off'} x1="506" y1="264" x2="506" y2="296" id="HotAirValveClosed" />
                    </g>
                    <line className={hotAir ? 'st5' : 'pump-off'} x1="152" y1="280" x2="490" y2="280" />
                    <line className={hotAir ? 'st5' : 'pump-off'} x1="522" y1="280" x2="540" y2="280" />
                </g>
            </svg>
        </>
    );
};

type CondUnitProps = {
    title: string,
    selectedTemp: number,
    cabinTemp: number,
    trimTemp: number,
    x: number,
    offset: number,
    hotAir: number
}

const CondUnit = ({ title, selectedTemp, cabinTemp, trimTemp, x, offset, hotAir } : CondUnitProps) => {
    const rotateTemp = offset + selectedTemp;
    const polyPoints = `${x + 4},206 ${x},199 ${x - 4},206`;
    const gaugeD = `m ${x - 26} 208 Q ${x} 186 ${x + 26} 208`;
    const ductC = `${x - 40}`;
    const ductH = `${x + 40}`;
    const transformStyle = {
        transform: `rotate(${rotateTemp.toFixed(0)}deg)`,
        transformOrigin: `${x}px 230px`,
    };

    return (
        <>
            <g className="Cond">
                <text className="title" x={x} y="105">{title}</text>
                <text id="CkptCabinTemp" className="valueText" x={x} y="130">{cabinTemp.toFixed(0)}</text>
                <text id="CkptTrimTemp" className="valueText" x={x} y="180">{trimTemp.toFixed(0)}</text>
                <text className="DuctStatus" x={ductC} y="215">C</text>
                <text className="DuctStatus" x={ductH} y="215">H</text>
                <g id="CkptGauge" style={transformStyle}>
                    <polygon className="st5" points={polyPoints} />
                    <line className="st5" x1={x} y1="230" x2={x} y2="208" />
                </g>
                <line className={hotAir ? 'st5' : 'pump-off'} x1={x} y1="230" x2={x} y2="280" />
                <g className="Gauge">
                    <path className="Gauge" d={gaugeD} />
                    <line x1={x} y1="190" x2={x} y2="198" />
                </g>
            </g>
        </>
    );
};

ReactDOM.render(<SimVarProvider><CondPage /></SimVarProvider>, getRenderTarget());
