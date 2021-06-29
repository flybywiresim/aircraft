import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { render } from '../Common';
import { ISISDisplayUnit } from './ISISDisplayUnit';
import { ArtificialHorizonDisplay } from './ArtificialHorizonDisplay';
import { BugSetupDisplay } from './BugSetupDisplay';
import { initialBugs } from './Bug';

import './style.scss';

export const ISISDisplay: React.FC = () => {
    const [ias] = useSimVar('AIRSPEED INDICATED', 'knots');
    const [bugsActive, setBugsActive] = useSimVar('L:A32NX_ISIS_BUGS_ACTIVE', 'enum');
    const [mode, setMode] = useState('AHI');
    const [isBrightnessUpPressed, setIsBrightnessUpPressed] = useState(false);
    const [isBrightnessDownPressed, setIsBrightnessDownPressed] = useState(false);

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
        setIsBrightnessUpPressed(!isBrightnessUpPressed);
        if (isBrightnessUpPressed) {
            return;
        }

        setSelectedIndex((7 + selectedIndex) % 6);
    });

    useInteractionEvent('A32NX_ISIS_MINUS_PRESSED', () => {
        setIsBrightnessDownPressed(!isBrightnessDownPressed);
        if (isBrightnessDownPressed) {
            return;
        }

        setSelectedIndex((5 + selectedIndex) % 6);
    });

    // TODO: Automatically switch away from BUGS after 15s of no pilot input
    useInteractionEvent('A32NX_ISIS_BUGS_PRESSED', () => {
        if (mode === 'AHI') {
            setBugsActive(1);
            setMode('BUG');
        } else {
            setBugsActive(0);
            setMode('AHI');
        }
    });

    return (
        <ISISDisplayUnit indicatedAirspeed={ias}>
            <svg className="isis-svg" version="1.1" viewBox="0 0 512 512">
                {{
                    AHI: <ArtificialHorizonDisplay indicatedAirspeed={ias} bugs={bugs} />,
                    BUG: <BugSetupDisplay bugs={bugs} selectedIndex={selectedIndex} />,
                }[mode]}
            </svg>
        </ISISDisplayUnit>
    );
};

render(<ISISDisplay />);
