import React, { FC, useState, useEffect } from 'react';
import { render } from '@instruments/common/index';
import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { setIsEcamPage } from '@instruments/common/defaults';
import { Triangle } from '../../Common/Shapes';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { useSimVar } from '../../../Common/simVars';
import { SvgGroup } from '../../Common/SvgGroup';

import './Press.scss';

setIsEcamPage('press_page');

export const PressPage: FC = () => {
    const [cabinVs] = useSimVar('L:A32NX_PRESS_CABIN_VS', 'feet per minute', 500);
    const [cabinAlt] = useSimVar('L:A32NX_PRESS_CABIN_ALTITUDE', 'feet', 500);
    const [deltaPsi] = useSimVar('L:A32NX_PRESS_CABIN_DELTA_PRESSURE', 'psi', 500);
    const deltaPress = splitDecimals(deltaPsi, '');
    const vsx = 275;
    const cax = 455;
    const dpx = 110;
    const y = 165;
    const radius = 50;
    const [systemNumber, setSystemNumber] = useState(0);

    useEffect(() => {
        setSystemNumber(Math.random() < 0.5 ? 1 : 2);
    }, []);

    return (
        <EcamPage name="main-press">
            <PageTitle x={6} y={18} text="CAB PRESS" />
            <PressureComponent />

            {/* System */}
            <SystemComponent id={1} x={180} y={290} visible={systemNumber === 1} />
            <SystemComponent id={2} x={350} y={290} visible={systemNumber === 2} />

            {/* Delta pressure gauge  */}
            <g id="DeltaPressure">
                <text className="Large Center" x={dpx - 5} y="80">@P</text>
                <text className="Medium Center Cyan" x={dpx - 5} y="100">PSI</text>
                <text className={`Huge End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'}`} x={dpx + 38} y={y + 25}>
                    {deltaPress[0]}
                </text>
                <text className={`Huge End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'}`} x={dpx + 53} y={y + 25}>.</text>
                <text className={`Standard End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'}`} x={dpx + 63} y={y + 25}>{deltaPress[1]}</text>
                <GaugeComponent x={dpx} y={y} radius={radius} startAngle={210} endAngle={50} manMode className="Gauge">
                    <GaugeComponent x={dpx} y={y} radius={radius} startAngle={40} endAngle={50} manMode className="Gauge Amber" />
                    <GaugeComponent x={dpx} y={y} radius={radius} startAngle={210} endAngle={218} manMode className="Gauge Amber" />
                    <GaugeMarkerComponent value={8} x={dpx} y={y} min={-1} max={9} radius={radius} startAngle={210} endAngle={50} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent
                        value={4}
                        x={dpx}
                        y={y}
                        min={-1}
                        max={9}
                        radius={radius}
                        startAngle={210}
                        endAngle={50}
                        className="GaugeText"
                        showValue={false}
                        indicator={false}
                    />
                    <GaugeMarkerComponent value={0} x={dpx} y={y} min={-1} max={9} radius={radius} startAngle={210} endAngle={50} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent
                        value={deltaPsi}
                        x={dpx}
                        y={y}
                        min={-1}
                        max={9}
                        radius={radius}
                        startAngle={210}
                        endAngle={50}
                        className={`GaugeIndicator ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : ''}`}
                        showValue={false}
                        indicator
                    />
                </GaugeComponent>
            </g>

            {/* Vertical speed gauge */}
            <g id="VsIndicator">
                <text className="Large Center" x={vsx + 15} y="80">V/S</text>
                <text className="Medium Center Cyan" x={vsx + 20} y="100">FT/MIN</text>
                <text className="Huge Green End" x={vsx + 85} y={y + 5}>{Math.round(cabinVs / 50) * 50}</text>
                <GaugeComponent x={vsx} y={y} radius={radius} startAngle={170} endAngle={10} manMode className="Gauge">
                    <GaugeMarkerComponent value={2} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent value={1} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue={false} indicator={false} />
                    <GaugeMarkerComponent value={0} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent value={-1} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue={false} indicator={false} />
                    <GaugeMarkerComponent value={-2} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent
                        value={cabinVs / 1000}
                        x={vsx}
                        y={y}
                        min={-2}
                        max={2}
                        radius={radius}
                        startAngle={180}
                        endAngle={0}
                        className="GaugeIndicator"
                        showValue={false}
                        indicator
                    />
                </GaugeComponent>
            </g>

            {/* Cabin altitude gauge */}
            <g id="CaIndicator">
                <text className="Large Center" x={cax + 15} y="80">CAB ALT</text>
                <text className="Medium Center Cyan" x={cax + 20} y="100">FT</text>
                <text
                    className={`Huge End ${Math.round(cabinAlt / 50) * 50 >= 9550
                        ? 'Red'
                        : 'Green'}`}
                    x={cax + 85}
                    y={y + 25}
                >
                    {Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 : 0}
                </text>
                <GaugeComponent x={cax} y={y} radius={radius} startAngle={210} endAngle={50} manMode className="Gauge">
                    <GaugeComponent x={cax} y={y} radius={radius} startAngle={30} endAngle={50} manMode className="Gauge Red" />
                    <GaugeMarkerComponent value={10} x={cax} y={y} min={-0.625} max={10.625} radius={radius} startAngle={210} endAngle={50} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent
                        value={5}
                        x={cax}
                        y={y}
                        min={-0.625}
                        max={10.625}
                        radius={radius}
                        startAngle={210}
                        endAngle={50}
                        className="GaugeText"
                        showValue={false}
                        indicator={false}
                    />
                    <GaugeMarkerComponent value={0} x={cax} y={y} min={-0.625} max={10.625} radius={radius} startAngle={210} endAngle={50} className="GaugeText" showValue indicator={false} />
                    <GaugeMarkerComponent
                        value={Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 / 1000 : 0}
                        x={cax}
                        y={y}
                        min={-0.625}
                        max={10.625}
                        radius={radius}
                        startAngle={210}
                        endAngle={50}
                        className={`GaugeIndicator ${Math.round(cabinAlt / 50) * 50 >= 9550 ? 'Red' : ''}`}
                        showValue={false}
                        indicator
                    />
                </GaugeComponent>
            </g>

            <SvgGroup x={-5} y={-25}>
                <polyline className="AirPressureShape" points="140,460 140,450 75,450 75,280 540,280 540,300" />
                <polyline className="AirPressureShape" points="180,457 180,450 265,450 265,457" />
                <polyline className="AirPressureShape" points="305,460 305,450 380,450" />
                <polyline className="AirPressureShape" points="453,450 540,450 540,380 550,380" />
                <line className="AirPressureShape" x1="540" y1="340" x2="547" y2="340" />
            </SvgGroup>

            {/* Safety and vent valves */}

            <text className="Large White" x={490} y={305}>SAFETY</text>
            <text className="Large White" x={185} y={380}>VENT</text>
            <text className="Large White" x={120} y={417}>INLET</text>
            <text className="Large White" x={240} y={417}>OUTLET</text>

            {/* Packs */}

            <PackComponent id={1} x={47} y={495} />
            <PackComponent id={2} x={448} y={495} />

        </EcamPage>
    );
};

