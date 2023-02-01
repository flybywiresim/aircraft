declare class LatLong {
    lat: number;
    long: number;
    __Type: string;
    constructor(data?: any);
    constructor(data?: any, long?: number);
    set(lat: number, long: number): void;
    toStringFloat(): string;
    toString(): string;
    static fromStringFloat(_str: string): LatLong | LatLongAlt;
    latToDegreeString(): string;
    longToDegreeString(): string;
    toDegreeString(): string;
    toShortDegreeString(): string;
}
declare class LatLongAlt {
    lat: number;
    long: number;
    alt: number;
    __Type: string;
    constructor(data?: any);
    constructor(lat: number, long: number, alt?: number);
    toLatLong(): LatLong;
    toStringFloat(): string;
    toString(): string;
    latToDegreeString(): string;
    longToDegreeString(): string;
    toDegreeString(): string;
}
declare function wrapLatLong(_latLong: LatLong | LatLongAlt): void;
declare class PitchBankHeading {
    pitchDegree: number;
    bankDegree: number;
    headingDegree: number;
    __Type: string;
    constructor(data?: any);
    toString(): string;
}
declare class LatLongAltPBH {
    lla: LatLongAlt;
    pbh: PitchBankHeading;
    __Type: string;
    constructor(data?: any);
    toString(): string;
}
declare class PID_STRUCT {
    pid_p: number;
    pid_i: number;
    pid_i2: number;
    pid_d: number;
    i_boundary: number;
    i2_boundary: number;
    d_boundary: number;
    constructor(data?: any);
    toString(): string;
}
declare class XYZ {
    __Type: string;
    lon: number;
    alt: number;
    lat: number;
    x: number;
    y: number;
    z: number;
    pitch: number;
    heading: number;
    bank: number;
    constructor(data?: any);
    toString(): string;
}
declare class DataDictionaryEntry {
    key: number;
    data: number;
    __Type: string;
    constructor(data?: any);
    toString(): string;
}
declare class POIInfo {
    distance: number;
    angle: number;
    isSelected: boolean;
    __Type: string;
    constructor(data?: any);
    toString(): string;
}
declare class KeyActionParams {
    iUId: number;
    sName: string;
    key1: BindingCombo;
    key2: BindingCombo;
    bReversed: boolean;
    bMapOnRelease: boolean;
    bPrimary: boolean;
    inputList: DataValue[];
    bCanMapOnRelease: boolean;
    constructor(json?: string);
    static sKeyDelimiter: string;
}
declare class Simvar {
    __Type: string;
    name: string;
    unit: string;
}
declare class Attribute {
    __Type: string;
    name: string;
    value: string;
}
