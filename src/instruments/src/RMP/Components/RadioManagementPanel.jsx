import { useInteractionEvent } from '../../util.mjs';
import { StandbyFrequency } from './StandbyFrequency.jsx';
import { SevenSegmentDisplay } from './SevenSegmentDisplay.jsx';
import { StatefulSimVar } from '../Framework/StatefulSimVar.mjs';

/**
 * Instantiates all the RMP frequency-related stateful SimVars.
 * Should only be called from a React component!
 */
function createFrequencyModeVariables() {
    return {
        vhf1: {
            active: new StatefulSimVar({
                simVarGetter: `COM ACTIVE FREQUENCY:1`,
                simVarSetter: `K:COM_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
            standby: new StatefulSimVar({
                simVarGetter: `COM STANDBY FREQUENCY:1`,
                simVarSetter: `K:COM_STBY_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
        },

        vhf2: {
            active: new StatefulSimVar({
                simVarGetter: `COM ACTIVE FREQUENCY:2`,
                simVarSetter: `K:COM2_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
            standby: new StatefulSimVar({
                simVarGetter: `COM STANDBY FREQUENCY:2`,
                simVarSetter: `K:COM2_STBY_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
        },
    }
}

export function RadioManagementPanel(props) {
    const panelPoweredVariable = new StatefulSimVar({
        simVarGetter: `L:XMLVAR_RMP_${props.side}_On`,
        simVarUnit: "Bool",
        refreshRate: 1500,
    });

    // Currently fixed vhf1 for left and vhf2 for right.
    const mode = (props.side === "R") ? "vhf2" : "vhf1";
    const frequencyVariables = createFrequencyModeVariables();

    // Handle Transfer Button Pressed.
    useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
        // @todo will become more complex with Nav mode (due to course "submode").
        const previousStandbyValue = frequencyVariables[mode].standby.value;
        frequencyVariables[mode].standby.value = frequencyVariables[mode].active.value;
        frequencyVariables[mode].active.value = previousStandbyValue;
    });

    return (<span className={panelPoweredVariable.value ? "" : "rmp-unpowered"}>
        <SevenSegmentDisplay value={frequencyVariables[mode].active.value} lightsTest={props.lightsTest}/>
        <StandbyFrequency variable={frequencyVariables[mode].standby} side={props.side} lightsTest={props.lightsTest} />
    </span>);
}
