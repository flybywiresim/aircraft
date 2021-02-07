import React from 'react';
import { VhfRadioPanel } from './VhfRadioPanel';
import { RadioPanelDisplay } from './RadioPanelDisplay';
import { useSimVar } from '../../Common/SimVarProvider';
import { useInteractionEvent } from '../../Common/ReactInstrument';

/**
 *
 */
interface RadioPanelProps {
    side: string
}

/**
 *
 */
export const RootRadioPanel = (props: RadioPanelProps) => {
    const [powerAvailable] = useSimVar(`L:${props.side === 'L' ? 'D' : 'A'}CPowerAvailable`, 'Boolean', 250);
    const [panelSwitch] = useSimVar(`L:A32NX_RMP_${props.side}_TOGGLE_SWITCH`, "Boolean", 175);
    const powered = powerAvailable && panelSwitch;

    if (!powered) return <UnpoweredRadioPanel />;
    return <PoweredRadioPanel side={props.side} />;
}

/**
 * If a radio panel is unpowered, we render two empty <svg> to ensure the correct vertical spacing.
 * E.g. if left RMP is off but right RMP is on, we need the left RMP space to be reserved.
 */
const UnpoweredRadioPanel = () => {
    return (
        <span>
            <svg />
            <svg />
        </span>
    );
};

/**
 *
 */
const PoweredRadioPanel = (props: RadioPanelProps) => {
    const [panelMode, setPanelMode] = useSimVar(`L:A32NX_RMP_${props.side}_SELECTED_MODE`, "Number", 250);

    // Hook radio management panel mode buttons to set panelMode SimVar.
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF1_BUTTON_PRESSED`, () => setPanelMode(1));
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF2_BUTTON_PRESSED`, () => setPanelMode(2));
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF3_BUTTON_PRESSED`, () => setPanelMode(3));

    // This means we're in a VHF communications mode.
    if (panelMode === 1 || panelMode === 2 || panelMode === 3)
        return (<VhfRadioPanel side={props.side} transciever={panelMode} />);

    // If we reach this block, something's gone wrong. We'll just render a broken panel.
    return (
        <span>
            <RadioPanelDisplay value="808.080" />
            <RadioPanelDisplay value="808.080" />
        </span>
    );
}
