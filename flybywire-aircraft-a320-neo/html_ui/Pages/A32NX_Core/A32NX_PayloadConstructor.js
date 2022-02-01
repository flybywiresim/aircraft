class A32NX_PayloadConstructor {
    constructor() {
        this.paxStations = {
            rows1_6: {
                name: 'ROWS [1-6]',
                seats: 36,
                weight: 3024,
                pax: 0,
                paxTarget: 0,
                stationIndex: 0 + 1,
                position: 21.98,
                seatsRange: [1, 36],
                simVar: "A32NX_PAX_TOTAL_ROWS_1_6"
            },
            rows7_13: {
                name: 'ROWS [7-13]',
                seats: 42,
                weight: 3530,
                pax: 0,
                paxTarget: 0,
                stationIndex: 1 + 1,
                position: 2.86,
                seatsRange: [37, 78],
                simVar: "A32NX_PAX_TOTAL_ROWS_7_13"
            },
            rows14_21: {
                name: 'ROWS [14-21]',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 2 + 1,
                position: -15.34,
                seatsRange: [79, 126],
                simVar: "A32NX_PAX_TOTAL_ROWS_14_21"
            },
            rows22_29: {
                name: 'ROWS [22-29]',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 3 + 1,
                position: -32.81,
                seatsRange: [127, 174],
                simVar: "A32NX_PAX_TOTAL_ROWS_22_29"
            },
        };

        this.cargoStations = {
            fwdBag: {
                name: 'FWD BAGGAGE/CONTAINER',
                weight: 3402,
                load: 0,
                stationIndex: 4 + 1,
                position: 18.28,
                visible: true,
                simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
            },
            aftCont: {
                name: 'AFT CONTAINER',
                weight: 2426,
                load: 0,
                stationIndex: 5 + 1,
                position: -15.96,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_CONTAINER',
            },
            aftBag: {
                name: 'AFT BAGGAGE',
                weight: 2110,
                load: 0,
                stationIndex: 6 + 1,
                position: -27.10,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BAGGAGE',
            },
            aftBulk: {
                name: 'AFT BULK/LOOSE',
                weight: 1497,
                load: 0,
                stationIndex: 7 + 1,
                position: -37.35,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
            },
        };
    }
}
