// https://docs.flybywiresim.com/pilots-corner/a32nx-briefing/a32nx_api/

import { useSimVar } from "@instruments/common/simVars";

export const beforeStartChecklist = {
    name: "BEFORE START",
    items: [
        {
            item: "COCKPIT PREP",
            result: "COMPLETED (BOTH)",
            condition: undefined,
        },
        {
            item: "GEAR PINS and COVERS",
            result: "REMOVED",
            condition: undefined,
        },
        {
            item: "SIGNS",
            result: "ON/AUTO",
            condition: () => {
                const [v1] = useSimVar(
                    "L:XMLVAR_SWITCH_OVHD_INTLT_NONSMOKING_POSITION",
                    "Number"
                );
                const [v2] = useSimVar(
                    "L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION",
                    "Number"
                );
                return (v1 === 0 || v1 === 1) && (v2 === 0 || v2 === 1);
            },
        },
        {
            item: "ADIRS",
            result: "NAV",
            condition: () => {
                const [v1] = useSimVar(
                    "L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB",
                    "Number"
                );
                const [v2] = useSimVar(
                    "L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB",
                    "Number"
                );
                const [v3] = useSimVar(
                    "L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB",
                    "Number"
                );
                return v1 === 1 && v2 === 1 && v3 === 1;
            },
        },
        {
            item: "FUEL QUANTITY",
            result: "___ KG.LB",
            condition: undefined,
        },
        {
            item: "TO DATA",
            result: "SET",
            condition: undefined,
        },
        {
            item: "BARO REF",
            result: "SET (BOTH)",
            condition: undefined,
        },
        {
            item: "",
            result: "",
            condition: undefined,
        },
        {
            item: "WINDOWS/DOORS",
            result: "CLOSED (BOTH)",
            condition: undefined,
        },
        {
            item: "BEACON",
            result: "ON",
            condition: () => {
                const [v1] = useSimVar("LIGHT BEACON", "Number");
                return v1 === 1;
            },
        },
        {
            item: "THR LEVERS",
            result: "IDLE",
            // TODO: check idle values
            condition: undefined,
        },
        {
            item: "PARKING BREAK",
            result: "AS RQRD",
            condition: undefined,
        },
    ],
};
