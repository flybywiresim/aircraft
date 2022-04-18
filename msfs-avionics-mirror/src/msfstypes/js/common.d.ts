interface CustomElementConstructor {
    new (...params: any[]): HTMLElement;
}
declare var bDebugKeyNavigation: boolean;
declare var bDebugKeyNavClearConsole: boolean;
declare var bLiveReload: boolean;
declare var bAutoReloadCSS: boolean;
declare var bDebugListeners: boolean;
declare var bDebugCursor: boolean;
declare var bDebugElementsCreation: boolean;
declare var g_externalVariables: {
    minTextSize?: string | number;
    colorPreset?: string | number;
    backgroundOpacity?: string | number;
    showTooltips?: boolean;
    instrumentDescriptionTooltipsDelay?: number;
    instrumentNameTooltipsDelay?: number;
    animationsEnabled?: boolean;
    uiScaling?: number;
    vrMode?: boolean;
    debugMode?: "NONE";
    cursorSize?: number;
    navigationMode?: number;
    debugScreenReader?: boolean;
    useScreenReader?: boolean;
};
declare namespace ScreenReader {
    class SRRuleEvent {
        __Type: string;
        text: string;
        delay: number;
        noCut: boolean;
    }
    export function forceEvent(nodeName: string, event: SRRuleEvent): void;
    export function onFocus(elem: UIElement): void;
    export function onValidate(elem: UIElement): void;
    export function updateStatus(): void;
    export function onShow(elem: UIElement): void;
    export {};
}
interface CustomWindow extends Window {
    globalVars: {
        [s: string]: string | number;
    };
}
declare function GameConfiguration(): string;
declare function DEBUG(): boolean;
declare function RELEASE(): boolean;
declare function MASTER(): boolean;
declare function SUBMISSION(): boolean;
declare enum GAME_CONFIGURATION {
    DEBUG = "DEBUG",
    RELEASE = "RELEASE",
    MASTER = "MASTER",
    SUBMISSION = "SUBMISSION"
}
declare const GAME_CONFIGURATION_ORDER: GAME_CONFIGURATION[];
declare function GamePlatform(): string;
declare function PC(): boolean;
declare function XBOX(): boolean;
declare enum GAME_PLATFORM {
    PC = "PC",
    XBOX = "XBOX"
}
interface LoggerConfiguration {
    [s: string]: keyof typeof GAME_CONFIGURATION | LoggerConfiguration;
}
declare namespace Logger {
    function trace(...args: any[]): void;
    function log(...args: any[]): void;
    function info(...args: any[]): void;
    function warn(...args: any[]): void;
    function error(...args: any[]): void;
}
declare function GetUIEditionMode(): string;
declare function UI_USE_DATA_FOLDER(): boolean;
declare function EDITION_MODE(): boolean;
declare class ImportTemplateElement extends HTMLElement {
    constructor();
    connectedCallback(): void;
}
declare class ImportScriptElement extends HTMLElement {
    constructor();
    connectedCallback(): void;
}
declare namespace Include {
    class IncludeMgr {
        private scriptList;
        resourceLoadedCallbacks: Function[];
        loadScriptAsync: boolean;
        static AbsolutePath(current: string, relativePath: string): string;
        processPath(path: string): string;
        addImport(path: string, callback?: any): void;
        addImports(path: string[], callback?: any): void;
        addScript(path: string, callback?: () => void): void;
        private requestScript;
        private onScriptLoaded;
        isLoadingScript(_pattern: string): boolean;
    }
    export var g_IncludeMgr: IncludeMgr;
    export function addImport(path: string, callback?: any): void;
    export function addImports(path: string[], callback?: any): void;
    export function addScript(path: string, callback?: () => void): void;
    export function isLoadingScript(pattern: string): boolean;
    export function absolutePath(current: string, relativePath: string): string;
    export function absoluteURL(current: string, relativePath: string): string;
    export function setAsyncLoading(_async: boolean): void;
    export function onAllResourcesLoaded(): void;
    export {};
}
declare namespace LiveReload {
    function reloadCSS(): void;
    function startAutoReload(autoRefresh?: boolean): void;
}
declare var Coherent: CoherentEngine;
declare var debugDuplicateRegister: boolean;
declare var debugLocalization: boolean;
declare function cancelAllRequestAnimationFrame(): void;
declare namespace CoherentSetup {
    function CheckCoherentEngine(windowElem: Window): void;
    function updateScreenSize(): void;
}
declare namespace Utils {
    function isRectInRect(inner: ClientRect, outer: ClientRect): boolean;
    function dispatchToAllWindows(event: Event): void;
    function toArray(array: any): any[];
    function inIframe(): boolean;
    function createDiv(...classList: string[]): HTMLDivElement;
    function joinPaths(path1: string, path2: string, separatorChar?: string): string;
    function getAbsoluteURI(absoluteOrRelativeURI: string, prependForRelativeURI: string): string;
    function getVh(percent: number): string;
    function getSize(px: number): number;
    function getVhNumber(percent: number): number;
    function getScreenRatio(): number;
    function getVirtualHeight(): any;
    function scrollbarVisible(element: HTMLElement): boolean;
    function getExternalImageUrl(url: string, prefix?: string): string;
    function Modulo(num: number, mod: number): number;
    function pad(num: any, size: any): string;
    function replace_nth(str: string, find: string, replace: string, index: number): string;
    function forceParagraphLines(text: string, n?: number): string;
    function dashToCamelCase(myStr: any): any;
    function timeLine(str: string): void;
    function DisplayTimeToSeconds(str: string): number;
    function urlEqual(url1: string, url2: string): boolean;
    function RemoveAllChildren(elem: Node): void;
    function formatNumber(x: any, _bInteger?: boolean): string;
    function formatInteger(x: number): string;
    function Clamp(n: number, min: number, max: number): number;
    function Loop(n: number, min: number, max: number): number;
    function isHidden(el: Element, recurs: boolean): boolean;
    function isVisible(elem: HTMLElement): boolean;
    function strToBool(str: string): boolean;
    function setInputFilter(textbox: HTMLElement, inputFilter: Function): void;
    function isNumeric(str: string): boolean;
    function isInteger(str: string): boolean;
    function SmoothPow(origin: number, destination: number, smoothFactor: number, dTime: number): number;
    function SmoothLinear(origin: number, destination: number, smoothFactor: number, dTime: number): number;
    function SmoothSin(origin: number, destination: number, smoothFactor: number, dTime: number): number;
    function ClearIframe(elem: HTMLElement): void;
    function generateGUID(): string;
    function containStr(str: string, title: string): boolean;
    function getCaretPosition(ctrl: any): number;
    function setCaretPosition(ctrl: any, pos: any): void;
    function generateRandomName(): string;
    function generateLorem(length: number): string;
    function filterProfanity(str: string): Promise<string>;
    function Translate(key: string): string;
    function SetTextVariable(varName: string, value: string): void;
    function RemoveTextVariable(varName: string): void;
    function SecondsToDisplayDuration(totalSeconds: number, withMinutes: boolean, withSeconds: boolean, doLocalize?: boolean): string;
    function SecondsToDisplayTime(totalSeconds: number, withMinutes: boolean, withSeconds: boolean, doLocalize?: boolean): string;
    function timeToString(hours: number, minutes: number, seconds: number): string;
    function doesFileExist(file: string): boolean;
    function loadFile(file: string, callbackSuccess?: (content: string) => void): Promise<string>;
    function getMarketItemMediaURL(name: string): string;
    function slowDeepClone(object: any): any;
    function showTooltip(id: string, tooltip: string, posXRel: number, posYRel: number, maxWidth?: number): void;
    function hideTooltip(id: string): void;
    function leadingZeros(_value: number, _nbDigits: number, _pointFixed?: number): string;
    function decimalDegreesToDMS(decimalDegrees: number, leadingZeros?: number, maxDigits?: number, signed?: boolean): string;
    function decimalDegreesToDDM(decimalDegrees: number, leadingZeros?: number, maxDigits?: number, signed?: boolean): string;
    function countDecimals(_step: number): number;
    function preLoadDeviceIcons(subPath: string, imgNameList: Array<string>): void;
}
declare function SetBackgroundImage(img: string): void;
declare namespace BackgroundSlider {
    function SetBackgroundImageSlider(imgs: string[]): void;
    function ToggleBackground(toggle: boolean): void;
    function JumpSlider(index: number): void;
}
declare function SetBlurredBackgroundRatio(val: number): void;
declare function SetBlurredBackground(bVal: boolean): void;
declare class SoundManager {
    static SND_VALID: string;
    static SND_OVER: string;
    static SND_INVALID: string;
    private m_registered;
    RegisterSoundButton(elem: HTMLElement, type?: string): () => void;
    private canPlaySound;
    private OnMouseOverOnElement;
    private OnMouseLeaveElement;
    private OnMouseDownOnElement;
    private OnClickOnElement;
    PlaySound(sndNType: string, buttonType?: string): void;
}
declare var g_SoundMgr: SoundManager;
declare function LaunchFlowEvent(eventName: string, ...args: any[]): void;
declare function LaunchFlowEventToGlobalFlow(eventName: string, ...args: any[]): void;
declare function OpenBrowser(url: string): void;
declare function InstanciateTemplate2(selector: string, templatedElement?: HTMLElement): DocumentFragment;
declare function InstanciateTemplate(parent: HTMLElement, selector: string): Element;
declare enum UINavigationMode {
    None = -1,
    Mouse = 0,
    Keys = 1,
    PadCursor = 2,
    VrController = 3
}
declare class UINavigation {
    static get lockFocus(): boolean;
    static set lockFocus(val: boolean);
    static get previous(): UIElement;
    static get previousRaw(): UIElement;
    static set previous(elem: UIElement);
    static get current(): UIElement;
    static get currentRaw(): UIElement;
    private static m_myExclusiveFocusGuid;
    private static m_currentExclusiveFocusGuid;
    static get myExclusiveFocusGuid(): string;
    static set currentExclusiveFocusGuid(guid: string);
    static get currentExclusiveFocusGuid(): string;
    static get canFocusProximity(): boolean;
    static get hasFocus(): boolean;
    static askGrabKeys(): void;
    static releaseKeys(): void;
    static addPadSelectable(elt: ButtonElement): void;
    static removePadSelectable(elt: ButtonElement): void;
    private static m_padSelectables;
    static OnButtonFocus(target: UIElement): void;
    static OnButtonBlur(): void;
    static forcePadCursorPositionOnDefaultButton(): void;
    static forcePadCursorPosition(target: any): void;
    static set current(elem: UIElement);
    static get MouseMode(): boolean;
    static get PadCursorMode(): boolean;
    static get VrControllerMode(): boolean;
    private static m_navigationMode;
    private static set NavigationMode(value);
    private static get NavigationMode();
    static switchNativigationMode(mode: UINavigationMode): void;
    static leaveCurrentNavigationMode(): void;
    static addMouseModeEventListener(callback: () => void): void;
    static removeMouseModeEventListener(callback: () => void): void;
    static addKeysModeEventListener(callback: () => void): void;
    static removeKeysModeEventListener(callback: () => void): void;
    static enterVrControllerMode(): void;
    static exitVrControllerMode(): void;
    static enterCursorMode(mode: number): void;
    static exitCursorMode(): void;
    private static requestClosest;
    static m_mouseDebug: HTMLCanvasElement;
    static m_TestPoints: Vec2[];
    static m_currentClosest: ButtonElement;
    static isSelectableElement(elt: Element): boolean;
    static set currentPadCursorHoverElement(elt: UIElement);
    static get currentPadCursorHoverElement(): UIElement;
    private static m_currentPadCursorHoverElement;
    private static updateCurrentPadCursorHoverElement;
    private static m_prevX;
    private static m_prevY;
    static focusUnderMouse(e: MouseEvent): void;
    protected static isSelectionableInHtmlTree(elt: UIElement): boolean;
    protected static isSelectionableInHtmlTreeDebug(elt: UIElement): [boolean, string];
    protected static findClosestButtonElement(mx: number, my: number): void;
    protected static FilterRectsInsideRadius(array: Array<ButtonElement>, center: Vec2, sqrRadius: number): ButtonElement[];
    protected static TagPath(elt: Element): string;
    protected static DrawDebugLine(ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2, color: string): void;
    protected static DrawDebugCircle(ctx: CanvasRenderingContext2D, center: Vec2, radius: number, color: string, isFilled: boolean): void;
    protected static clearCurrentClosest(): void;
    static clearOnMouseLeaveView(e: MouseEvent): void;
    static clearNonFocusedPanel(): void;
    static enterMouseMode(): void;
    static onKeyDown(e: KeyboardEvent): void;
    static onEnableChange(): void;
    private static m_pageVisible;
    static setPageVisible(val: boolean): void;
    static isPageVisible(): boolean;
    static get KeysMode(): boolean;
    static findFocusedUIElement(root: Element): UIElement | void;
    static findDefaultUIElement(root: Element, startFromLast?: boolean): UIElement | void;
    static findSelectedUIElement(root: Element): UIElement | void;
    static findDefaultChildUIElement(root: Element, startFromLast?: boolean): UIElement | void;
    static findSelectedParentUIElement(root: Element): UIElement | void;
    static findTabIndexUIElement(root: Element): UIElement | void;
    static findFocusableUIElement(uiElem: UIElement, startFromLast?: boolean): UIElement | void;
    static getDefaultButton(root?: Element): UIElement | void;
    static canNavigate(): boolean;
    static onShow(): void;
    static onHide(): void;
    static disableKeyNavigation(): void;
    static onKeyDownOnRoot(keycode: number): void;
    static enterKeysMode(): boolean;
}
declare enum KeyNavigationDirection {
    KeyNavigation_None = 0,
    KeyNavigation_Horizontal = 1,
    KeyNavigation_Vertical = 2,
    KeyNavigation_Grid = 3
}
interface GridPosition {
    row: string;
    col: string;
    rowEnd: string;
    colEnd: string;
}
declare class UIElement extends HTMLElement {
    private m_DummyUIElement;
    static getUIElement(elem: HTMLElement): UIElement;
    constructor();
    disconnectedCallback(): void;
    canUseScreenReader(): boolean;
    get childActiveClass(): string;
    shouldDispatchChildActive(): boolean;
    private m_canEnterKeysMode;
    get canEnterKeysMode(): boolean;
    set canEnterKeysMode(val: boolean);
    onActiveChildBlurred(child: UIElement): void;
    onActiveChildFocused(child: UIElement): void;
    private onDefaultKeyDown;
    private onDefaultKeyUp;
    registerDefaultKeyEvents(): void;
    private get _localgridColumn();
    private get _localgridColumnEnd();
    private get _localgridRow();
    private get _localgridRowEnd();
    private m_localGrid;
    get localGrid(): GridPosition;
    get localgridColumn(): string;
    get localgridColumnEnd(): string;
    get localgridRow(): string;
    get localgridRowEnd(): string;
    set localgridColumn(value: string);
    private m_globalGridColumn;
    private m_globalGridColumnEnd;
    private m_globalGridRow;
    private m_globalGridRowEnd;
    get globalGridColumn(): string[];
    get globalGridColumnEnd(): string[];
    get globalGridRow(): string[];
    get globalGridRowEnd(): string[];
    unregisterDefaultKeyEvents(): void;
    spreadToChildren(parent: Element, parentClass: string, childClass: string): void;
    unspreadToChildren(parent: Element, parentClass: string, childClass: string): void;
    setVisible(val: boolean): void;
    isVisible(): boolean;
    onVisibilityChange(visible: boolean): void;
    get enabled(): boolean;
    enable(bool: boolean): void;
    disable(bool: boolean): void;
    set disabled(bool: boolean);
    isOneParentHidden(): boolean;
    isOneParentDisabled(): boolean;
    get disabled(): boolean;
    canBeSelectedDisabled(): boolean;
    canBeSelectedLocked(): boolean;
    canBeSelectedWithKeys(): boolean;
    get forceNoKeyNavigation(): boolean;
    get canBeSelected(): boolean;
    get locked(): boolean;
    set locked(val: boolean);
    get loading(): boolean;
    set loading(val: boolean);
    get loadingText(): string;
    set loadingText(val: string);
    connectedCallback(): void;
    protected requestPadFilterRectInfo: () => void;
    protected applyDataInputGroup(): void;
    isTransparent(): boolean;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
    static getRenderSize?(data: any, direction: ScrollDirection): number;
    isParentOf(child: HTMLElement): boolean;
    isChildOf(parentToTest: HTMLElement): boolean;
    hasParentHidden(): boolean;
    focus(): void;
    get focused(): boolean;
    queryElement(selector: any): UIElement;
    setJSONData(data: string): void;
    setAnyData(data: any): void;
    getKeyNavigationDirection(): KeyNavigationDirection;
    getAllFocusableChildren(): HTMLElement[];
    getKeyNavigationStayInside(keycode: any): boolean;
    getKeyOrthogonalStayInside(keycode: any): boolean;
    selectDefaultButton(): void;
    selectDefaultChildButton(): void;
    getDefaultButton(): UIElement | void;
    private _getDefaultChildButton;
    getLastDefaultChildButton(): UIElement | void;
    getDefaultChildButton(): UIElement | void;
    virtualScrollIntoView(elt?: HTMLElement): void;
    sendSizeUpdate: () => void;
    protected onButtonSelected(button: UIElement): void;
    protected onButtonUnselected(button: UIElement): void;
    protected onKeyUp(keycode: any): boolean;
    private previousButton;
    protected onKeyDown(keycode: any): boolean;
    get autoInside(): boolean;
    focusByKeys(keycode?: number): void;
}
declare let g_checkComponentsTimeout: number;
declare function IsTemplateElement(elem: UIElement): boolean;
declare class TemplateElement extends UIElement {
    created: boolean;
    constructor();
    get templateID(): string;
    mustCheckCSSIsApplied(): boolean;
    onCSSApplied: Promise<void>;
    protected Instanciate(_forcedTemplate?: string): any;
    querySelectorH(str: any): HTMLElement;
    getTemplateSlot(name?: string): HTMLElement;
    appendContent(element: HTMLElement): void;
    static copyAttributes(from: HTMLElement, to: HTMLElement): void;
    protected onResourceLoaded: (e: CustomEvent) => void;
    protected convertPath(path: string): string;
    disconnectedCallback(): void;
    isTransparent(): boolean;
    private m_cssAppliedCheckImg;
    connectedCallback(): void;
    protected instantciatePopupToolbar: () => void;
    callbackCreated: () => void;
}
interface ConfigurableElement extends TemplateElement {
    SetData(data: any): any;
    PatchData?(data: any): any;
    relyOnRealHeight?: boolean;
}
declare namespace TemplateElement {
    function call(obj: TemplateElement, fnc: Function, ...args: any[]): void;
    function callNoBinding(obj: TemplateElement, callback: () => void): void;
}
declare class UIMarquee extends UIElement {
    static get observedAttributes(): string[];
    private m_animation;
    private m_savedContentWidth;
    private m_savedOffsetWidth;
    connectedCallback(): void;
    disconnectedCallback(): void;
    needsTooltip(): boolean;
    needsEllipsis(): boolean;
    private updateScrollBehaviour;
    onVisibilityChange(visible: boolean): void;
    get noSizeCheck(): boolean;
    get manual(): boolean;
    set manual(bool: boolean);
    updateScrollAnimation: () => void;
    updateSavedSizes: () => void;
    setText: (text: string, translate?: boolean) => void;
    setContent: (value: string, translate?: boolean) => void;
    startScrollAnimation: () => void;
    stopScrollAnimation: () => void;
    private scrollAnimation;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
}
declare class LabelizeElement extends UIElement {
    static get observedAttributes(): string[];
    get key(): string;
    set key(value: string);
    connectedCallback(): void;
    private updateText;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
}
declare class UIImageElement extends TemplateElement {
    private m_src;
    private m_mainElem;
    private m_imageElement;
    private m_mainContentElement;
    private m_backBufferElement;
    private m_backBuffer;
    private m_timeout;
    private m_transitionTime;
    private get transition();
    constructor();
    get noBackElement(): boolean;
    SetData(data: any): void;
    LoadContentURL(srcImage: string, urlContent: string, contentTag: string, contentData: any): void;
    clear(): void;
    set src(_src: string);
    get src(): string;
    get transitionTime(): number;
    set transitionTime(n: number);
    connectedCallback(): void;
    private onImageLoaded;
    private onImageError;
    private updateBackground;
}
declare namespace ViewListener {
    class ViewListener {
        private m_name;
        urlCaller: string;
        m_onConnected: any;
        connected: boolean;
        private m_handlers;
        constructor(name: string);
        private CheckCoherentEvent;
        private onGlobalEvent;
        unregister: () => void;
        off(name: any, callback: any, context?: any): void;
        on(name: any, callback: any, context?: any): void;
        call(name: any, ...args: any[]): Promise<any>;
        trigger(name: any, ...args: any[]): void;
        triggerToAllSubscribers(event: string, ...args: any[]): void;
        private onEventToAllSubscribers;
    }
    class ViewListenerMgr {
        private m_hash;
        constructor();
        private OnListenerRegistered;
        onRegister(name: string, vl: ViewListener): void;
        getListenerByName(name: string): ViewListener;
        onUnregister(name: string, vl: ViewListener, force?: boolean): void;
    }
    var g_ViewListenersMgr: ViewListenerMgr;
}
declare function RegisterViewListenerT<T extends ViewListener.ViewListener>(name: string, callback: () => void, type: {
    new (name: string): T;
}, requiresSingleton?: boolean): T;
declare function RegisterViewListener(name: string, callback?: any, requiresSingleton?: boolean): ViewListener.ViewListener;
declare class Name_Z {
    refresh(): any;
    idLow: number;
    idHigh: number;
    originalStr: string;
    str: string;
    __Type: string;
    static isValid(a: Name_Z): boolean;
    static compare(a: Name_Z, b: Name_Z): boolean;
    static compareStr(a: Name_Z, b: string): boolean;
    private RequestNameZ;
    constructor(str: string, eventHandler?: any);
}
declare function checkAutoload(forcedUrl?: string): void;
declare function EaseInOutQuad(t: any, b: any, c: any, d: any): any;
declare function ScrollHTo(element: any, to: any, duration: any): void;
declare function ScrollVTo(element: any, to: any, duration: any): void;
declare function GetViewUrl(): string;
declare enum EResizeType {
    NONE = 0,
    X = 1,
    Y = 2,
    BOTH = 3,
    RATIO = 4,
    COUNT = 5
}
interface ResizableHTMLElement extends HTMLElement {
    _minWidth?: number;
    _minHeight?: number;
}
declare class ResizeHandler {
    private element;
    private _resizeStartCallbacks;
    private _resizeUpdateCallbacks;
    private _resizeEndCallbacks;
    private _type;
    private _resizeHandleSize;
    private _startX;
    private _startY;
    private _currentHandle;
    private _startClientRect;
    private _startRight;
    private resizing;
    private _handleByGame;
    setResizeType(direction: string): void;
    constructor(element: ResizableHTMLElement, handleByGame?: boolean);
    private initResizeX;
    private removeResize;
    private initResizeY;
    private handleMouseOut;
    private initResizeXY;
    private startResize;
    private resizeUpdate;
    private updateResizeX;
    private updateResizeY;
    private resizeEnd;
    OnResizeStart(callback: (data: any) => void): void;
    OnResizeUpdate(callback: (data: any) => void): void;
    OnResizeEnd(callback: (data: any) => void): void;
    RemoveHandlers(): void;
}
interface DragDropOptions {
    dragElement?: HTMLElement;
    saving?: boolean;
    container?: HTMLElement;
    boundByWidth?: boolean;
    boundByHeight?: boolean;
    handleByGame?: boolean;
}
declare class DragDropHandler {
    private element;
    private dragElement;
    private _initialX;
    private _initialY;
    private _initialMouseX;
    private _initialMouseY;
    private _deltaX;
    private _deltaY;
    private _maxLeft;
    private _maxTop;
    private _bodyRect;
    canBeDragged: boolean;
    private _dragStartCallbacks;
    private _dragUpdateCallbacks;
    private _dragEndCallbacks;
    private _body;
    private _options;
    constructor(element: HTMLElement, options?: DragDropOptions);
    release(): void;
    private getSizes;
    private onResize;
    private checkCanDrag;
    private leaveDrag;
    private startDrag;
    private dragUpdate;
    private dragEnd;
    OnDragStart(callback: (data: any) => void): void;
    OnDragUpdate(callback: (data: any) => void): void;
    OnDragEnd(callback: (data: any) => void): void;
    isDragging(): boolean;
}
declare function saveElementPosition(element: HTMLElement): void;
declare function eraseElementPosition(id: string): void;
declare function setElementWidth(element: HTMLElement): void;
declare function setElementPosition(element: HTMLElement): void;
declare function OnInputFieldFocus(e: FocusEvent): void;
declare function OnInputFieldUnfocus(e: FocusEvent): void;
declare function LogCallstack(message: string): void;
declare var bDebugLoading: boolean;
declare class SmartLoader {
    private _resourcesLoaded;
    private _resourcesToLoad;
    private _htmlPath;
    private convertPath;
    constructor();
    addResource(path: string): void;
    private m_documentLoaded;
    onDocumentLoaded: () => void;
    private m_timeoutCheckLoaded;
    onResourceLoaded: (e: CustomEvent) => void;
    private m_OnViewLoadedSend;
    checkLoaded: () => void;
    private onInputRemoved;
    OnNodeRemoved: (e: Event) => void;
}
declare var loader: SmartLoader;
declare class DebugMgr {
    private m_defaultPosRight;
    private m_defaultPosTop;
    private m_debugPanel;
    private m_ConsoleCallback;
    private m_consoleElem;
    private dragDropHandler;
    private CreateDebugPanel;
    setDefaultPos(right: number, top: number): void;
    AddDebugButton(text: string, callback: any, autoStart?: boolean): void;
    private UpdateConsole;
    private m_defaultLog;
    private m_defaultWarn;
    private m_defaultError;
    AddConsole(callback: any, force?: boolean): void;
    private log;
    private warn;
    private error;
    private logConsole;
}
declare var g_debugMgr: DebugMgr;
declare enum MouseCursor {
    DRAG = 0,
    RESIZE_H = 1,
    RESIZE_V = 2,
    RESIZE_HV = 3
}
declare namespace Cursor {
    function setCursor(_Cursor: MouseCursor): void;
    function unsetCursor(): void;
}
declare class DataValue {
    ID: number;
    icon: string;
    name: string;
    valueStr: string;
    value: number;
    unit: string;
    quality: number;
    type: string;
    html: string;
    userTag: number;
    constructor(data?: any);
    static set(name: string, value: number, unit: string, valueStr?: string, icon?: string): DataValue;
    static fromValueWithUnit(value: number, unit: string, valueStr?: string): DataValue;
    static fromValue(name: string, value: number, valueStr: string): DataValue;
    static compare(arg0: DataValue, arg1: DataValue): boolean;
}
declare class TreeDataValue extends DataValue {
    children: DataValue[];
    static compare(arg0: DataValue, arg1: DataValue): boolean;
}
declare class RangeDataValue extends DataValue {
    min: number;
    max: number;
    clamp_min: number;
    clamp_max: number;
    step: number;
    percent: number;
}
declare class DataTable {
    header: string[];
    rows: string[][];
}
declare class TableDataValue {
    headers: DataValue[];
    values: DataValue[][];
}
interface IVec2 {
    x: number;
    y: number;
}
declare class Vec2 implements IVec2 {
    x: number;
    y: number;
    constructor(_x?: number, _y?: number);
    static FromRect(rect: ClientRect): Vec2;
    static Delta(vec1: IVec2, vec2: IVec2): Vec2;
    Set(x: number, y: number): void;
    VectorTo(other: IVec2): Vec2;
    Add(x: number, y: number, z: number): Vec2;
    Substract(x: number, y: number, z: number): Vec2;
    AddVec(other: IVec2): Vec2;
    SubstractVec(other: IVec2): Vec2;
    toCurvePointString(): string;
    Dot(other: IVec2): number;
    GetNorm(): number;
    Normalize(): void;
    SetNorm(n: number): void;
    SqrDistance(other: IVec2): number;
    RectSqrDistance(rect: ClientRect): number;
    Distance(other: IVec2): number;
    IsInside(rect: ClientRect): boolean;
    Equals(other: IVec2): boolean;
}
interface IVec3 {
    x: number;
    y: number;
    z: number;
}
declare class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    toString(): string;
    static Delta(vec1: IVec3, vec2: IVec3): Vec3;
    Set(x: number, y: number, z: number): void;
    VectorTo(other: IVec3): Vec3;
    Add(x: number, y: number, z: number): Vec3;
    Substract(x: number, y: number, z: number): Vec3;
    AddVec(other: IVec3): Vec3;
    SubstractVec(other: IVec3): Vec3;
    toCurvePointString(): string;
    Dot(other: IVec3): number;
    GetNorm(): number;
    Normalize(): void;
    SetNorm(n: number): void;
    SqrDistance(other: IVec3): number;
    Distance(other: IVec3): number;
    Equals(other: IVec3): boolean;
}
declare class IconTextElement extends UIElement {
    constructor();
    get basePath(): string;
    get subPath(): string;
    get imageName(): string;
    get altText(): string;
    static CLASS_NAME: string;
    get observedAttributes(): any[];
    connectedCallback(): void;
    protected updateIcon(): void;
    displayAltText(icon: HTMLElement, altText: string): void;
}
declare class DeviceButtonElement extends IconTextElement {
    constructor();
    get basePath(): string;
    get subPath(): string;
    get imageName(): string;
    get altText(): string;
    get observedAttributes(): any[];
    setData(subPath: string, imageName: string, altText: string): void;
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
}
declare class AtlasItemInfos {
    elem: UIElement;
    rect: DOMRect | ClientRect;
    needToSendRegisteredRectOnly: boolean;
}
declare class AltasElementsMgr {
    private m_elements;
    constructor();
    private sendItemCB;
    private SendItem;
    RemoveAtlasElement(elem: HTMLElement): void;
    AddAtlasElement(elem: UIElement): void;
    InvalidateAtlasElement(elem: Element): void;
    RequestSendRegirsteredRectOnNextAdd(elem: UIElement): void;
    RebuildAtlasElements: () => void;
}
declare var g_AtlasMgr: AltasElementsMgr;
declare namespace InputBar {
    const MENU_BUTTON_A: string;
    const MENU_BUTTON_B: string;
    const MENU_BUTTON_X: string;
    const MENU_BUTTON_Y: string;
    const MENU_BUTTON_START: string;
    const MENU_BUTTON_SELECT: string;
    const MENU_BUTTON_OPEN: string;
    const MENU_BUTTON_RESET: string;
    const MENU_BUTTON_APPLY: string;
    const MENU_BUTTON_PRESET_MANAGER = "MENU_PRESET_MANAGER";
    const MENU_BUTTON_PROFILE_MANAGER = "MENU_PROFILE_MANAGER";
    const MENU_BUTTON_CONTENT_MANAGER = "MENU_CONTENT_MANAGER";
    const MENU_BUTTON_QUIT: string;
    const MENU_BUTTON_CLOSE: string;
    const MENU_BUTTON_BACK: string;
    const MENU_BUTTON_WM_FILTERS: string;
    const MENU_BUTTON_WM_LEGEND: string;
    const MENU_BUTTON_CUSTOMIZE: string;
    const MENU_BUTTON_FLY: string;
    const MENU_BUTTON_FAVORITE: string;
    const MENU_BUTTON_TAB_LEFT: string;
    const MENU_BUTTON_TAB_RIGHT: string;
    const MENU_BUTTON_RANALOG_X: string;
    const MENU_BUTTON_RANALOG_Y: string;
    const MENU_BUTTON_RANALOG_XY: string;
    interface InputBarContainer {
        getButtons(): InputBarButtonParams[];
    }
    function isContainer(elem: any): boolean;
    class InputBarButtonParams {
        __Type: string;
        constructor(id: string, _text: string, _inputActionName: string, _event: string, _inputActionContext?: string, _alsoToGlobalFlow?: boolean, _disabled?: boolean);
        m_coherentHandle: EventHandle;
        release(): void;
        static setCallback(id: string, _text: string, _inputActionName: string, callback: any, _inputActionContext?: string, _alsoToGlobalFlow?: boolean, _disabled?: boolean): InputBarButtonParams;
        id: string;
        inputActionName: string;
        inputContextName: string;
        enabled: boolean;
        pressed: boolean;
        text: string;
        inputText: string;
        inputName: string;
        eventToView: string;
        alsoToGlobalFlow: boolean;
        themes: string[];
    }
    class InputBarParams {
        __Type: string;
        buttons: InputBarButtonParams[];
        description: string;
        release(): void;
    }
    function setInputBar(id: string, params: InputBarParams): void;
    function addInputBar(id: string, parentId: string, params: InputBarParams): void;
    function clearInputBar(id: string): void;
}
declare type NotificationButtonThemes = "warning" | "secondary" | "";
declare class NotificationButton {
    __Type: string;
    title: string;
    event: string;
    theme: NotificationButtonThemes;
    toGlobalFlow: boolean;
    close: boolean;
    enabled: boolean;
    constructor(_title?: string, _event?: string, _close?: boolean, _theme?: NotificationButtonThemes, _toGlobalFlow?: boolean);
}
declare function isWindowEnabled(): boolean;
declare function setWindowEnabled(val: boolean): void;
declare namespace PopUp {
    function isBlockedByPopUp(): boolean;
    type PopUpStyle = "small" | "normal" | "big" | "sensitivity" | "big-help";
    class NotiticationParams {
        __Type: string;
        title: string;
        description: string;
        contentUrl: string;
        contentTemplate: string;
        contentData: string;
        buttons: NotificationButton[];
        closePopupTitle: string;
        style: PopUpStyle;
        displayGlobalPopup: boolean;
    }
    function showPopUp(params: NotiticationParams): void;
}
declare class ComponentRegister {
    tagname: string;
    import: string;
    imported: boolean;
    addImport(): void;
}
declare class ComponentMgr {
    private m_registered;
    constructor();
    private onNodeInserted;
    checkAllComponents(): void;
    registerComponent(tag: string, includePath: string): void;
}
declare let g_ComponentMgr: ComponentMgr;
declare function updateGlobalVar(key: string, value: string | number | boolean): void;
declare const sizeVariables: string[];
declare function updateMinimalTextSize(size: number): void;
declare let currentDebugMode: any;
declare function updateDebugMode(value: string): void;
declare function updateUiScaling(scale: number): void;
declare function updateShowTooltip(show: boolean): void;
declare function updateExclusiveFocusGuid(focusGuid: string): void;
declare var g_tipMgr: TipsMgr;
declare class TipsMgr {
    private tipsMap;
    static create(): void;
    CreateTips(_elem: UIElement, _strId: string, _strTipDesc: string): void;
    CreateChoiceTips(_elem: UIElement, _strId: string, _daChoiceDescs: string[], _default: number): void;
    displayTip(tipId: string, forcedTipsContainer?: VirtualScrollElement, bDisplayChangePrivilege?: boolean): void;
}
declare enum COLOR_PRESETS {
    DEFAULT = "--color-cyan/--color-yellow",
    HIGH_CONTRAST = "#1900FF/#F0C808",
    PROTANOPIA = "#5a81df/#e4ca14",
    PROTANOPIA_HIGH_CONTRAST = "#0011FF/#FFDF00",
    DEUTERANOPIA = "#2f86e5/#ffbf32",
    DEUTERANOPIA_HIGH_CONTRAST = "#002ECD/#ffce83",
    TRITANOPIA = "#d53031/#00929c",
    TRITANOPIA_HIGH_CONTRAST = "#fd1700/#00edff"
}
declare function updateColorPreset(preset: keyof typeof COLOR_PRESETS): void;
declare function updateBackgroundOpacity(opacity: number): void;
declare function updateAnimationsEnabled(enabled: boolean): void;
declare var _optiPow10: any[];
declare function fastPow10(_frac: any): any;
declare function fastToFixed(_val: any, _fraction: any): any;
declare function prepareForSetText(_element: Element): Text;
declare function setText(_node: Text, _text: string): void;
declare function diffAndSetText(_element: Element, _newValue: string): void;
declare function diffAndSetHTML(_element: HTMLElement | SVGElement, _newValue: string): void;
declare function diffAndSetAttribute(_element: Element, _attribute: string, _newValue: string): void;
declare enum StyleProperty {
    display = 0,
    color = 1,
    opacity = 2,
    backgroundColor = 3,
    transform = 4,
    textAlign = 5,
    fontSize = 6,
    letterSpacing = 7,
    pointerEvents = 8,
    visibility = 9,
    border = 10
}
declare function diffAndSetStyle(_element: HTMLElement | SVGElement, _property: StyleProperty, _newValue: string): void;
declare namespace KeyCode {
    const KEY_CANCEL = 3;
    const KEY_HELP = 6;
    const KEY_BACK_SPACE = 8;
    const KEY_TAB = 9;
    const KEY_CLEAR = 12;
    const KEY_RETURN = 13;
    const KEY_ENTER = 13;
    const KEY_SHIFT = 16;
    const KEY_CONTROL = 17;
    const KEY_ALT = 18;
    const KEY_PAUSE = 19;
    const KEY_CAPS_LOCK = 20;
    const KEY_ESCAPE = 27;
    const KEY_SPACE = 32;
    const KEY_PAGE_UP = 33;
    const KEY_PAGE_DOWN = 34;
    const KEY_END = 35;
    const KEY_HOME = 36;
    const KEY_LEFT = 37;
    const KEY_UP = 38;
    const KEY_RIGHT = 39;
    const KEY_DOWN = 40;
    const KEY_PRINTSCREEN = 44;
    const KEY_INSERT = 45;
    const KEY_DELETE = 46;
    const KEY_0 = 48;
    const KEY_1 = 49;
    const KEY_2 = 50;
    const KEY_3 = 51;
    const KEY_4 = 52;
    const KEY_5 = 53;
    const KEY_6 = 54;
    const KEY_7 = 55;
    const KEY_8 = 56;
    const KEY_9 = 57;
    const KEY_SEMICOLON = 59;
    const KEY_EQUALS = 61;
    const KEY_A = 65;
    const KEY_B = 66;
    const KEY_C = 67;
    const KEY_D = 68;
    const KEY_E = 69;
    const KEY_F = 70;
    const KEY_G = 71;
    const KEY_H = 72;
    const KEY_I = 73;
    const KEY_J = 74;
    const KEY_K = 75;
    const KEY_L = 76;
    const KEY_M = 77;
    const KEY_N = 78;
    const KEY_O = 79;
    const KEY_P = 80;
    const KEY_Q = 81;
    const KEY_R = 82;
    const KEY_S = 83;
    const KEY_T = 84;
    const KEY_U = 85;
    const KEY_V = 86;
    const KEY_W = 87;
    const KEY_X = 88;
    const KEY_Y = 89;
    const KEY_Z = 90;
    const KEY_LEFT_CMD = 91;
    const KEY_RIGHT_CMD = 93;
    const KEY_CONTEXT_MENU = 93;
    const KEY_NUMPAD0 = 96;
    const KEY_NUMPAD1 = 97;
    const KEY_NUMPAD2 = 98;
    const KEY_NUMPAD3 = 99;
    const KEY_NUMPAD4 = 100;
    const KEY_NUMPAD5 = 101;
    const KEY_NUMPAD6 = 102;
    const KEY_NUMPAD7 = 103;
    const KEY_NUMPAD8 = 104;
    const KEY_NUMPAD9 = 105;
    const KEY_MULTIPLY = 106;
    const KEY_ADD = 107;
    const KEY_SEPARATOR = 108;
    const KEY_SUBTRACT = 109;
    const KEY_DECIMAL = 110;
    const KEY_DIVIDE = 111;
    const KEY_F1 = 112;
    const KEY_F2 = 113;
    const KEY_F3 = 114;
    const KEY_F4 = 115;
    const KEY_F5 = 116;
    const KEY_F6 = 117;
    const KEY_F7 = 118;
    const KEY_F8 = 119;
    const KEY_F9 = 120;
    const KEY_F10 = 121;
    const KEY_F11 = 122;
    const KEY_F12 = 123;
    const KEY_F13 = 124;
    const KEY_F14 = 125;
    const KEY_F15 = 126;
    const KEY_F16 = 127;
    const KEY_F17 = 128;
    const KEY_F18 = 129;
    const KEY_F19 = 130;
    const KEY_F20 = 131;
    const KEY_F21 = 132;
    const KEY_F22 = 133;
    const KEY_F23 = 134;
    const KEY_F24 = 135;
    const KEY_NUM_LOCK = 144;
    const KEY_SCROLL_LOCK = 145;
    const KEY_COMMA = 188;
    const KEY_PERIOD = 190;
    const KEY_SLASH = 191;
    const KEY_BACK_QUOTE = 192;
    const KEY_OPEN_BRACKET = 219;
    const KEY_BACK_SLASH = 220;
    const KEY_CLOSE_BRACKET = 221;
    const KEY_QUOTE = 222;
    const KEY_META = 224;
}
interface ISvgMapParams {
    configPath?: string;
    svgElementId?: string;
    svgElement?: Element;
}
declare abstract class ISvgMapRootElement extends TemplateElement {
    abstract getWidth(): any;
    abstract getHeight(): any;
    abstract onBeforeMapRedraw(): any;
}
declare class EmptyCallback {
    static Void: () => void;
    static Boolean: (result: boolean) => void;
}
declare class IconCacheMgr {
    private m_cache;
    private m_loading;
    private m_loadingCallbacks;
    loadURL(url: string, callback: any): void;
    addCachedAsString(url: string, content: string | null): void;
    getCached(url: string): string | null | undefined;
}
declare function getIconCacheMgr(): IconCacheMgr;
declare class IconElement extends UIElement {
    static get observedAttributes(): string[];
    protected template: HTMLElement;
    protected svgAsString: string;
    protected iconsPath: string;
    protected image: HTMLImageElement;
    protected imagePaths: Array<string>;
    constructor();
    connectedCallback(): void;
    set iconUrl(src: string);
    get iconUrl(): string;
    private refreshDataUrl;
    private htmlToElement;
    private onIconLoaded;
    private getSvg;
    private createContent;
    private updateAspectOverride;
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
    private setImage;
    private imageFound;
    private imageNotFound;
}
