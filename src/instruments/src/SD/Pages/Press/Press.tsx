import React, { FC, useState, useEffect } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { useSimVar } from '../../../Common/simVars';
import { SvgGroup } from '../../Common/SvgGroup';

import './Press.scss';

setIsEcamPage('press_page');

export const PressPage: FC = () => {
    console.log('Pressure');

    return (
        <EcamPage name="main-press">
            <PageTitle x={6} y={18} text="CAB PRESS" />
            <PressureComponent />

            <SvgGroup x={0} y={0}>
                <polyline className="AirPressureShape" points="140,460 140,450 75,450 75,280 540,280 540,300" />
                <polyline className="AirPressureShape" points="180,457 180,450 265,450 265,457" />
                <polyline className="AirPressureShape" points="305,460 305,450 380,450" />
                <polyline className="AirPressureShape" points="453,450 540,450 540,380 550,380" />
                <line className="AirPressureShape" x1="540" y1="340" x2="547" y2="340" />
            </SvgGroup>

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

        </>
    );
};

render(<PressPage />);
