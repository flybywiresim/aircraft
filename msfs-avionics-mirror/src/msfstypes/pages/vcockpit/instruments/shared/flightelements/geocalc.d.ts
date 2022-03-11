declare class GeoCalcInfo {
    instrument: BaseInstrument;
    private lat1;
    private lat2;
    private lon1;
    private lon2;
    private useMagVar;
    private loadState;
    private endCallBack;
    bearing: number;
    distance: number;
    constructor(_instrument: BaseInstrument);
    SetParams(_lat1: number, _lon1: number, _lat2: number, _lon2: number, _useMagVar?: boolean): void;
    Compute(_callback?: Function): void;
    private LoadData;
    IsUpToDate(): boolean;
    IsIdle(): boolean;
}
