import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { FlightPlanProvider } from '@instruments/common/flightplan';
import { useSimVar } from '@instruments/common/simVars';
import { Knots } from '@typings/types';
import { ADIRS } from '@instruments/common/adirs';
import { render } from '../Common';
import { ArcMode } from './pages/ArcMode';
import { WindIndicator } from './elements/WindIndicator';
import { SpeedIndicator } from './elements/SpeedIndicator';
import { RadioNavInfo } from './elements/RadioNavInfo';
import { Chrono } from './elements/Chrono';
import { NavigationDisplayMessages } from './elements/messages/NavigationDisplayMessages';
import { FMMessages } from './elements/messages/FMMessages';
import { TcasWxrMessages } from './elements/messages/TcasWxrMessages';
import { PlanMode } from './pages/PlanMode';
import { RoseMode } from './pages/RoseMode';

import './styles.scss';

export type RangeSetting = 10 | 20 | 40 | 80 | 160 | 320;

export const rangeSettings: RangeSetting[] = [10, 20, 40, 80, 160, 320];

export enum Mode {
    ROSE_ILS,
    ROSE_VOR,
    ROSE_NAV,
    ARC,
    PLAN,
}

export type EfisSide = 'L' | 'R'

export enum EfisOption {
    None = 0,
    Constraints = 1,
    VorDmes = 2,
    Waypoints = 3,
    Ndbs = 4,
    Airports = 5,
}

const NavigationDisplay: React.FC = () => {
    const [displayIndex] = useState(() => {
        const url = document.getElementsByTagName('a32nx-nd')[0].getAttribute('url');

        return parseInt(url?.substring(url.length - 1) ?? '1', 10);
    });

    const side = displayIndex === 1 ? 'L' : 'R';

    const [efisOption] = useSimVar(`L:A32NX_EFIS_${side}_OPTION`, 'enum', 500);
    const adirsAlign = !ADIRS.mapNotAvailable(displayIndex);
    const airDataReferenceSource = ADIRS.getNdAirDataReferenceSource(displayIndex);
    const inertialReferenceSource = ADIRS.getNdInertialReferenceSource(displayIndex);
    const lat = ADIRS.getLatitude();
    const long = ADIRS.getLongitude();

    const ppos = { lat, long };

    const [rangeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);
    const [modeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_MODE' : 'L:A32NX_EFIS_R_ND_MODE', 'number', 100);

    return (
        <DisplayUnit
            electricitySimvar={displayIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={displayIndex === 1 ? 89 : 91}
        >
            <FlightPlanProvider>
                <svg className="nd-svg" version="1.1" viewBox="0 0 768 768">
                    <SpeedIndicator adrs={airDataReferenceSource} irs={inertialReferenceSource} />
                    <WindIndicator irs={inertialReferenceSource} />

                    {modeIndex === Mode.PLAN && (
                        <PlanMode rangeSetting={rangeSettings[rangeIndex]} ppos={ppos} efisOption={efisOption} />
                    )}
                    {modeIndex === Mode.ARC && (
                        <ArcMode adirsAlign={adirsAlign} rangeSetting={rangeSettings[rangeIndex]} side={side} ppos={ppos} efisOption={efisOption} />
                    )}
                    {(modeIndex === Mode.ROSE_ILS || modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_NAV)
                    && (
                        <RoseMode adirsAlign={adirsAlign} rangeSetting={rangeSettings[rangeIndex]} side={side} ppos={ppos} mode={modeIndex} efisOption={efisOption} />
                    )}

                    <Chrono side={side} />

                    <NavigationDisplayMessages adirsAlign={adirsAlign} rangeSetting={rangeSettings[rangeIndex]} mode={modeIndex} />
                    {(adirsAlign) && (
                        <>
                            <RadioNavInfo index={1} side={side} />
                            <RadioNavInfo index={2} side={side} />
                        </>
                    )}
                    <TcasWxrMessages modeIndex={modeIndex} />
                    <FMMessages modeIndex={modeIndex} />

                </svg>
            </FlightPlanProvider>
        </DisplayUnit>
    );
};

export type AdirsTasDrivenIndicatorProps = {
    adrs: number,
    irs: number
}

render(<NavigationDisplay />);