const PressureComponent = () => {
    const [landingElevDialPosition] = useSimVar('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'number', 100);
    const [landingRunwayElevation] = useSimVar('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet', 1000);
    const [manMode] = useSimVar('L:A32NX_CAB_PRESS_MODE_MAN', 'bool', 1000);
    const [ldgElevMode, setLdgElevMode] = useState('AUTO');
    const [ldgElevValue, setLdgElevValue] = useState('XX');
    const [cssLdgElevName, setCssLdgElevName] = useState('green');
    const [landingElev] = useSimVar('L:A32NX_LANDING_ELEVATION', 'feet', 100);

    useEffect(() => {
        setLdgElevMode(landingElevDialPosition === 0 ? 'AUTO' : 'MAN');
        if (landingElevDialPosition === 0) {
            // On Auto
            const nearestfifty = Math.round(landingRunwayElevation / 50) * 50;
            setLdgElevValue(landingRunwayElevation > -5000 ? nearestfifty.toString() : 'XX');
            setCssLdgElevName(landingRunwayElevation > -5000 ? 'Green' : 'Amber');
        } else {
            // On manual
            const nearestfifty = Math.round(landingElev / 50) * 50;
            setLdgElevValue(nearestfifty.toString());
            setCssLdgElevName('Green');
        }
    }, [landingElevDialPosition, landingRunwayElevation]);

    return (
        <>
            <g id="LandingElevation" className={!manMode ? 'Show' : 'Hide'}>
                <text className="Large Center" x="280" y="25">LDG ELEV</text>
                <text id="LandingElevationMode" className="Large Green" x="350" y="25">{ldgElevMode}</text>

                <text id="LandingElevation" className={`Large ${cssLdgElevName}`} x="510" y="25" textAnchor="end">{ldgElevValue}</text>
                <text className="Medium Cyan" x="525" y="25">FT</text>
            </g>
            <text className={`Large Green ${manMode ? 'Show' : 'Hide'}`} x="420" y="340">MAN</text>

        </>
    );
};

type SystemComponentType = {
    id: number,
    visible: boolean,
    x: number,
    y: number
}

const SystemComponent = ({ id, visible, x, y }: SystemComponentType) => {
    // When failures are introduced can override visible variable
    const systemFault = false;
    const systemColour = systemFault ? 'Amber' : 'Green';

    return (
        <>
            <g id="LandingElevation" className={visible ? 'Show' : 'Hide'}>
                <text className={`Large ${systemColour}`} x={x} y={y}>
                    SYS
                    {' '}
                    {id}
                </text>
            </g>

        </>
    );
};

type PackComponentType = {
    id: number,
    x: number,
    y: number
}

const PackComponent = ({ id, x, y }: PackComponentType) => {
    const [engN2] = useSimVar(`L:A32NX_ENGINE_N2:${id}`, 'number', 500);
    const [packOff] = useSimVar(`L:A32NX_AIRCOND_PACK${id}_TOGGLE`, 'bool', 500);
    const triangleColour = !packOff && engN2 >= 60 ? 'Amber' : 'Green';
    const packWordColour = !packOff && engN2 >= 60 ? 'Amber' : 'White';

    return (
        <>
            <Triangle x={x + 38} y={y - 45} colour={triangleColour} fill={0} orientation={0} />
            <text className={`Large ${packWordColour}`} x={x} y={y}>
                PACK
                {' '}
                {id}
            </text>
        </>
    );
};

render(<PressPage />);
