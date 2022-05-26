declare enum ScreenState {
    OFF = 0,
    INIT = 1,
    WAITING_VALIDATION = 2,
    ON = 3,
    REVERSIONARY = 4
}
declare class BaseInstrument extends TemplateElement {
    static allInstrumentsLoaded: boolean;
    static useSvgImages: boolean;
    dataMetaManager: DataReadMetaManager;
    urlConfig: URLConfig;
    xmlConfig: Document;
    instrumentXmlConfig: Element;
    protected startTime: number;
    private _frameCount;
    protected electricity: HTMLElement;
    protected electricalLogic: CompositeLogicXMLElement;
    protected electricityAvailable: boolean;
    protected initDuration: number;
    protected hasBeenOff: boolean;
    protected isStarted: boolean;
    protected needValidationAfterInit: boolean;
    protected initAcknowledged: boolean;
    protected screenState: ScreenState;
    protected reversionaryMode: boolean;
    protected highlightSvg: HTMLElement;
    protected highlightList: Array<HighlightedElement>;
    protected backgroundList: Array<Element>;
    private _instrumentId;
    private _lastTime;
    private _deltaTime;
    private _frameLastTime;
    private _frameDeltaTime;
    private _isConnected;
    private _isInitialized;
    private _xmlConfigFile;
    private _quality;
    private _gameState;
    private _alwaysUpdate;
    private _alwaysUpdateList;
    private _pendingCalls;
    private _pendingCallUId;
    private _facilityLoader;
    private _mainLoopFuncInstance;
    constructor();
    get initialized(): boolean;
    get instrumentIdentifier(): string;
    get instrumentIndex(): number;
    get isInteractive(): boolean;
    get IsGlassCockpit(): boolean;
    get isPrimary(): boolean;
    get deltaTime(): number;
    get frameCount(): number;
    get flightPlanManager(): FlightPlanManager;
    get facilityLoader(): FacilityLoader;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected Init(): void;
    setInstrumentIdentifier(_identifier: string): void;
    setConfigFile(_file: string): void;
    getChildById(_selector: String): any;
    getChildrenById(_selector: String): any;
    getChildrenByClassName(_selector: string): any;
    startHighlight(_id: string): void;
    stopHighlight(_id: string): void;
    clearHighlights(): void;
    updateHighlightElements(): void;
    onInteractionEvent(_args: Array<string>): void;
    onSoundEnd(_event: Name_Z): void;
    getQuality(): Quality;
    getGameState(): GameState;
    protected reboot(): void;
    protected onFlightStart(): void;
    protected onQualityChanged(_quality: Quality): void;
    protected onGameStateChanged(_oldState: GameState, _newState: GameState): void;
    private loadDocumentAttributes;
    protected parseXMLConfig(): void;
    protected parseURLAttributes(): void;
    private beforeUpdate;
    protected Update(): void;
    private afterUpdate;
    doUpdate(): void;
    private CanUpdate;
    private canUpdate;
    protected updateElectricity(): void;
    protected isElectricityAvailable(): boolean;
    onShutDown(): void;
    onPowerOn(): void;
    protected isBootProcedureComplete(): boolean;
    acknowledgeInit(): void;
    isInReversionaryMode(): boolean;
    wasTurnedOff(): boolean;
    playInstrumentSound(soundId: string): boolean;
    private createMainLoop;
    private mainLoop;
    private killMainLoop;
    private loadXMLConfig;
    private loadURLAttributes;
    getTimeSinceStart(): number;
    getAspectRatio(): number;
    isComputingAspectRatio(): boolean;
    isAspectRatioForced(): boolean;
    getForcedScreenRatio(): number;
    getForcedAspectRatio(): number;
    protected updateHighlight(): void;
    highlightGetState(_valueMin: number, _valueMax: number, _period: number): number;
    private initTransponder;
    requestCall(_func: Function, _timeout?: number): number;
    removeCall(_uid: number): void;
    protected updatePendingCalls(): void;
    protected clearPendingCalls(): void;
    alwaysUpdate(_element: Updatable, _val: boolean): void;
    protected updateAlwaysList(): void;
    protected clearAlwaysList(): void;
}
declare class URLConfig {
    style: string;
    index: number;
    wasmModule: string;
    wasmGauge: string;
}
declare class PendingCall {
    func: Function;
    timeout: number;
    uid: number;
}
declare enum Quality {
    "ultra" = 0,
    "high" = 1,
    "medium" = 2,
    "low" = 3,
    "hidden" = 4,
    "disabled" = 5
}
declare enum GameState {
    "mainmenu" = 0,
    "loading" = 1,
    "briefing" = 2,
    "ingame" = 3
}
declare class HighlightedElement {
    elem: Element;
    style: any;
    lastRect: DOMRect;
}
declare abstract class Updatable {
    abstract onUpdate(_deltaTime: number): any;
}
