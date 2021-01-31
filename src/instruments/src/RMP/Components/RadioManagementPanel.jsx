import { useInteractionEvent } from '../../util.mjs';
import { StandbyFrequency } from './StandbyFrequency.jsx';
import { SevenSegmentDisplay } from './SevenSegmentDisplay.jsx';
import { StatefulSimVar } from '../Framework/StatefulSimVar.mjs';

/**
 * Instantiates all the RMP frequency-related stateful SimVars.
 * Should only be called from a React component!
 */
function createFrequencyModeVariables(side) {
    return {
        vhf1: {
            active: new StatefulSimVar({
                simVarGetter: 'COM ACTIVE FREQUENCY:1',
                simVarSetter: 'K:COM_RADIO_SET_HZ',
                simVarUnit: 'Hz',
            }),
            standby: new StatefulSimVar({
                simVarGetter: (side === 'L') ? 'COM STANDBY FREQUENCY:1' : `L:A32NX_RMP_${side}_VHF1_STANDBY_FREQUENCY`,
                simVarSetter: (side === 'L') ? 'K:COM_STBY_RADIO_SET_HZ' : undefined,
                simVarUnit: 'Hz',
            }),
        },

        vhf2: {
            active: new StatefulSimVar({
                simVarGetter: 'COM ACTIVE FREQUENCY:2',
                simVarSetter: 'K:COM2_RADIO_SET_HZ',
                simVarUnit: 'Hz',
            }),
            standby: new StatefulSimVar({
                simVarGetter: (side === 'R') ? 'COM STANDBY FREQUENCY:2' : `L:A32NX_RMP_${side}_VHF2_STANDBY_FREQUENCY`,
                simVarSetter: (side === 'R') ? 'K:COM2_STBY_RADIO_SET_HZ' : undefined,
                simVarUnit: 'Hz',
            }),
        },

        vhf3: {
            active: new StatefulSimVar({
                simVarGetter: 'COM ACTIVE FREQUENCY:3',
                simVarSetter: 'K:COM3_RADIO_SET_HZ',
                simVarUnit: 'Hz',
            }),
            standby: new StatefulSimVar({
                // Future proofing for a potential RMP3 on side C.
                simVarGetter: (side === 'C') ? 'COM STANDBY FREQUENCY:3' : `L:A32NX_RMP_${side}_VHF3_STANDBY_FREQUENCY`,
                simVarSetter: (side === 'C') ? 'K:COM3_STBY_RADIO_SET_HZ' : undefined,
                simVarUnit: 'Hz',
            }),
        },
    };
}

/**
 * Hook mode buttons to edit panelModeVariable.
 * @param {*} panelModeVariable
 */
function usePanelModeSelectionButtonEvents(panelModeVariable, side, powered) {
    useInteractionEvent(`A32NX_RMP_${side}_VHF1_BUTTON_PRESSED`, () => {
        if (powered) panelModeVariable.value = 1;
    });
    useInteractionEvent(`A32NX_RMP_${side}_VHF2_BUTTON_PRESSED`, () => {
        if (powered) panelModeVariable.value = 2;
    });
    useInteractionEvent(`A32NX_RMP_${side}_VHF3_BUTTON_PRESSED`, () => {
        if (powered) panelModeVariable.value = 3;
    });
}

/**
 * Render the VHF displays.
 * @param {*} frequencyVariables
 * @param {*} mode
 * @param {*} props
 */
function renderVhfDisplays(frequencyVariables, mode, props) {
    return (
        <span>
            <SevenSegmentDisplay value={frequencyVariables[mode].active.value} lightsTest={props.lightsTest} />
            <StandbyFrequency variable={frequencyVariables[mode].standby} side={props.side} lightsTest={props.lightsTest} />
        </span>
    );
}

export function RadioManagementPanel(props) {
    const frequencyVariables = createFrequencyModeVariables(props.side);

    const panelModeVariable = new StatefulSimVar({
        simVarGetter: `L:A32NX_RMP_${props.side}_SELECTED_MODE`,
        refreshRate: 250,
    });

    const panelSwitchVariable = new StatefulSimVar({
        simVarGetter: `L:A32NX_RMP_${props.side}_TOGGLE_SWITCH`,
        simVarUnit: 'Bool',
        refreshRate: 250,
    });

    const powerAvailVariable = new StatefulSimVar({
        // Left RMP is on DC bus, others are on AC bus.
        simVarGetter: (props.side === 'L') ? 'L:DCPowerAvailable' : 'L:ACPowerAvailable',
        simVarUnit: 'Boolean',
        refreshRate: 250,
    });

    // Powered if electrical power avail and toggle switch is ON.
    const powered = panelSwitchVariable.value && powerAvailVariable.value;

    // Hook mode buttons to update panelModeVariable.
    usePanelModeSelectionButtonEvents(panelModeVariable, props.side, powered);

    // Mode is selected by the panelMode SimVar.
    let mode = undefined;
    if (panelModeVariable.value === 1) mode = 'vhf1';
    if (panelModeVariable.value === 2) mode = 'vhf2';
    if (panelModeVariable.value === 3) mode = 'vhf3';

    // Stop refreshing unused variables, refresh used ones.
    for (const [key] of Object.entries(frequencyVariables)) {
        // RefreshRate of 0 means no refreshing.
        const variableRefreshRate = (key === mode) ? 250 : 0;
        frequencyVariables[key].active.setRefreshRate(variableRefreshRate);
        frequencyVariables[key].standby.setRefreshRate(variableRefreshRate);
    }

    // Handle Transfer Button Pressed.
    useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
        if (!powered || mode === undefined) return;
        // @todo will become more complex with Nav mode (due to course "submode").
        const previousStandbyValue = frequencyVariables[mode].standby.value;
        frequencyVariables[mode].standby.value = frequencyVariables[mode].active.value;
        frequencyVariables[mode].active.value = previousStandbyValue;
    });

    // If the panel is not powered, render two <svg> for spacing.
    if (!powered) {
        return (
            <span>
                <svg />
                <svg />
            </span>
        );
    }

    if (mode === 'vhf1' || mode === 'vhf2' || mode === 'vhf3') {
        return renderVhfDisplays(frequencyVariables, mode, props);
    }

    // If we get here, something's gone wrong, we'll just render 888.888
    return (
        <span>
            <SevenSegmentDisplay lightsTest />
            <SevenSegmentDisplay lightsTest />
        </span>
    );
}
