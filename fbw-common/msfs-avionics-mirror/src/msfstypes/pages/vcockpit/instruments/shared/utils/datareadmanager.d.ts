declare class DataReadMetaManager {
    private managerList;
    constructor();
    UpdateAll(): void;
    RegisterManager(_Manager: DataReadManager): void;
}
interface AsynchroneDataGetter {
    LoadData(): any;
    IsUpToDate(): boolean;
    EndLoad(): any;
}
declare class DataReadManager {
    waitingForUpdate: Array<AsynchroneDataGetter>;
    registered: boolean;
    metaManager: DataReadMetaManager;
    constructor(_metaManager: DataReadMetaManager);
    Update(): void;
    AddToQueue(_Getter: AsynchroneDataGetter): boolean;
    protected Register(): void;
}
declare class InstrumentDataReadManager {
    private array;
    AddToQueue(_instrument: BaseInstrument, _Getter: AsynchroneDataGetter): boolean;
}
