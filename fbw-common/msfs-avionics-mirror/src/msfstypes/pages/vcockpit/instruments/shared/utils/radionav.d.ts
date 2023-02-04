declare class RadioNav {
    private navMode;
    private navBeacon;
    init(_navMode: NavMode): void;
    get mode(): NavMode;
    setRADIONAVActive(_index: number, _value: boolean): void;
    getRADIONAVActive(_index: number): boolean;
    getRADIONAVSource(): NavSource;
    setRADIONAVSource(_source: NavSource): void;
    swapVORFrequencies(_index: number): Promise<any>;
    setVORActiveFrequency(_index: number, _value: number): Promise<any>;
    getVORActiveFrequency(_index: number): number;
    setVORActiveIdent(_index: number, _value: string): Promise<any>;
    getVORActiveIdent(_index: number): string;
    setVORStandbyFrequency(_index: number, _value: number): Promise<any>;
    getVORStandbyFrequency(_index: number): number;
    setVORObs(_index: number, _value: number): Promise<any>;
    getVORObs(_index: number): number;
    getVORBeacon(_index: number): NavBeacon;
    getBestVORBeacon(_useNavSource?: UseNavSource): NavBeacon;
    private _getVORBeacon;
    swapILSFrequencies(_index: number): Promise<any>;
    setILSActiveFrequency(_index: number, _value: number): Promise<any>;
    getILSActiveFrequency(_index: number): number;
    setILSActiveIdent(_index: number, _value: string): Promise<any>;
    getILSActiveIdent(_index: number): string;
    setILSStandbyFrequency(_index: number, _value: number): Promise<any>;
    getILSStandbyFrequency(_index: number): number;
    setILSObs(_index: number, _value: number): Promise<any>;
    getILSObs(_index: number): number;
    getILSBeacon(_index: number): NavBeacon;
    private _getILSBeacon;
    getBestILSBeacon(_useNavSource?: UseNavSource): NavBeacon;
    getClosestILSBeacon(): NavBeacon;
    tuneClosestILS(_tune: boolean): Promise<any>;
    getADFActiveFrequency(_index: number): number;
    getADFStandbyFrequency(_index: number): number;
    setADFActiveFrequency(_index: number, _value: number): Promise<any>;
    setADFStandbyFrequency(_index: number, _value: number): Promise<any>;
    swapADFFrequencies(_index: number, _vhfIndex: number): Promise<any>;
    getTransponderCode(_index: number): number;
    setTransponderCode(_index: number, _value: number): void;
    getTransponderState(_index: number): TRANSPONDER_STATE;
    setTransponderState(_index: number, _state: TRANSPONDER_STATE): void;
    swapVHFFrequencies(_userIndex: number, _vhfIndex: number): Promise<any>;
    setVHFActiveFrequency(_userIndex: number, _vhfIndex: number, _value: number): Promise<any>;
    getVHFActiveFrequency(_userIndex: number, _vhfIndex: number): number;
    setVHFStandbyFrequency(_userIndex: number, _vhfIndex: number, _value: number): Promise<any>;
    getVHFStandbyFrequency(_userIndex: number, _vhfIndex: number): number;
    setVHF1ActiveFrequency(_index: number, _value: number): void;
    getVHF1ActiveFrequency(_index: number): number;
    setVHF1StandbyFrequency(_index: number, _value: number): void;
    getVHF1StandbyFrequency(_index: number): number;
    setVHF2ActiveFrequency(_index: number, _value: number): void;
    getVHF2ActiveFrequency(_index: number): number;
    setVHF2StandbyFrequency(_index: number, _value: number): void;
    getVHF2StandbyFrequency(_index: number): number;
    setVHF3ActiveFrequency(_index: any, _value: number): void;
    getVHF3ActiveFrequency(_index: number): number;
    setVHF3StandbyFrequency(_index: number, _value: number): void;
    getVHF3StandbyFrequency(_index: number): number;
    getRadioDecisionHeight(): number;
    private static Hz833Spacing;
    static isHz833Compliant(_MHz: number): boolean;
    static isHz25Compliant(_MHz: number): boolean;
    static isHz50Compliant(_MHz: number): boolean;
    static isXPDRCompliant(_code: number): boolean;
}
declare enum NavMode {
    TWO_SLOTS = 0,
    FOUR_SLOTS = 1
}
declare enum UseNavSource {
    NO = 0,
    YES_ONLY = 1,
    YES_FALLBACK = 2
}
declare enum NavSource {
    AUTO = 0,
    GPS = 1,
    VOR1 = 2,
    VOR2 = 3,
    ILS1 = 4,
    ILS2 = 5
}
declare enum TRANSPONDER_STATE {
    OFF = 0,
    STBY = 1,
    TEST = 2,
    ON = 3,
    ALT = 4,
    GND = 5
}
declare class NavBeacon {
    id: number;
    freq: number;
    course: number;
    radial: number;
    name: string;
    ident: string;
    isILS: boolean;
    reset(): void;
}
