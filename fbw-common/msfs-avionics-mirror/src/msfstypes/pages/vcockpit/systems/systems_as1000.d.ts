declare class Systems_AS1000 extends Systems {
    private PFDName;
    private MFDName;
    private PFDPanel;
    private MFDPanel;
    private PFDOutput;
    private MFDOutput;
    private FinalOutput;
    private bPFDTurnedOn;
    private bMFDTurnedOn;
    private bPFDFailure;
    private bMFDFailure;
    private bReversionary;
    private bSwapScreens;
    init(_xmlConfig: Document, _logicData: VCockpitLogicInput): void;
    protected parseXML(): void;
    update(): void;
    protected isInstrumentTurnedOn(_name: string): boolean;
    protected isScreenFailure(_name: string): boolean;
    protected isReversionaryMode(): boolean;
    protected doSwapScreens(): boolean;
}
