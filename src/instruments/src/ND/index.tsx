import React, { useEffect, useRef, useState } from 'react';
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

    const [opacity] = useSimVar('L:A32NX_MFD_MASK_OPACITY', 'number', 100);

    const [modeChangeShown, setModeChangeShown] = useState(false);
    const [rangeChangeShown, setRangeChangeShown] = useState(false);

    const firstModeUpdate = useRef(true);
    const firstRangeUpdate = useRef(true);

    useEffect(() => {
        if (firstModeUpdate.current) {
            firstModeUpdate.current = false;
            return () => {};
        }

        setModeChangeShown(true);

        const timeout = setTimeout(() => {
            setModeChangeShown(false);
        }, 500); // TODO looks like this depends on range or number of symbols IRL

        return () => clearTimeout(timeout);
    }, [modeIndex]);

    useEffect(() => {
        if (firstRangeUpdate.current) {
            firstRangeUpdate.current = false;
            return () => {};
        }

        // RANGE CHANGE has priority over MODE CHANGE
        if (modeChangeShown) {
            setModeChangeShown(false);
        }
        setRangeChangeShown(true);

        const timeout = setTimeout(() => {
            setRangeChangeShown(false);
        }, 500); // TODO looks like this depends on range or number of symbols IRL

        return () => clearTimeout(timeout);
    }, [rangeIndex]);

    return (
        <DisplayUnit
            electricitySimvar={displayIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={displayIndex === 1 ? 89 : 91}
        >
            <div className="BacklightBleed" />
            <div className="LcdOverlayDcdu" style={{ opacity }} />
            <FlightPlanProvider>
                <svg className="nd-svg" version="1.1" viewBox="0 0 768 768">
                    <SpeedIndicator adrs={airDataReferenceSource} irs={inertialReferenceSource} />
                    <WindIndicator adrs={airDataReferenceSource} irs={inertialReferenceSource} />

                    {modeIndex === Mode.PLAN && (
                        <PlanMode
                            rangeSetting={rangeSettings[rangeIndex]}
                            ppos={ppos}
                            efisOption={efisOption}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}
                    {modeIndex === Mode.ARC && (
                        <ArcMode
                            adirsAlign={adirsAlign}
                            rangeSetting={rangeSettings[rangeIndex]}
                            side={side}
                            ppos={ppos}
                            efisOption={efisOption}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}
                    {(modeIndex === Mode.ROSE_ILS || modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_NAV)
                    && (
                        <RoseMode
                            adirsAlign={adirsAlign}
                            rangeSetting={rangeSettings[rangeIndex]}
                            side={side}
                            ppos={ppos}
                            mode={modeIndex}
                            efisOption={efisOption}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}

                    <Chrono side={side} />

                    <NavigationDisplayMessages adirsAlign={adirsAlign} mode={modeIndex} modeChangeShown={modeChangeShown} rangeChangeShown={rangeChangeShown} />
                    {(adirsAlign) && (
                        <>
                            <RadioNavInfo index={1} side={side} />
                            <RadioNavInfo index={2} side={side} />
                        </>
                    )}
                    <TcasWxrMessages modeIndex={modeIndex} />
                    <FMMessages modeIndex={modeIndex} side={side} />

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
