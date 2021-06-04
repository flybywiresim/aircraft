export enum EChecklistTypes {
    STEP = 'step',
    NOTE = 'note',
    THE_LINE = 'the-line'
}

type TChecklistItem = {
    type: EChecklistTypes,
    description?: string,
    expectedResult?: string,
    detailNotes?: Array<string>,
    note?: string
}

type TChecklist = {
    name: string,
    items: Array<TChecklistItem>
}

type TChecklistCollection = Array<TChecklist>;

export const checklistCollection: TChecklistCollection = [
    {
        name: 'Before Start',
        items: [
            { type: EChecklistTypes.STEP, description: 'COCKPIT PREP', expectedResult: 'COMPLETED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'GEAR PINS and COVERS', expectedResult: 'REMOVED' },
            { type: EChecklistTypes.STEP, description: 'SIGNS', expectedResult: 'ON/AUTO' },
            { type: EChecklistTypes.STEP, description: 'ADIRS', expectedResult: 'NAV' },
            { type: EChecklistTypes.STEP, description: 'FUEL QUANTITY', expectedResult: '____KG.LB' },
            { type: EChecklistTypes.STEP, description: 'TO DATA', expectedResult: 'SET' },
            { type: EChecklistTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
            { type: EChecklistTypes.THE_LINE },
            { type: EChecklistTypes.STEP, description: 'WINDOWS/DOORS', expectedResult: 'CLOSED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'BEACON', expectedResult: 'ON' },
            { type: EChecklistTypes.STEP, description: 'THR LEVERS', expectedResult: 'IDLE' },
            { type: EChecklistTypes.STEP, description: 'PARKING BRAKE', expectedResult: 'AS RQRD' },

        ],
    },
    {
        name: 'After Start',
        items: [
            { type: EChecklistTypes.STEP, description: 'WINDOWS/DOORS', expectedResult: 'CLOSED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'BEACON', expectedResult: 'ON' },
            { type: EChecklistTypes.STEP, description: 'THR LEVERS', expectedResult: 'IDLE' },
            { type: EChecklistTypes.STEP, description: 'PARKING BRAKE', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'Before T/O',
        items: [
            { type: EChecklistTypes.STEP, description: 'FLIGHT CONTROLS', expectedResult: 'CHECKED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'FLT INST', expectedResult: 'CHECKED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'BRIEFING', expectedResult: 'CONFIRMED' },
            { type: EChecklistTypes.STEP, description: 'FLAP SETTING', expectedResult: 'CONF____(BOTH)' },
            { type: EChecklistTypes.STEP, description: 'V1, VR, V2/FLX TEMP', expectedResult: '____(BOTH)' },
            { type: EChecklistTypes.STEP, description: 'ATC', expectedResult: 'SET' },
            {
                type: EChecklistTypes.STEP,
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
            { type: EChecklistTypes.THE_LINE },
            { type: EChecklistTypes.STEP, description: 'TAKEOFF RWY', expectedResult: '____CONFIRMED (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'CABIN CREW', expectedResult: 'ADVISED' },
            { type: EChecklistTypes.STEP, description: 'TCAS', expectedResult: 'TA OR TA/RA' },
            { type: EChecklistTypes.STEP, description: 'ENG MODE SEL', expectedResult: 'AS RQRD' },
            { type: EChecklistTypes.STEP, description: 'PACKS', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'After T/O and CLMB',
        items: [
            { type: EChecklistTypes.STEP, description: 'LDG GEAR', expectedResult: 'UP' },
            { type: EChecklistTypes.STEP, description: 'FLAPS', expectedResult: 'RETRACTED' },
            { type: EChecklistTypes.STEP, description: 'PACKS', expectedResult: 'ON' },
            { type: EChecklistTypes.THE_LINE },
            { type: EChecklistTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
        ],
    },
    {
        name: 'APPR',
        items: [
            { type: EChecklistTypes.STEP, description: 'BRIEFING', expectedResult: 'CONFIRMED' },
            { type: EChecklistTypes.STEP, description: 'ECAM STATUS', expectedResult: 'CHECKED' },
            { type: EChecklistTypes.STEP, description: 'SEAT BELTS', expectedResult: 'ON' },
            { type: EChecklistTypes.STEP, description: 'BARO REF', expectedResult: '____SET (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'MINIMUM', expectedResult: '____SET (BOTH)' },
            { type: EChecklistTypes.STEP, description: 'ENG MODE SEL', expectedResult: 'AS RQRD' },
        ],
    },
    {
        name: 'LDG',
        items: [
            { type: EChecklistTypes.STEP, description: 'CABIN CREW', expectedResult: 'ADVISED' },
            { type: EChecklistTypes.STEP, description: 'A/THR', expectedResult: 'SPEED/OFF' },
            { type: EChecklistTypes.STEP, description: 'AUTOBRAKE', expectedResult: 'AS RQRD' },
            {
                type: EChecklistTypes.STEP,
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
            { type: EChecklistTypes.STEP, description: 'FLAPS', expectedResult: 'RETRACTED' },
            { type: EChecklistTypes.STEP, description: 'SPOILERS', expectedResult: 'DISARMED' },
            { type: EChecklistTypes.STEP, description: 'APU', expectedResult: 'START' },
            { type: EChecklistTypes.STEP, description: 'RADAR', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'PREDICTIVE WINDSHEAR SYSTEM', expectedResult: 'OFF' },
        ],
    },
    {
        name: 'Parking',
        items: [
            { type: EChecklistTypes.STEP, description: 'APU BLEED', expectedResult: 'ON' },
            { type: EChecklistTypes.STEP, description: 'ENGINES', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'SEAT BELTS', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'EXT LT', expectedResult: 'EXT LT' },
            { type: EChecklistTypes.STEP, description: 'FUEL PUMPS', expectedResult: 'FUEL PUMPS' },
            { type: EChecklistTypes.STEP, description: 'PARK BRK and CHOCKS', expectedResult: 'AS RQRD' },
            { type: EChecklistTypes.NOTE, note: 'Consider HEAVY RAIN' },
        ],
    },
    {
        name: 'Securing',
        items: [
            { type: EChecklistTypes.STEP, description: 'ADIRS', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'OXYGEN', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'APU BLEED', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'EMER EXIT LT', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'SIGNS', expectedResult: 'OFF' },
            { type: EChecklistTypes.STEP, description: 'APU AND BAT', expectedResult: 'OFF' },
            { type: EChecklistTypes.NOTE, note: 'Consider COLD WEATHER' },
        ],
    },
];
