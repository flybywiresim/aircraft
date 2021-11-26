import { useSimVar } from "@instruments/common/simVars";

export const beforeTakeoffChecklist = {
    name: "BEFORE TAKEOFF",
    items: [
        {
            item: "FLIGHT CONTROLS",
            result: "CHECKED (BOTH)",
            condition: undefined,
        },
        {
            item: "FLT INST",
            result: "CHECKED (BOTH)",
            condition: undefined,
        },
        {
            item: "BRIEFING",
            result: "CONFIRMED",
            condition: undefined,
        },
        {
            item: "FLAP SETTING",
            result: "CONF ___ (BOTH)",
            condition: undefined,
        },
        {
            item: "V1. VR. V2/FLX TEMP",
            result: "___ SET",
            condition: undefined,
        },
        {
            item: "ECAM MEMO",
            result: "TO NO BLUE",
            condition: undefined,
        },
        {
            item: "",
            result: "",
            condition: undefined,
        },
        {
            item: "TAKEOFF RWY",
            result: "___ CONFIRMED (BOTH)",
            condition: undefined,
        },
        {
            item: "CABIN CREW",
            result: "ADVISED",
            condition: undefined,
        },
        {
            item: "TCAS",
            result: "TA OR TA/RA",
            condition: () => {
                const [v1] = useSimVar(
                    "L:A32NX_SWITCH_TCAS_POSITION",
                    "Number"
                );
                return v1 === 1 || v1 === 2;
            },
        },
        {
            item: "ENG MODE SEL",
            result: "AS RQRD",
            condition: undefined,
        },
        {
            item: "PACKS",
            result: "AS RQRD",
            condition: undefined,
        },
    ],
};
