import React, { useEffect, useRef, useState } from 'react';
import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { useInterval } from '@flybywiresim/react-components';
import { render } from '../Common';
import { ISISDisplayUnit } from './ISISDisplayUnit';
import { ArtificialHorizonDisplay } from './ArtificialHorizonDisplay';
import { BugSetupDisplay } from './BugSetupDisplay';
import { initialBugs } from './Bug';
import { AutoBrightness } from './AutoBrightness';

import './style.scss';

export const ISISDisplay: React.FC = () => {
    const [ias] = useSimVar('AIRSPEED INDICATED', 'knots');
    const [bugsActive] = useInteractionSimVar('L:A32NX_ISIS_BUGS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_BUGS_PRESSED');
    const isBrightnessUpPressed = useRef(false);
    const isBrightnessDownPressed = useRef(false);

    const [bugs, setBugs] = useState(initialBugs);
    const [selectedIndex, setSelectedIndex] = useState(5);
    const selectedBug = bugs[selectedIndex];

    useInteractionEvent('A32NX_ISIS_KNOB_PRESSED', () => {
        selectedBug.isActive = !selectedBug.isActive;
        setBugs(bugs);
    });

    useInteractionEvent('A32NX_ISIS_KNOB_CLOCKWISE', () => {
        if (selectedBug.value >= selectedBug.max) {
            return;
        }

        selectedBug.value = Math.max(Math.min(selectedBug.value + selectedBug.increment, selectedBug.max), selectedBug.min);
        setBugs(bugs);
    });

    useInteractionEvent('A32NX_ISIS_KNOB_ANTI_CLOCKWISE', () => {
        if (selectedBug.value <= selectedBug.min) {
            return;
        }

        selectedBug.value = Math.max(Math.min(selectedBug.value - selectedBug.increment, selectedBug.max), selectedBug.min);
        setBugs(bugs);
    });

    useInteractionEvent('A32NX_ISIS_PLUS_PRESSED', () => {
        isBrightnessUpPressed.current = !isBrightnessUpPressed.current;
        if (!isBrightnessUpPressed.current) {
            return;
        }

        setSelectedIndex((7 + selectedIndex) % 6);
    });

    useInteractionEvent('A32NX_ISIS_MINUS_PRESSED', () => {
        isBrightnessDownPressed.current = !isBrightnessDownPressed.current;
        if (!isBrightnessDownPressed.current) {
            return;
        }

        setSelectedIndex((5 + selectedIndex) % 6);
    });

    return (
        <AutoBrightness bugsActive={bugsActive}>
            <ISISDisplayUnit indicatedAirspeed={ias}>
                <svg className="isis-svg" version="1.1" viewBox="0 0 512 512">
                    {bugsActive
                        ? <BugSetupDisplay bugs={bugs} selectedIndex={selectedIndex} />
                        : <ArtificialHorizonDisplay indicatedAirspeed={ias} bugs={bugs} />}
                </svg>
            </ISISDisplayUnit>
        </AutoBrightness>
    );
};

render(<ISISDisplay />);
