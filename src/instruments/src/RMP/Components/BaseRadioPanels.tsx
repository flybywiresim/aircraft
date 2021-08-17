import React from 'react';
import { useSimVar, useInteractionSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { VhfRadioPanel } from './VhfRadioPanel';
import { RadioPanelDisplay } from './RadioPanelDisplay';

interface Props {
    /**
     * The RMP side (e.g. 'L' or 'R').
     */
    side: string,
}

/**
 * Root radio management panel React component.
 * Hooks into toggleSwitch and powerAvailable SimVars.
 * Renders a Powered or Unpowered sub-component.
 */
export const RootRadioPanel = (props: Props) => {
    const toggleSwitchName = `A32NX_RMP_${props.side}_TOGGLE_SWITCH`;
    const [panelSwitch] = useInteractionSimVar(`L:${toggleSwitchName}`, 'Boolean', toggleSwitchName);
    // On the A320 the captain's RMP is powered by the DC ESS BUS. The F/O's RMP by the DC 2 BUS.
    const [powerAvailable] = useSimVar(`L:A32NX_ELEC_${props.side === 'L' ? 'DC_ESS' : 'DC_2'}_BUS_IS_POWERED`, 'Boolean', 250);
    const powered = powerAvailable && panelSwitch;

    if (!powered) return <UnpoweredRadioPanel />;
    return <PoweredRadioPanel side={props.side} />;
};

/**
 * If a radio panel is unpowered, we render two empty <svg> to ensure the correct vertical spacing.
 * E.g. if left RMP is off but right RMP is on, we need the left RMP space to be reserved.
 */
const UnpoweredRadioPanel = () => (
    <span>
        <svg />
        <svg />
    </span>
);

/**
 * Powered radio management panel React component.
 * Hooks into panelMode SimVar and wires RMP mode buttons.
 * Renders appropriate mode sub-component (e.g. VhfRadioPanel).
 */
const PoweredRadioPanel = (props: Props) => {
    const [panelMode, setPanelMode] = useSimVar(`L:A32NX_RMP_${props.side}_SELECTED_MODE`, 'number', 250);

    // Hook radio management panel mode buttons to set panelMode SimVar.
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF1_BUTTON_PRESSED`, () => setPanelMode(1));
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF2_BUTTON_PRESSED`, () => setPanelMode(2));
    useInteractionEvent(`A32NX_RMP_${props.side}_VHF3_BUTTON_PRESSED`, () => setPanelMode(3));

    // This means we're in a VHF communications mode.
    if (panelMode === 1 || panelMode === 2 || panelMode === 3) return (<VhfRadioPanel side={props.side} transceiver={panelMode} />);

    // If we reach this block, something's gone wrong. We'll just render a broken panel.
    return (
        <span>
            <RadioPanelDisplay value="808.080" />
            <RadioPanelDisplay value="808.080" />
        </span>
    );
};
