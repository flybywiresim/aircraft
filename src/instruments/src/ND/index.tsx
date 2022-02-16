import React, { useEffect, useRef, useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { FlightPlanProvider } from '@instruments/common/flightplan';
import { useSimVar } from '@instruments/common/simVars';
import { useArinc429Var } from '@instruments/common/arinc429';
import { getSupplier } from '@instruments/common/utils';
import { useCoherentEvent } from '@instruments/common/hooks';
import { Mode, NdSymbol, rangeSettings } from '@shared/NavigationDisplay';
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

const NavigationDisplay: React.FC = () => {
    const [displayIndex] = useState(() => {
        const url = document.getElementsByTagName('a32nx-nd')[0].getAttribute('url');

        return parseInt(url?.substring(url.length - 1) ?? '1', 10);
    });
    const side = displayIndex === 1 ? 'L' : 'R';
    const [airDataSwitch] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum', 200);
    const [attHdgSwitch] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum', 200);
    const [airDataReferenceSource, setAirDataSource] = useState(displayIndex);
    const [inertialReferenceSource, setInertialSource] = useState(displayIndex);

    useEffect(() => {
        setAirDataSource(getSupplier(displayIndex, airDataSwitch));
    }, [airDataSwitch]);

    useEffect(() => {
        setInertialSource(getSupplier(displayIndex, attHdgSwitch));
    }, [attHdgSwitch]);

    const arincLat = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LATITUDE`, 200);
    const arincLong = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LONGITUDE`, 200);
    const adirsAlign = arincLat.isNormalOperation() && arincLong.isNormalOperation();

    const ppos = (adirsAlign) ? { lat: arincLat.value, long: arincLong.value } : { lat: NaN, long: NaN };

    const [rangeIndex] = useSimVar(displayIndex === 1 ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);
    const [modeIndex] = useSimVar(displayIndex === 1 ? 'L:A32NX_EFIS_L_ND_MODE' : 'L:A32NX_EFIS_R_ND_MODE', 'number', 100);

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

    const [symbols, setSymbols] = useState<NdSymbol[]>([]);

    useCoherentEvent(`A32NX_EFIS_${side}_SYMBOLS`, (symbols) => {
        setSymbols(symbols);
    });

    return (
        <DisplayUnit
            electricitySimvar={displayIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={displayIndex === 1 ? 89 : 91}
        >
            <FlightPlanProvider>
                <svg className="nd-svg" version="1.1" viewBox="0 0 768 768">
                    <SpeedIndicator adrs={airDataReferenceSource} irs={inertialReferenceSource} />
                    <WindIndicator adrs={airDataReferenceSource} irs={inertialReferenceSource} />

                    {modeIndex === Mode.PLAN && (
                        <PlanMode
                            adirsAlign={adirsAlign}
                            rangeSetting={rangeSettings[rangeIndex]}
                            symbols={symbols}
                            ppos={ppos}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}
                    {modeIndex === Mode.ARC && (
                        <ArcMode
                            adirsAlign={adirsAlign}
                            rangeSetting={rangeSettings[rangeIndex]}
                            symbols={symbols}
                            side={side}
                            ppos={ppos}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}
                    {(modeIndex === Mode.ROSE_ILS || modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_NAV)
                    && (
                        <RoseMode
                            adirsAlign={adirsAlign}
                            rangeSetting={rangeSettings[rangeIndex]}
                            symbols={symbols}
                            side={side}
                            ppos={ppos}
                            mode={modeIndex}
                            mapHidden={modeChangeShown || rangeChangeShown}
                        />
                    )}

                    <Chrono side={side} />

                    <NavigationDisplayMessages adirsAlign={adirsAlign} mode={modeIndex} modeChangeShown={modeChangeShown} rangeChangeShown={rangeChangeShown} />
                    {(adirsAlign && modeIndex !== Mode.PLAN) && (
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
