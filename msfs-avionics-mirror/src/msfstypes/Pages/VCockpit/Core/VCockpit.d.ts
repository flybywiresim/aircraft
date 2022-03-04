declare class VCockpitInstrumentData {
    iGUId: number;
    sContainer: string;
    sUrl: string;
    vPosAndSize: any;
    templateName: string;
    templateClass: Function;
}
declare class VCockpitPanelData {
    sName: string;
    vLogicalSize: IVec2;
    vDisplaySize: IVec2;
    daAttributes: Array<Attribute>;
    daInstruments: Array<VCockpitInstrumentData>;
    sConfigFile: string;
}
declare var globalPanelData: VCockpitPanelData;
declare var globalInstrumentListener: ViewListener.ViewListener;
declare class VCockpitPanel extends HTMLElement {
    private data;
    private curInstrumentIndex;
    private curAttributes;
    private virtualMouse;
    private vignettage;
    private vignettageNeeded;
    private vignettageHandler;
    static instrumentRoot: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    load(_data: VCockpitPanelData): void;
    hasData(): boolean;
    setAttributes(_attributes: Array<Attribute>): void;
    showVirtualMouse(_target: string, _show: boolean): void;
    registerInstrument(_instrumentName: string, _instrumentClass: CustomElementConstructor): void;
    createInstrument(_instrumentName: string, _instrumentClass: Function): void;
    private loadNextInstrument;
    private setupInstrument;
    private urlAlreadyImported;
    private showVignettage;
    private hideVignettage;
}
declare function registerInstrument(_instrumentName: string, _instrumentClass: CustomElementConstructor): void;
