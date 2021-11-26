import { useSimVar } from "@instruments/common/simVars";

export const securingAircraftChecklist = {
    name: "SECURING AIRCRAFT",
    items: [
        {
            item: "ADIRS",
            result: "OFF",
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
                return v1 === 0 && v2 === 0 && v3 === 0;
            },
        },
        {
            item: "OXYGEN",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "A32NX_OXYGEN_PASSENGER_LIGHT_ON",
                    "Number"
                );
                // TODO - 0 does not see to work
                return v1 === 0;
            },
        },
        {
            item: "APU BLEED",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON",
                    "Number"
                );
                return v1 === 0;
            },
        },
        {
            item: "EMER EXIT LT",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION",
                    "Number"
                );
                return v1 === 2;
            },
        },
        {
            item: "SIGNS",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "CABIN SEATBELTS ALERT SWITCH",
                    "Number"
                );
                const [v2] = useSimVar(
                    "L:XMLVAR_SWITCH_OVHD_INTLT_NONSMOKING_POSITION",
                    "Number"
                );
                return v1 === 0 && v2 === 2;
            },
        },
        {
            item: "APU and BAT",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON",
                    "Number"
                );
                const [v2] = useSimVar(
                    "L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO",
                    "Number"
                );
                const [v3] = useSimVar(
                    "L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO",
                    "Number"
                );
                return v1 === 0 && v2 === 0 && v3 === 0;
            },
        },
    ],
};
