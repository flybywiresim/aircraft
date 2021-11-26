import { useSimVar } from "@instruments/common/simVars";

export const parkingChecklist = {
    name: "PARKING",
    items: [
        {
            item: "APU BLEED",
            result: "ON",
            condition: () => {
                const [v1] = useSimVar(
                    "L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON",
                    "Number"
                );
                return v1 === 1;
            },
        },
        {
            item: "EGINES",
            result: "OFF",
            condition: undefined,
        },
        {
            item: "SEAT BELTS",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar(
                    "CABIN SEATBELTS ALERT SWITCH",
                    "Number"
                );
                return v1 === 0;
            },
        },
        {
            item: "EXT LT",
            result: "AS RQRD",
            condition: undefined,
        },
        {
            item: "FUEL PUMPS",
            result: "OFF",
            condition: () => {
                const [v1] = useSimVar("FUELSYSTEM PUMP ACTIVE:1", "Number");
                const [v2] = useSimVar("FUELSYSTEM PUMP ACTIVE:2", "Number");
                const [v3] = useSimVar("FUELSYSTEM PUMP ACTIVE:3", "Number");
                const [v4] = useSimVar("FUELSYSTEM PUMP ACTIVE:4", "Number");
                const [v5] = useSimVar("FUELSYSTEM PUMP ACTIVE:5", "Number");
                const [v6] = useSimVar("FUELSYSTEM PUMP ACTIVE:6", "Number");
                return (
                    v1 === 0 &&
                    v2 === 0 &&
                    v3 === 0 &&
                    v4 === 0 &&
                    v5 === 0 &&
                    v6 === 0
                );
            },
        },
        {
            item: "PARK BREAK and CHOCKS",
            result: "AS RQRD",
            condition: undefined,
        },
    ],
};
