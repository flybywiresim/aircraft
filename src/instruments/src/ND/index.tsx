import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { FlightPlanProvider } from '@instruments/common/flightplan';
import { useSimVar } from '@instruments/common/simVars';
import { Knots } from '@typings/types';
import { render } from '../Common';
import { ArcMode } from './pages/ArcMode';
import { WindIndicator } from './elements/WindIndicator';
import { SpeedIndicator } from './elements/SpeedIndicator';
import { RadioNavInfo } from './elements/RadioNavInfo';
import { Chrono } from './elements/Chrono';
import { NavigationDisplayMessages } from './elements/NavigationDisplayMessages';

import './styles.scss';
import { PlanMode } from './pages/PlanMode';
import { RoseMode } from './pages/RoseMode';

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

    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude');
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude');

    const ppos = { lat, long };

    const [rangeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);
    const [modeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_MODE' : 'L:A32NX_EFIS_R_ND_MODE', 'number', 100);

    const [tas] = useSimVar('AIRSPEED TRUE', 'knots', 500);
    // TODO FIXME Proper ADIRS
    const adirsState = true;

    return (
        <DisplayUnit
            electricitySimvar={displayIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={displayIndex === 1 ? 89 : 91}
        >
            <FlightPlanProvider>
                <svg className="nd-svg" version="1.1" viewBox="0 0 768 768">
                    <SpeedIndicator adirsState={2} tas={tas} />
                    <WindIndicator adirsState={2} tas={tas} />

                    {modeIndex === Mode.PLAN && <PlanMode rangeSetting={rangeSettings[rangeIndex]} ppos={ppos} efisOption={efisOption} />}
                    {modeIndex === Mode.ARC && <ArcMode adirsState={adirsState} rangeSetting={rangeSettings[rangeIndex]} side={side} ppos={ppos} efisOption={efisOption} />}
                    {(modeIndex === Mode.ROSE_ILS || modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_NAV)
                    && <RoseMode adirsState={adirsState} rangeSetting={rangeSettings[rangeIndex]} side={side} ppos={ppos} mode={modeIndex} efisOption={efisOption} />}

                    <Chrono side={side} />

                    <NavigationDisplayMessages adirsState={adirsState} rangeSetting={rangeSettings[rangeIndex]} mode={modeIndex} />
                    {(adirsState) && (
                        <>
                            <RadioNavInfo index={1} side={side} />
                            <RadioNavInfo index={2} side={side} />
                        </>
                    )}
                </svg>
            </FlightPlanProvider>
        </DisplayUnit>
    );
};

export type AdirsTasDrivenIndicatorProps = {
    adirsState: number,
    tas: Knots,
}

render(<NavigationDisplay />);
