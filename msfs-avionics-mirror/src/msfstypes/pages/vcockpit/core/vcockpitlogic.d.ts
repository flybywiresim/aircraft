declare class VCockpitLogicInputInstrument {
    nName: Name_Z;
}
declare class VCockpitLogicInputPanel {
    iGUId: number;
    daInstruments: Array<VCockpitLogicInputInstrument>;
    daOriginalMaterials: Array<Name_Z>;
}
declare class VCockpitLogicInput {
    sConfigFile: string;
    daPanels: Array<VCockpitLogicInputPanel>;
}
declare class VCockpitLogicOutputPanel {
    __Type: string;
    iGUId: number;
    daAttributes: Array<Attribute>;
    daTargetMaterials: Array<Name_Z>;
}
declare class VCockpitLogicOutput {
    __Type: string;
    daPanels: Array<VCockpitLogicOutputPanel>;
}
declare var globalLogicData: VCockpitLogicInput;
declare var globalInstrumentListener: ViewListener.ViewListener;
declare class VCockpitLogic extends HTMLElement {
    private data;
    private connected;
    private xmlConfig;
    private systemsHandlers;
    static systemsRoot: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    load(_data: VCockpitLogicInput): void;
    hasData(): boolean;
    private loadXMLConfig;
    private onScriptReady;
    private createMainLoop;
    private killMainLoop;
}
