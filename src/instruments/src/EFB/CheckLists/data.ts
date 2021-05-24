export enum ECheckListTypes {
    STEP = 'step',
    NOTE = 'note',
    THE_LINE = 'the-line'
}

export const checklists = [
    {
        name: 'Before Start',
        items: [
            { type: ECheckListTypes.STEP, description: 'COCKPIT PREP', expectedResult: 'COMPLETED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'GEAR PINS and COVERS', expectedResult: 'REMOVED' },
            { type: ECheckListTypes.STEP, description: 'SIGNS', expectedResult: 'ON/AUTO' },
            { type: ECheckListTypes.STEP, description: 'ADIRS', expectedResult: 'NAV' },
            { type: ECheckListTypes.STEP, description: 'FUEL QUANTITY', expectedResult: '____KG.LB' },
            { type: ECheckListTypes.STEP, description: 'TO DATA', expectedResult: 'SET' },
            { type: ECheckListTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
            { type: ECheckListTypes.THE_LINE },
            { type: ECheckListTypes.STEP, description: 'WINDOWS/DOORS', expectedResult: 'CLOSED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'BEACON', expectedResult: 'ON' },
            { type: ECheckListTypes.STEP, description: 'THR LEVERS', expectedResult: 'IDLE' },
            { type: ECheckListTypes.STEP, description: 'PARKING BRAKE', expectedResult: 'AS RQRD' },

        ],
    },
    {
        name: 'After Start',
        items: [
            { type: ECheckListTypes.STEP, description: 'WINDOWS/DOORS', expectedResult: 'CLOSED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'BEACON', expectedResult: 'ON' },
            { type: ECheckListTypes.STEP, description: 'THR LEVERS', expectedResult: 'IDLE' },
            { type: ECheckListTypes.STEP, description: 'PARKING BRAKE', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'Before T/O',
        items: [
            { type: ECheckListTypes.STEP, description: 'FLIGHT CONTROLS', expectedResult: 'CHECKED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'FLT INST', expectedResult: 'CHECKED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'BRIEFING', expectedResult: 'CONFIRMED' },
            { type: ECheckListTypes.STEP, description: 'FLAP SETTING', expectedResult: 'CONF____(BOTH)' },
            { type: ECheckListTypes.STEP, description: 'V1, VR, V2/FLX TEMP', expectedResult: '____(BOTH)' },
            { type: ECheckListTypes.STEP, description: 'ATC', expectedResult: 'SET' },
            {
                type: ECheckListTypes.STEP,
                description: 'ECAM MEMO',
                expectedResult: 'TO NO BLUE',
                detailNotes: [
                    'AUTO BRK MAX',
                    'SIGNS ON',
                    'CABIN READY',
                    'SPLRS ARM',
                    'FLAPS TO',
                    'TO CONFIG NORM',
                ],
            },
            { type: ECheckListTypes.THE_LINE },
            { type: ECheckListTypes.STEP, description: 'TAKEOFF RWY', expectedResult: '____CONFIRMED (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'CABIN CREW', expectedResult: 'ADVISED' },
            { type: ECheckListTypes.STEP, description: 'TCAS', expectedResult: 'TA OR TA/RA' },
            { type: ECheckListTypes.STEP, description: 'ENG MODE SEL', expectedResult: 'AS RQRD' },
            { type: ECheckListTypes.STEP, description: 'PACKS', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'After T/O, CLMB',
        items: [
            { type: ECheckListTypes.STEP, description: 'LDG GEAR', expectedResult: 'UP' },
            { type: ECheckListTypes.STEP, description: 'FLAPS', expectedResult: 'RETRACTED' },
            { type: ECheckListTypes.STEP, description: 'PACKS', expectedResult: 'ON' },
            { type: ECheckListTypes.THE_LINE },
            { type: ECheckListTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
        ],
    },
    {
        name: 'APPR',
        items: [
            { type: ECheckListTypes.STEP, description: 'BRIEFING', expectedResult: 'CONFIRMED' },
            { type: ECheckListTypes.STEP, description: 'ECAM STATUS', expectedResult: 'CHECKED' },
            { type: ECheckListTypes.STEP, description: 'SEAT BELTS', expectedResult: 'ON' },
            { type: ECheckListTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'MINIMUM', expectedResult: '____SET (BOTH)' },
            { type: ECheckListTypes.STEP, description: 'ENG MODE SEL', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'LDG',
        items: [
            { type: ECheckListTypes.STEP, description: 'CABIN CREW', expectedResult: 'ADVISED' },
            { type: ECheckListTypes.STEP, description: 'A/THR', expectedResult: 'SPEED/OFF' },
            { type: ECheckListTypes.STEP, description: 'AUTOBRAKE', expectedResult: 'AS RQRD' },
            {
                type: ECheckListTypes.STEP,
                description: 'ECAM MEMO',
                expectedResult: 'LDG NO BLUE',
                detailNotes: [
                    'LDG GEAR DN', 'SIGNS ON', 'CABIN READY', 'SPLRS ARM', 'FLAPS SET',
                ],
            },
        ],
    },
    {
        name: 'After LDG',
        items: [
            { type: ECheckListTypes.STEP, description: 'FLAPS', expectedResult: 'RETRACTED' },
            { type: ECheckListTypes.STEP, description: 'SPOILERS', expectedResult: 'DISARMED' },
            { type: ECheckListTypes.STEP, description: 'APU', expectedResult: 'START' },
            { type: ECheckListTypes.STEP, description: 'RADAR', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'PREDICTIVE WINDSHEAR SYSTEM', expectedResult: 'OFF' },
        ],
    },
    {
        name: 'Parking',
        items: [
            { type: ECheckListTypes.STEP, description: 'APU BLEED', expectedResult: 'ON' },
            { type: ECheckListTypes.STEP, description: 'ENGINES', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'SEAT BELTS', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'EXT LT', expectedResult: 'EXT LT' },
            { type: ECheckListTypes.STEP, description: 'FUEL PUMPS', expectedResult: 'FUEL PUMPS' },
            { type: ECheckListTypes.STEP, description: 'PARK BRK and CHOCKS', expectedResult: 'AS RQRD' },
            { type: ECheckListTypes.NOTE, note: 'Consider HEAVY RAIN' },
        ],
    },
    {
        name: 'Securing',
        items: [
            { type: ECheckListTypes.STEP, description: 'ADIRS', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'OXYGEN', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'APU BLEED', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'EMER EXIT LT', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'SIGNS', expectedResult: 'OFF' },
            { type: ECheckListTypes.STEP, description: 'APU AND BAT', expectedResult: 'OFF' },
            { type: ECheckListTypes.NOTE, note: 'Consider COLD WEATHER' },
        ],
    },
];
