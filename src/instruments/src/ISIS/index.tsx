import React, { useEffect, useRef, useState } from 'react';
import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { render } from '../Common';
import { ISISDisplayUnit } from './ISISDisplayUnit';
import { ArtificialHorizonDisplay } from './ArtificialHorizonDisplay';
import { BugSetupDisplay } from './BugSetupDisplay';
import { useBugs } from './Bug';
import { AutoBrightness } from './AutoBrightness';

import './style.scss';

export const ISISDisplay: React.FC = () => {
    const [ias] = useSimVar('AIRSPEED INDICATED', 'knots', 200);
    const [bugsActive, setBugsActive] = useInteractionSimVar('L:A32NX_ISIS_BUGS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_BUGS_PRESSED');
    const isBrightnessUpPressed = useRef(false);
    const isBrightnessDownPressed = useRef(false);

    const lastPilotInput = useRef(0);
    const [bugs, bugSetters] = useBugs();

    const [selectedIndex, setSelectedIndex] = useState(5);
    const selectedBug = bugs[selectedIndex];

    useInteractionEvent('A32NX_ISIS_KNOB_PRESSED', () => {
        lastPilotInput.current = Date.now();

        selectedBug.isActive = !selectedBug.isActive;
        bugSetters[selectedIndex](selectedBug);
    });

    useInteractionEvent('A32NX_ISIS_KNOB_CLOCKWISE', () => {
        lastPilotInput.current = Date.now();
        if (!selectedBug.isActive) {
            return;
        }

        if (selectedBug.value >= selectedBug.max) {
            return;
        }

        selectedBug.value = Math.max(Math.min(selectedBug.value + selectedBug.increment, selectedBug.max), selectedBug.min);
        bugSetters[selectedIndex](selectedBug);
    });

    useInteractionEvent('A32NX_ISIS_KNOB_ANTI_CLOCKWISE', () => {
        lastPilotInput.current = Date.now();
        if (!selectedBug.isActive) {
            return;
        }

        if (selectedBug.value <= selectedBug.min) {
            return;
        }

        selectedBug.value = Math.max(Math.min(selectedBug.value - selectedBug.increment, selectedBug.max), selectedBug.min);
        bugSetters[selectedIndex](selectedBug);
    });

    useInteractionEvent('A32NX_ISIS_PLUS_PRESSED', () => {
        lastPilotInput.current = Date.now();

        isBrightnessUpPressed.current = !isBrightnessUpPressed.current;
        if (!isBrightnessUpPressed.current) {
            return;
        }

        setSelectedIndex((7 + selectedIndex) % 6);
    });

    useInteractionEvent('A32NX_ISIS_MINUS_PRESSED', () => {
        lastPilotInput.current = Date.now();

        isBrightnessDownPressed.current = !isBrightnessDownPressed.current;
        if (!isBrightnessDownPressed.current) {
            return;
        }

        setSelectedIndex((5 + selectedIndex) % 6);
    });

    useEffect(() => {
        if (bugsActive) {
            lastPilotInput.current = Date.now();
        }
    }, [bugsActive]);

    useEffect(() => {
        if (bugsActive && Date.now() - lastPilotInput.current > 15000) {
            setBugsActive(false);
        }
    });

    return (
        <AutoBrightness bugsActive={bugsActive}>
            <ISISDisplayUnit indicatedAirspeed={ias.toFixed(2)}>
                <svg id="ISIS" className="ISIS" version="1.1" viewBox="0 0 512 512">
                    {bugsActive
                        ? <BugSetupDisplay bugs={bugs} selectedIndex={selectedIndex} />
                        : <ArtificialHorizonDisplay indicatedAirspeed={ias.toFixed(2)} bugs={bugs} />}
                </svg>
            </ISISDisplayUnit>
        </AutoBrightness>
    );
};

render(<ISISDisplay />);
