import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';

export const CruisePressure = () => {
    const [landingElevDialPosition] = useSimVar('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'Number', 100);
    const [landingRunwayElevation] = useSimVar('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet', 1000);
    const autoMode = true; // TODO useSimVar('L:A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO', 'Bool', 1000);
    const [ldgElevValue, setLdgElevValue] = useState('XX');
    const [cssLdgElevName, setCssLdgElevName] = useState('Green');
    const [landingElev] = useSimVar('L:A32NX_OVHD_PRESS_LDG_ELEV_KNOB', 'feet', 100);
    const [cabinAlt] = useSimVar('L:A32NX_PRESS_CABIN_ALTITUDE', 'feet', 500);
    const [cabinVs] = useSimVar('L:A32NX_PRESS_CABIN_VS', 'feet per minute', 500);
    const [deltaPsi] = useSimVar('L:A32NX_PRESS_CABIN_DELTA_PRESSURE', 'psi', 1000);

    const vsx = 440;
    const y = 385;
    const radius = 50;

    const deltaPress = splitDecimals(deltaPsi);

    useEffect(() => {
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
            <g id="LandingElevation" className={autoMode ? 'Show' : 'Hide'}>
                <text className="F26 MiddleAlign White LS1" x="470" y="355">LDG ELEVN</text>

                <text id="LandingElevation" className={`F29 EndAlign ${cssLdgElevName}`} x="653" y="359">{ldgElevValue}</text>
                <text className="F22 Cyan" x="658" y="359">FT</text>
            </g>

            {/* Vertical speed gauge */}
            {/* TODO */}
            <g id="VsIndicator">
                <GaugeComponent x={vsx} y={y} radius={radius} startAngle={170} endAngle={10} visible={!autoMode} className="Gauge">
                    <GaugeMarkerComponent value={2} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue textNudgeY={10} />
                    <GaugeMarkerComponent value={1} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" />
                    <GaugeMarkerComponent value={0} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue textNudgeX={10} />
                    <GaugeMarkerComponent value={-1} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" />
                    <GaugeMarkerComponent value={-2} x={vsx} y={y} min={-2} max={2} radius={radius} startAngle={180} endAngle={0} className="GaugeText" showValue textNudgeY={-10} />
                    <GaugeMarkerComponent
                        value={Math.abs((cabinVs / (50 * 50)) / 1000) <= 2.25 ? (cabinVs / (50 * 50)) / 1000 : 2.250}
                        x={vsx}
                        y={y}
                        min={-2}
                        max={2}
                        radius={radius}
                        startAngle={180}
                        endAngle={0}
                        className="GaugeIndicator"
                        indicator
                    />
                </GaugeComponent>
            </g>

            <text className="F26 White LS1" x="175" y="425">DELTA P</text>
            <text className="F29 Green EndAlign" x="332" y="425">
                {deltaPress[0]}
            </text>
            <text className="F29 Green EndAlign" x="348" y="425">
                .
            </text>
            <text className="F29 Green" x="350" y="425">{deltaPress[1]}</text>
            <text className="F22 Cyan" x="374" y="425">PSI</text>

            <text className={`${autoMode ? '' : 'Hide'} F24 Green LS1`} x="522" y="450">AUTO</text>
            <text className="F24 White LS2" x="606" y="450">CAB V/S</text>
            <text id="CabinVerticalSpeed" className="F29 Green EndAlign" x="660" y="484">{!autoMode ? Math.round(cabinVs / 50) * 50 : Math.abs(Math.round(cabinVs / 50) * 50)}</text>
            <text className="F22 Cyan" x="664" y="484">FT/MIN</text>

            <text className={`${autoMode ? '' : 'Hide'} F24 Green LS1`} x="520" y="585">AUTO</text>
            <text className="F24 White LS2" x="605" y="585">CAB ALT</text>
            <text id="CabinAltitude" className="F29 Green EndAlign" x="652" y="616">{Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 : 0}</text>
            <text className="F22 Cyan" x="661" y="616">FT</text>

            {/* TODO */}
            { /*
            <g
                id="vsArrow"
                className={(cabinVs * 60 <= -25 || cabinVs * 60 >= 25) && autoMode ? '' : 'Hide'}
                transform={cabinVs * 60 <= -25 ? 'translate(0, 795) scale(1, -1)' : 'scale(1, 1)'}
            >
                <path d="M433,405 h7 L446,395" className="Green SW2 NoFill" strokeLinejoin="miter" />
                <polygon points="452,388 447,396 457,396" transform="rotate(38,452,388)" className="Green SW2 NoFill" />
            </g>
            */}
        </>
    );
};

export default CruisePressure;
