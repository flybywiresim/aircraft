declare class InstrumentConfig {
    name: string;
    electrics: Array<Simvar>;
}
declare class Systems {
    protected xmlConfig: Document;
    protected inputData: VCockpitLogicInput;
    protected allInstruments: Array<InstrumentConfig>;
    init(_xmlConfig: Document, _inputData: VCockpitLogicInput): void;
    protected parseXML(): void;
    update(): void;
    protected updateLogic(_data: VCockpitLogicOutput): void;
    protected addAttribute(_panel: VCockpitLogicOutputPanel, _name: string, _value: string): void;
    protected addMaterial(_panel: VCockpitLogicOutputPanel, _name: Name_Z): void;
    protected addMaterials(_panel: VCockpitLogicOutputPanel, _names: Array<Name_Z>): void;
}
