/// <reference path="./animation/animation.d.ts" />

declare global {
    interface Document {
        createElement(tagName: "import-template"): ImportTemplateElement;
        createElement(tagName: "import-script"): ImportScriptElement;
        createElement(tagName: "ui-element"): UIElement;
        createElement(tagName: "template-element"): TemplateElement;
        createElement(tagName: "ui-marquee"): UIMarquee;
        createElement(tagName: "l10n-label"): LabelizeElement;
        createElement(tagName: "ui-image"): UIImageElement;
        createElement(tagName: "icon-text"): IconTextElement;
        createElement(tagName: "device-button"): DeviceButtonElement;
        createElement(tagName: "icon-element"): IconElement;
    }

    let bDebugKeyNavigation: boolean;
    let bLiveReload: boolean;
    let bAutoReloadCSS: boolean;
    let bDebugListeners: boolean;
    let g_externalVariables: {
        animationsEnabled: boolean;
    };

    /**
     * Gets the configuration the game is running in.
     */
    function GameConfiguration(): GAME_CONFIGURATION;

    /**
     * Returns if the game is running in the DEBUG configuration.
     */
    function DEBUG(): boolean;
    /**
     * Returns if the game is running in the RELEASE configuration.
     */
    function RELEASE(): boolean;
    /**
     * Returns if the game is running in the MASTER configuration.
     */
    function MASTER(): boolean;
    /**
     * Returns if the game is running in the SUBMISSION configuration.
     */
    function SUBMISSION(): boolean;

    enum GAME_CONFIGURATION {
        DEBUG = "DEBUG",
        RELEASE = "RELEASE",
        MASTER = "MASTER",
        SUBMISSION = "SUBMISSION"
    }

    const GAME_CONFIGURATION_ORDER: GAME_CONFIGURATION[];

    namespace Logger {
        /**
         * Outputs a message to the console in a DEBUG configuration.
         */
        function trace(...args: any[]): void;
        /**
         * Outputs a message to the console in a DEBUG or RELEASE configuration.
         */
        function log(...args: any[]): void;
        /**
         * Outputs an informational message to the console in a DEBUG or RELEASE configuration.
         */
        function info(...args: any[]): void;
        /**
         * Outputs a warning message to the console in a DEBUG, RELEASE, or MASTER configuration.
         */
        function warn(...args: any[]): void;
        /**
         * Outputs an error message to the console in any configuration.
         */
        function error(...args: any[]): void;
    }

    function GetUIEditionMode(): string;
    function UI_USE_DATA_FOLDER(): boolean;
    function EDITION_MODE(): boolean;

    class ImportTemplateElement extends HTMLElement {
        connectedCallback(): void;
    }

    class ImportScriptElement extends HTMLElement {
        connectedCallback(): void;
    }

    namespace Include {
        function addImport(path: string, callback?: () => void): void;
        function addImports(path: string, callback?: () => void): void;
        function addScript(path: string, callback?: () => void): void;
        function isLoadingScript(pattern: string): boolean;
        function absolutePath(current: string, relativePath: string): string;
        function absoluteURL(current: string, relativePath: string): string;
        function setAsyncLoading(async: boolean): void;
        function onAllResourcesLoaded(): void;
    }

    namespace LiveReload {
        function reloadCSS(): void;

        /**
         * Starts automatically reloading CSS when autoRefresh is true, stops the reloading when false.
         */
        function startAutoReload(autoRefresh: boolean): void;
    }

    // Coherent is assigned in fs-base-ui/html_ui/JS/common.js, however as all the functions are in
    // fs-base-ui/html_ui/JS/coherent.js we list them there and not here.

    let debugDuplicateRegister: boolean;
    let debugLocalization: boolean;
    function cancelAllRequestAnimationFrame(): void;

    namespace CoherentSetup {
        function CheckCoherentEngine(windowElem: Window): void;
        function updateScreenSize(): void;
    }

    namespace Utils {
        function dispatchToAllWindows(event: Event): void;

        /**
         * Converts an arrayLike object into an array.
         */
        function toArray<T>(arrayLike: ArrayLike<T>): T[];

        /**
         * Determines if the window is running in an iframe.
         */
        function inIframe(): boolean;

        /**
         * Creates a div element with the given classes.
         */
        function createDiv(...classList: string[]): HTMLDivElement;

        /**
         * Gets the given percentage of the virtual height, suffixed with "px".
         */
        function getVh(percent: number): string;

        /**
         * Gets the size in pixels adapted to the virtual height.
         * Internally it seems the application works with 1080px.
         */
        function getSize(px: number): number;

        /**
         * Gets the given percentage of the virtual height.
         */
        function getVhNumber(percent: number): number;

        function getScreenRatio(): number;

        /**
         * Gets the screen height of the window.
         */
        function getVirtualHeight(): number;

        /**
         * Determines if the scroll bar is visible for the given element.
         */
        function scrollbarVisible(element: Element): boolean;

        /**
         * Gets a CSS URL string, where any \ in the the url parameter is replaced with / and the URL is prefixed with
         * the given prefix.
         */
        function getExternalImageUrl(url: string, prefix?: string): string;

        /**
         * Returns the remainder of one number divided by another.
         */
        function Modulo(num: number, mod: number): number;

        /**
         * Returns the number with as many "0" prefixes as needed to get to a string of the given length.
         */
        function pad(num: number | string, length: number): string;

        function replace_nth(str: string, find: string, replace: string, index: number): string;

        function forceParagraphLines(text: string, n?: number): string;

        /**
         * Replaces dashes followed by lowercase characters with a uppercase characters.
         * @example
         * // returns "someTextThing".
         * dashToCamelCase('some-text-thing');
         */
        function dashToCamelCase(str: string): string;

        /**
         * Does absolutely nothing useful.
         */
        function timeLine(str?: any): void;

        /**
         * Converts a given time to seconds.
         * @example
         * // returns 4230.
         * DisplayTimeToSeconds("01:10:30");
         * // returns 4200.
         * DisplayTimeToSeconds("01:10");
         * // returns 3600.
         * DisplayTimeToSeconds("1");
         */
        function DisplayTimeToSeconds(str: string): number;

        /**
         * Determines if the given URLs are equal. Internally, coui://html_ui and coui://html_UI are removed and only
         * then equality is determined.
         */
        function urlEqual(url1: string | void, url2: string): boolean;

        /**
         * Removes all children of the given node.
         */
        function RemoveAllChildren(elem: Node): void;

        /**
         * Formats the given number to a localized string.
         */
        function formatNumber(value: number, integer?: boolean): string;

        /**
         * Formats the given number as an (localized???) integer.
         */
        function formatInteger(value: number): string;

        /**
         * Returns a number limited to the given range.
         * @param value The preferred value.
         * @param min The lower boundary.
         * @param max The upper boundary.
         * @returns min <= returnValue <= max.
         */
        function Clamp(value: number, min: number, max: number): number;

        function Loop(n: number, min: number, max: number): number;

        /**
         * Determines if the given node is hidden through style.display "none". When recurs is true,
         * also determines if parents of the given node are hidden.
         */
        function isHidden(elem: Node | void, recurs: boolean): boolean;

        /**
         * Determines if the given element is visible.
         */
        function isVisible(elem: Element): boolean;

        /**
         * Converts a string representing a boolean to a boolean.
         * @example
         * // Returns true.
         * strToBool("TRUE");
         * strToBool("true");
         * // Returns false.
         * strToBool("FALSE");
         * strToBool("false");
         * strToBool("unicorns and rainbows");
         */
        function strToBool(value: string): boolean;

        /**
         * Filters the given input element with the given filter. When the filter returns true, the value is accepted,
         * when it returns false, the previous input element's value is set.
         */
        function setInputFilter(inputElement: HTMLInputElement | HTMLTextAreaElement,
                                inputFilter: (value: string) => boolean): void;

        /**
         * Determines if the given string value is a number.
         */
        function isNumeric(value: string): boolean;

        /**
         * Determines if the given string value is a number. Warning: the implementation also considers "10.5" to be
         * an integer.
         */
        function isInteger(value: string): boolean;

        function SmoothPow(origin: number, destination: number, smoothFactor: number, dTime: number): number;

        function SmoothLinear(origin: number, destination: number, smoothFactor: number, dTime: number): number;

        function SmoothSin(origin: number, destination: number, smoothFactor: number, dTime: number): number;

        /**
         * Removes all elements from the given node.
         */
        function ClearIframe(elem: Node): void;

        /**
         * Randomly generates a GUID-like string.
         */
        function generateGUID(): string;

        /**
         * Determines if the value contains shouldContain. Does so case-insensitive and trimming any whitespace.
         */
        function containStr(shouldContain: string, value: string): boolean;

        function getCaretPosition(control: HTMLInputElement | HTMLTextAreaElement): number;

        function setCaretPosition(control: HTMLInputElement | HTMLTextAreaElement, position: number): void;

        /**
         * Generates a random name between 4 and 19 characters long.
         */
        function generateRandomName(): string;

        /**
         * Generates a lorem ipsum text of the given length.
         */
        function generateLorem(length: number): string;

        /**
         * Removes "bitch", "shit", and "asshole" from the given string.
         */
        function filterProfanity(value: string): string;

        function Translate(key: string): string | null;

        function SetTextVariable(varName: string, value: string): void;

        /**
         * Converts the given totalSeconds to a duration string. Currently it is unknown how this differs from
         * SecondsToDisplayTime.
         * @param totalSeconds The total number of seconds to calculate a duration string for.
         * @param withMinutes Whether or not the return value should contain minutes, when false also excludes seconds,
         * e.g. 3740 seconds becomes: "01".
         * @param withSeconds Whether or not the return value should contain seconds, when false 3740 seconds
         * becomes: "01:02".
         * @param doLocalize Whether or not to localize the string, defaults to true.
         */
        function SecondsToDisplayDuration(totalSeconds: number, withMinutes: boolean, withSeconds: boolean,
                                          doLocalize?: boolean): string;

        /**
         * Converts the given totalSeconds to a time string. Currently it is unknown how this differs from
         * SecondsToDisplayDuration.
         * @param totalSeconds The total number of seconds to calculate a time string for.
         * @param withMinutes Whether or not the return value should contain minutes, when false also excludes seconds,
         * e.g. 3740 seconds becomes: "01".
         * @param withSeconds Whether or not the return value should contain seconds, when false 3740 seconds
         * becomes: "01:02".
         * @param doLocalize Whether or not to localize the string, defaults to true.
         */
        function SecondsToDisplayTime(totalSeconds: number, withMinutes: boolean, withSeconds: boolean,
                                      doLocalize?: boolean): string;

        /**
         * Converts the given hours, minutes and seconds to a time string: "hh:mm:ss".
         * When minutes < 0: "hh". When seconds < 0: "hh:mm".
         */
        function timeToString(hours: number, minutes: number, seconds: number): string;

        /**
         * Determines whether a file by the given fileName exists.
         */
        function doesFileExist(fileName: string): boolean;

        /**
         * Loads the contents of the given file and provides it through the successCallback.
         */
        function loadFile(fileName: string, successCallback: (contents: string) => void): void;

        /**
         * Clones the given object using JSON stringify and parse.
         */
        function slowDeepClone(object: any): any;

        function showTooltip(id: string, tooltip: string, posXRel: number, posYRel: number, maxWidth?: number): void;

        function hideTooltip(id: string): void;

        /**
         * Adds leading (and trailing) zeros to the given value.
         * @param value The numeric value to add zeros to.
         * @param nbDigits The minimum number of digits before the decimal separator.
         * @param pointFixed The minimum number of digits after the decimal separator.
         */
        function leadingZeros(value: number, nbDigits: number, pointFixed?: number): string;

        /**
         * Counts the number of digits after the decimal separator.
         */
        function countDecimals(value: number | string): number;
    }

    function SetBackgroundImage(img: any): void;
    function SetBlurredBackgroundRatio(val: any): void;
    function SetBlurredBackground(bVal: boolean): void;

    class SoundManager {
        static SND_VALID: "VALID";
        static SND_OVER: "SELECT";
        static SND_INVALID: "INVALID";

        /**
         * Registers sounds to be played on interactions with the element.
         * @returns A function to deregister the sounds.
         */
        RegisterSoundButton(elem: Element, type?: string | void): () => void;

        /**
         * Determines if a sound can be played for the given element.
         * @param elem
         */
        canPlaySound(elem: Element): boolean;
        OnMouseOverOnElement(elem: Element, type: string | void, event: Event): void;
        OnMouseLeaveElement(elem: Element, type: string | void, event: Event): void;
        OnMouseDownOnElement(elem: Element, type: string | void, event: Event): void;
        OnClickOnElement(elem: Element, type: string | void, event: Event): void;
        PlaySound(sndNType: "SND_VALID" | "SELECT" | "INVALID", type: string | void): void;
    }

    const g_SoundMgr: SoundManager;

    function LaunchFlowEvent(eventName: string, ...args: any[]): void;
    function LaunchFlowEventToGlobalFlow(eventName: string, ...args: any[]): void;
    function OpenBrowser(url: string): void;
    function InstanciateTemplate2(selector: string, templatedElement: ParentNode): DocumentFragment | null;
    function InstanciateTemplate(parent: any, selector: string): HTMLDivElement;

    class UINavigation {
        static set lockFocus(value: boolean);
        static get lockFocus(): boolean;
        static set previous(value: UIElement | null);
        static get previous(): UIElement | null;
        static get previousRaw(): UIElement | void;
        static set current(value: UIElement | null);
        static get current(): UIElement | null;
        static get currentRaw(): UIElement | null;
        static askGrabKeys(): void;
        static releaseKeys(): void;
        static addMouseModeEventListener(callback: EventListener | EventListenerObject): void;
        static removeMouseModeEventListener(callback: EventListener | EventListenerObject): void;
        static addKeysModeEventListener(callback: EventListener | EventListenerObject): void;
        static removeKeysModeEventListener(callback: EventListener | EventListenerObject): void;
        static enterMouseMode(): void;
        static onKeyDown(e: KeyboardEvent): void;
        static onEnableChange(): void;
        static get KeysMode(): boolean;
        static getDefaultButton(doc?: Document): UIElement | null;
        static canNavigate(): boolean;
        static onShow(): void;
        static onHide(): void;
        static disableKeyNavigation(): void;
        static enableKeyNavigation(): void;
        static onKeyDownOnRoot(keycode: number): void;
        static enterKeysMode(): void;
    }

    enum KeyNavigationDirection {
        KeyNavigation_None = 0,
        KeyNavigation_Horizontal = 1,
        KeyNavigation_Vertical = 2,
        KeyNavigation_Grid = 3
    }

    class UIElement extends HTMLElement {
        static getUIElement(elem: UIElement | void): UIElement | null;
        static get observedAttributes(): string[];
        onDefaultKeyDown: (e: KeyboardEvent) => void;
        onDefaultKeyUp: (e: KeyboardEvent) => void;
        sendSizeUpdate: () => void;
        previousButton: UIElement | null;
        disconnectedCallback(): void;
        get childActiveClass(): string;
        onActiveChildBlurred(child?: any): void;
        onActiveChildFocused(child?: any): void;
        registerDefaultKeyEvents(): void;
        get localGrid(): {
            col: string;
            row: string;
            rowEnd: string;
            colEnd: string;
        } | null;
        set localgridColumn(value: string);
        get localgridColumn(): string;
        get localgridColumnEnd(): string;
        get localgridRow(): string;
        get localgridRowEnd(): string;
        get globalGridColumn(): string[];
        get globalGridColumnEnd(): string[];
        get globalGridRow(): string[];
        get globalGridRowEnd(): string[];
        unregisterDefaultKeyEvents(): void;
        spreadToChildren(parent: ParentNode, parentClass: string, childClass: string): void;
        unspreadToChildren(parent: ParentNode, parentClass: string, childClass: string): void;
        setVisible(value: boolean): void;
        isVisible(): boolean;
        onVisibilityChange(visible: boolean): void;
        get enabled(): boolean;
        enable(value: boolean): void;
        disable(value: boolean): void;
        set disabled(value: boolean);
        get disabled(): boolean;
        isOneParentHidden(): boolean;
        canBeSelectedDisabled(): boolean;
        canBeSelectedLocked(): boolean;
        canBeSelectedWithKeys(): boolean;
        get forceNoKeyNavigation(): boolean;
        get canBeSelected(): boolean;
        set locked(value: boolean);
        get locked(): boolean;
        set loading(value: boolean);
        get loading(): boolean;
        connectedCallback(): void;
        attributeChangedCallback(name: string, oldValue: any, newValue: any): void;

        /**
         * Determines if this instance is an ancestor of the given child node.
         * When the given child node is equal to the instance it is also considered an ancestor.
         */
        isParentOf(child: Node): boolean;

        /**
         * Determines whether this is a descendant of the given node.
         */
        isChildOf(parentToTest: Node): boolean;
        hasParentHidden(): boolean;
        queryElement(selector: string): Element | null;
        setJSONData(data: any): void;
        setAnyData(data: any): void;
        getKeyNavigationDirection(): KeyNavigationDirection;
        getAllFocusableChildren(): Element[] | null;
        getKeyNavigationStayInside(keycode: number): boolean;
        selectDefaultButton(): void;
        selectDefaultChildButton(): void;
        getDefaultButton(): UIElement | null;
        getDefaultChildButton(): UIElement | null;
        virtualScrollIntoView(element: EventTarget): void;
        onButtonSelected(button: any): void;
        onButtonUnselected(button: any): void;
        onKeyUp(keycode: number): boolean;
        onKeyDown(keycode: number): boolean;
        get autoInside(): boolean;
        focusByKeys(keycode?: number): void;
        unFocusByKeys(): void;
    }

    let g_checkComponentsTimeout: number;

    class TemplateElement extends UIElement {
        static call(obj: Element, fn: Function, ...args: any[]): void;
        static callNoBinding(obj: Element, fn: () => void): void;

        created: boolean;
        instantciatePopupToolbar: () => void;
        callbackCreated: () => void;
        get templateID(): string;
        Instanciate(): null | void;
        querySelectorH(selector: string): Element | null;
        appendContent(element: Node): void;
        onResourceLoaded(e: CustomEvent<string>): void;
        convertPath(path: string): string;
    }

    class UIMarquee extends UIElement {
        constructor(...args: any[]);
        updateScrollBehaviour: () => void;
        updateScrollAnimation: () => void;
        startScrollAnimation: () => void;
        stopScrollAnimation: () => void;
        needsTooltip(): boolean;
        needsEllipsis(): boolean;
        noSizeCheck(): boolean;
        set manual(value: boolean);
        get manual(): boolean;
        scrollAnimation(): UITimeline;
    }

    class LabelizeElement extends UIElement {
        constructor(...args: any[]);
        updateText: () => void;
        set key(value: string | null);
        get key(): string | null;
    }

    class UIImageElement extends TemplateElement {
        onImageLoaded: () => void;
        onImageError: () => void;
        updateBackground: () => void;
        get transition(): boolean;
        LoadContentURL(srcImage: string, urlContent: string, contentTag: string, contentData: any): void;
        set src(value: string);
        get src(): string;
        clear(): void;
        set transitionTime(value: number);
        get transitionTime(): number;
    }

    namespace ViewListener {
        class ViewListener {
            constructor(name: string);

            connected: boolean;
            CheckCoherentEvent: (listenerName: string, ...args: any[]) => void;
            unregister: () => void;
            onEventToAllSubscribers: (eventName: string, ...args: any[]) => void;
            onGlobalEvent(eventName: string, ...args: any[]): void;
            off(name: string, callback: (...args: any[]) => void, context: any): void;
            on(name: string, callback: (...args: any[]) => void, context: any): void;
            trigger(name: string, ...args: any[]): void;
            triggerToAllSubscribers(event: any, ...args: any[]): void;
        }

        class ViewListenerMgr {
            OnListenerRegistered: (name: any) => void;
            onRegister(name: string, viewListener: ViewListener): void;
            getListenerByName(name: string): ViewListener;
            onUnregister(name: string, viewListener: ViewListener, force?: boolean): void;
        }

        let g_ViewListenersMgr: ViewListenerMgr;
    }

    function RegisterViewListenerT<T>(name: string, callback: (() => void) | void, type: new() => T,
                                      requiresSingleton?: boolean): T;
    function RegisterViewListener(name: string, callback?: () => void,
                                  requiresSingleton?: boolean): ViewListener.ViewListener;

    class Name_Z {
        static isValid(a: Name_Z | void): boolean;
        static compare(a: Name_Z | void, b: Name_Z | void): boolean;
        static compareStr(a: Name_Z | void, b: string): boolean;
        constructor(str: string, eventHandler?: () => void);
        idLow: number;
        idHigh: number;
        originalStr: string;
        refresh(): void;
        RequestNameZ(eventHandler?: () => void): void;
        str: string;
    }

    function checkAutoload(forcedUrl?: string): void;
    function EaseInOutQuad(t: number, b: number, c: number, d: number): number;
    function ScrollHTo(element: Element, to: number, duration: number): void;
    function ScrollVTo(element: Element, to: number, duration: number): void;
    function GetViewUrl(): string;

    enum EResizeType {
        NONE,
        X,
        Y,
        BOTH,
        RATIO,
        COUNT
    }

    class ResizeHandler {
        constructor(element: Node, handleByGame: boolean);
        handleMouseOut: () => void;
        startResize: (e: MouseEvent) => void;
        resizing: boolean;
        resizeUpdate: (e: MouseEvent) => void;
        updateResizeX: (e: MouseEvent) => void;
        updateResizeY: (e: MouseEvent) => void;
        resizeEnd: (e: MouseEvent) => void;
        element: Node;
        setResizeType(direction: "x" | "y" | "none" | "both" | string): void;
        initResizeX(): void;
        removeResize(): void;
        initResizeY(): void;
        initResizeXY(): void;
        OnResizeStart(callback: (e: MouseEvent) => void): void;
        OnResizeUpdate(callback: (e: MouseEvent) => void): void;
        OnResizeEnd(callback: (e: MouseEvent) => void): void;
        RemoveHandlers(): void;
    }

    class DragDropHandler {
        constructor(element: Element, options: {
            handleByGame: boolean;
            boundByWidth: boolean;
            boundByHeight: boolean;
        } | void);
        canBeDragged: boolean;
        onResize: () => void;
        checkCanDrag: (e: Event) => void;
        leaveDrag: () => void;
        startDrag: (e: MouseEvent) => void;
        dragUpdate: (e: MouseEvent) => void;
        dragEnd: (e: MouseEvent) => void;
        element: Element;
        dragElement: Element;
        release(): void;
        OnDragStart(callback: (e: MouseEvent) => void): void;
        OnDragUpdate(callback: (e: MouseEvent) => void): void;
        OnDragEnd(callback: (e: MouseEvent) => void): void;
        isDragging(): boolean;
    }

    function saveElementPosition(element: Element): void;
    function eraseElementPosition(id: string): void;
    function setElementWidth(element: Element): void;
    function setElementPosition(element: Element): void;
    function OnInputFieldFocus(e: Event): void;
    function OnInputFieldUnfocus(e: Event): void;
    function LogCallstack(message: string): void;

    let bDebugLoading: boolean;

    class SmartLoader {
        OnNodeRemoved: (e: Event) => void;
        convertPath(path: string): string;
        addResource(path: string): void;
        onDocumentLoaded(): void;
        onResourceLoaded(e: CustomEvent<any>): void;
        checkLoaded(): void;
        onInputRemoved(input: HTMLInputElement): void;
        checkAllInputElements(): void;
    }

    let loader: SmartLoader;

    class DebugMgr {
        CreateDebugPanel(): void;
        dragDropHandler: DragDropHandler;
        setDefaultPos(rightPercentage: number, topPercentage: number): void;
        AddDebugButton(text: string, callback: (...args: any[]) => void, autoStart?: boolean): void;
        UpdateConsole(): void;
        AddConsole(callback: (...args: any[]) => void, force?: boolean): void;
        log(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        logConsole(style: string | string[], ...rest: any[]): void;
    }

    enum MouseCursor {
        DRAG,
        RESIZE_H,
        RESIZE_V,
        RESIZE_HV
    }

    namespace Cursor {
        function setCursor(cursor: MouseCursor): void;
        function unsetCursor(): void;
    }

    class DataValue {
        static set(name: string, value: number | void, unit: any, valueStr?: string): DataValue;

        name: string;
        value: number | void;
        unit: any;
        valueStr: string | null;
        html: string;
    }

    class TreeDataValue extends DataValue {
    }

    class RangeDataValue extends DataValue {
    }

    class DataTable {
    }

    let g_debugMgr: DebugMgr;

    class Vec2 {
        static FromRect(elem: DOMRectReadOnly): Vec2;
        static Delta(vec1: Vec2, vec2: Vec2): Vec2;
        static SqrDistance(p1: Vec2, p2: Vec2): number;
        static Distance(p1: Vec2, p2: Vec2): number;

        constructor(x?: number, y?: number);

        x: number;
        y: number;

        VectorTo(pt2: Vec2 | void): Vec2;
        toCurvePointString(): string;
        Dot(b: Vec2): number;
        GetNorm(): number;
        Normalize(): void;
        SetNorm(n: number): void;
    }

    class Vec3 {
        constructor(x: number, y: number, z: number);
        x: number;
        y: number;
        z: number;
        toString(): string;
    }

    class IconTextElement extends UIElement {
        static CLASS_NAME: "IconTextElement";

        get basePath(): string;
        get subPath(): string | null;
        get imageName(): string | null;
        get altText(): string | null;
        get observedAttributes(): any[];
        updateIcon(): void;
        displayAltText(icon: Element, altText: string): void;
    }

    class DeviceButtonElement extends IconTextElement {
        setData(subPath: string, imageName: string, altText: string): void;
    }

    class AtlasItemInfos {
        elem: Element;
        rect: DOMRect;
    }

    class AltasElementsMgr {
        GetAtlasElements: () => void;
        SendItem(registeredElem: AtlasItemInfos): void;
        RemoveAtlasElement(elem: Element): void;
        AddAtlasElement(elem: Element): void;
    }

    let g_AtlasMgr: AltasElementsMgr;

    namespace InputBar {
        const MENU_BUTTON_A: "MENU_VALID";
        const MENU_BUTTON_B: "MENU_BACK";
        const MENU_BUTTON_X: "MENU_VALI2";
        const MENU_BUTTON_Y: "MENU_CANCEL";
        const MENU_BUTTON_START: "MENU_START";
        const MENU_BUTTON_SELECT: "MENU_SELECT";
        const MENU_BUTTON_OPEN: "MENU_OPEN";
        const MENU_BUTTON_RESET: "MENU_RESET";
        const MENU_BUTTON_APPLY: "MENU_APPLY";
        const MENU_BUTTON_PRESET_MANAGER: "MENU_PRESET_MANAGER";
        const MENU_BUTTON_QUIT: "MENU_QUIT_GAME";
        const MENU_BUTTON_CLOSE: "MENU_CLOSE";
        const MENU_BUTTON_BACK: "MENU_BACK";
        const MENU_BUTTON_WM_FILTERS: "MENU_WM_FILTERS";
        const MENU_BUTTON_WM_LEGEND: "MENU_WM_LEGEND";
        const MENU_BUTTON_CUSTOMIZE: "MENU_CUSTOMIZE";
        const MENU_BUTTON_FLY: "MENU_FLY";
        const MENU_BUTTON_TAB_LEFT: "MENU_L1";
        const MENU_BUTTON_TAB_RIGHT: "MENU_R1";

        function isContainer(elem: any): boolean;

        class InputBarButtonParams {
            static setCallback(id: string, text: string, inputActionName: string, callback: () => void, inputActionContext?: string, alsoToGlobalFlow?: boolean, disabled?: boolean): InputBarButtonParams;

            constructor(id: string, text: string, inputActionName: string, event: any, inputActionContext?: string, alsoToGlobalFlow?: boolean, disabled?: boolean);

            inputContextName: string;
            enabled: boolean;
            alsoToGlobalFlow: boolean;
            id: string;
            text: string;
            inputActionName: string;
            eventToView: any;

            release(): void;
        }

        class InputBarParams {
            buttons: InputBarButtonParams[];
            release(): void;
        }

        function setInputBar(id: string, params: InputBarParams): void;
        function addInputBar(id: string, parentId: string, params: InputBarParams): void;
        function clearInputBar(id: string): void;
    }

    class GameFeaturesListener extends ViewListener.ViewListener {
        isFeatureSupported(name: string): boolean;
    }

    function RegisterGameFeaturesListener(callback?: () => void): GameFeaturesListener;

    class NotificationButton {
        constructor(title?: string, event?: string, close?: boolean, theme?: string, toGlobalFlow?: boolean);

        toGlobalFlow: boolean;
        close: boolean;
        enabled: boolean;
        title: string;
        event: string;
        theme: any;
    }

    function isWindowEnabled(): boolean;
    function setWindowEnabled(value: boolean): void;

    namespace Popup {
        function isBlockedByPopUp(): boolean;

        class PopUpParams {
            buttons: any[];
            style: string;
            displayGlobalPopup: boolean;
        }

        function showPopUp(params: PopUpParams): void;
    }

    class ComponentRegister {
        imported: boolean;
        import: any;
        addImport(): void;
    }

    /**
     * The component manager among other things handles the importing of scripts and templates.
     *
     * The first two examples are for basic usage scenarios. These examples are insufficient for
     * situations where a script or template depends on another script, e.g. when it depends on a
     * class defined in that script. The following attributes are available to handle these cases:
     *
     * `import-async`: when set to false, **all** scripts imported from that moment onward are loaded
     * synchronously. I.e. they are loaded in the order they are listed. Initial loading times will
     * increase when using this attribute.
     *
     * `import-after`: any resource listed in this attribute will be imported after the script
     * declared in the `import-script` attribute was imported. `import-after` supports
     * declaring multiple values by using a `,` separator. Note that `import-after` is not supported
     * for `import-template`.
     *
     * Note that a template imported with `import-template` might itself contain references to
     * other resources. Managing the import sequence of resources across multiple templates is
     * unsupported. Thus, if you need to manage the import order of resources within a template,
     * move the resources referenced by these templates to the importer of said template.
     *
     * @example
     * <script type="text/html" import-script="path/to/script.js"></script>
     * @example
     * <script type="text/html" import-template="path/to/template.html"></script>
     * @example
     * <script type="text/html" import-script="path/to/script.js"
     *   import-after="path/to/template.html,path/to/template.html"></script>
     */
    class ComponentMgr {
        onNodeInserted(event: Event): void;
        checkAllComponents(): void;
        registerComponent(tag: string, includePath: any): void;
    }

    let g_ComponentMgr: ComponentMgr;

    function updateGlobalVar(key: string, value: any): void;
    const sizeVariables: string[];
    function updateMinimalTextSize(size: number): void;
    function updateUiScaling(scale: number): void;
    function updateShowTooltip(show: boolean): void;

    let g_tipMgr: TipsMgr;

    class TipsMgr {
        static create(): void;
        tipsMap: { [key: string]: string };
        CreateTips(elem: Element, strId: string, strTipDesc: string): void;
        CreateChoiceTips(elem: Element, strId: string, daChoiceDescs: string[], defaultIndex: number): void;
        displayTip(tipId: string, forcedTipsContainer?: HTMLElement | null): void;
    }

    enum COLOR_PRESETS {
        DEFAULT = "--color-cyan/--color-yellow",
        HIGH_CONTRAST = "#1900FF/#F0C808",
        PROTANOPIA = "#5a81df/#e4ca14",
        PROTANOPIA_HIGH_CONTRAST = "#0011FF/#FFDF00",
        DEUTERANOPIA = "#2f86e5/#ffbf32",
        DEUTERANOPIA_HIGH_CONTRAST = "#002ECD/#ffce83",
        TRITANOPIA = "#d53031/#00929c",
        TRITANOPIA_HIGH_CONTRAST = "#fd1700/#00edff"
    }

    function updateColorPreset(preset: COLOR_PRESETS): void;
    function updateBackgroundOpacity(opacity: number): void;
    function updateAnimationsEnabled(enabled: boolean): void;
    function fastToFixed(val: number, fraction: number): string;

    enum KeyCode {
        KEY_CANCEL = 3,
        KEY_HELP = 6,
        KEY_BACK_SPACE = 8,
        KEY_TAB = 9,
        KEY_CLEAR = 12,
        KEY_RETURN = 13,
        KEY_ENTER = 13,
        KEY_SHIFT = 16,
        KEY_CONTROL = 17,
        KEY_ALT = 18,
        KEY_PAUSE = 19,
        KEY_CAPS_LOCK = 20,
        KEY_ESCAPE = 27,
        KEY_SPACE = 32,
        KEY_PAGE_UP = 33,
        KEY_PAGE_DOWN = 34,
        KEY_END = 35,
        KEY_HOME = 36,
        KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40,
        KEY_PRINTSCREEN = 44,
        KEY_INSERT = 45,
        KEY_DELETE = 46,
        KEY_0 = 48,
        KEY_1 = 49,
        KEY_2 = 50,
        KEY_3 = 51,
        KEY_4 = 52,
        KEY_5 = 53,
        KEY_6 = 54,
        KEY_7 = 55,
        KEY_8 = 56,
        KEY_9 = 57,
        KEY_SEMICOLON = 59,
        KEY_EQUALS = 61,
        KEY_A = 65,
        KEY_B = 66,
        KEY_C = 67,
        KEY_D = 68,
        KEY_E = 69,
        KEY_F = 70,
        KEY_G = 71,
        KEY_H = 72,
        KEY_I = 73,
        KEY_J = 74,
        KEY_K = 75,
        KEY_L = 76,
        KEY_M = 77,
        KEY_N = 78,
        KEY_O = 79,
        KEY_P = 80,
        KEY_Q = 81,
        KEY_R = 82,
        KEY_S = 83,
        KEY_T = 84,
        KEY_U = 85,
        KEY_V = 86,
        KEY_W = 87,
        KEY_X = 88,
        KEY_Y = 89,
        KEY_Z = 90,
        KEY_LEFT_CMD = 91,
        KEY_RIGHT_CMD = 93,
        KEY_CONTEXT_MENU = 93,
        KEY_NUMPAD0 = 96,
        KEY_NUMPAD1 = 97,
        KEY_NUMPAD2 = 98,
        KEY_NUMPAD3 = 99,
        KEY_NUMPAD4 = 100,
        KEY_NUMPAD5 = 101,
        KEY_NUMPAD6 = 102,
        KEY_NUMPAD7 = 103,
        KEY_NUMPAD8 = 104,
        KEY_NUMPAD9 = 105,
        KEY_MULTIPLY = 106,
        KEY_ADD = 107,
        KEY_SEPARATOR = 108,
        KEY_SUBTRACT = 109,
        KEY_DECIMAL = 110,
        KEY_DIVIDE = 111,
        KEY_F1 = 112,
        KEY_F2 = 113,
        KEY_F3 = 114,
        KEY_F4 = 115,
        KEY_F5 = 116,
        KEY_F6 = 117,
        KEY_F7 = 118,
        KEY_F8 = 119,
        KEY_F9 = 120,
        KEY_F10 = 121,
        KEY_F11 = 122,
        KEY_F12 = 123,
        KEY_F13 = 124,
        KEY_F14 = 125,
        KEY_F15 = 126,
        KEY_F16 = 127,
        KEY_F17 = 128,
        KEY_F18 = 129,
        KEY_F19 = 130,
        KEY_F20 = 131,
        KEY_F21 = 132,
        KEY_F22 = 133,
        KEY_F23 = 134,
        KEY_F24 = 135,
        KEY_NUM_LOCK = 144,
        KEY_SCROLL_LOCK = 145,
        KEY_COMMA = 188,
        KEY_PERIOD = 190,
        KEY_SLASH = 191,
        KEY_BACK_QUOTE = 192,
        KEY_OPEN_BRACKET = 219,
        KEY_BACK_SLASH = 220,
        KEY_CLOSE_BRACKET = 221,
        KEY_QUOTE = 222,
        KEY_META = 224
    }

    class ISvgMapRootElement extends TemplateElement {
    }

    class EmptyCallback {
        static Void: () => void;

        static Boolean: (value: boolean) => void;
    }

    class IconCacheMgr {
        loadURL(url: string, callback: (loaded: boolean, response: string) => void): void;
        addCachedAsString(url: string, content: string): void;
        getCached(url: string): string;
    }

    let IconCache: IconCacheMgr;

    function getIconCacheMgr(): IconCacheMgr;

    class IconElement extends UIElement {
        iconsPath: string;
        image: HTMLImageElement;
        onIconLoaded: (found: boolean, svgAsString: string) => void;
        svgAsString: string;
        imagePaths: string[];

        set iconUrl(value: string);
        get iconUrl(): string;
        refreshDataUrl(): void;
        htmlToElement(html: string): ChildNode;
        getSvg(url: string): void;
        createContent(): void;
        setImage(url: string): void;
        imageFound(): void;
        imageNotFound(): void;
    }
}

export {};
