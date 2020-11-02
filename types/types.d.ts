type NumberVarUnit = ("number" | "Number") | "position 32k" | ("SINT32") | ("bool" | "Bool" | "Boolean" | "boolean") | "Enum" | "lbs" | "kg" | ("Degrees" | "degree")
    | "radians" | ("Percent" | "percent") | ("Feet" | "feet" | "feets" | "Feets") | "Volts" | "Amperes" | "Hertz" | "PSI" | "celsius" | "degree latitude"
    | "degree longitude" | "Meters per second" | "Position" | ("Knots" | "knots") | "Seconds" | "seconds" | "kilograms per second" | "nautical miles" | "degrees"

type TextVarUnit = "Text" | "string"

type LatLongAltVarUnit = "latlonalt";
type LatLongAltPBHVarUnit = "latlonaltpbh";
type PitchBankHeadingVarUnit = "pbh";
type PID_STRUCTVarUnit = "pid_struct";
type XYZVarUnit = "xyz"
type POIListVarUnit = "poilist";
type FuelLevelsVarUnit = "FuelLevels";
type GlassCockpitSettingsVarUnit = "GlassCockpitSettings";

type NauticalMiles = number;
type Heading = number;
type Latitude = number;
type Longitude = number;
type Altitude = number;

type VarUnit = NumberVarUnit | TextVarUnit | LatLongAltVarUnit | LatLongAltPBHVarUnit
    | PitchBankHeadingVarUnit | PID_STRUCTVarUnit | XYZVarUnit;

type SimVarBatchType = "string" | "number";

// asobo-vcockpits-instruments-a320-neo/html_ui/Pages/VCockpit/Instruments/Airliners/A320_Neo/EICAS/ECAM/A320_Neo_ECAMGauge.js
declare global {
    namespace A320_Neo_ECAM_Common {
        class GaugeDefinition {
            startAngle: number;
            arcSize: number;
            minValue: number;
            maxValue: number;
            minRedValue: number;
            maxRedValue: number;
            warningRange: [number, number];
            dangerRange: [number, number];
            cursorLength: number;
            currentValuePos: Vec2;
            currentValueFunction: (() => void) | null;
            currentValuePrecision: number;
            currentValueBorderWidth: number;
            outerIndicatorFunction: (() => void) | null;
            outerDynamicArcFunction: (() => void) | null;
            extraMessageFunction: (() => void) | null;
        }

        class Gauge extends HTMLElement {
            viewBoxSize: Vec2;
            startAngle: number;
            warningRange: [number, number];
            dangerRange: [number, number];
            outerDynamicArcCurrentValues: [number, number];
            outerDynamicArcTargetValues: [number, number];
            extraMessageString: string;
            isActive: boolean;
            get mainArcRadius(): number;
            get graduationInnerLineEndOffset(): number;
            get graduationOuterLineEndOffset(): number;
            get graduationTextOffset(): number;
            get redArcInnerRadius(): number;
            get outerIndicatorOffset(): number;
            get outerIndicatorRadius(): number;
            get outerDynamicArcRadius(): number;
            get currentValueBorderHeight(): number;
            get extraMessagePosX(): number;
            get extraMessagePosY(): number;
            get extraMessageBorderPosX(): number;
            get extraMessageBorderPosY(): number;
            get extraMessageBorderWidth(): number;
            get extraMessageBorderHeight(): number;
            set active(isActive: boolean);
            get active(): boolean;
            polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Vec2;
            valueToAngle(value: number, radians: number): number;
            valueToDir(value: number): Vec2;
            init(gaugeDefinition: GaugeDefinition): void;
            addGraduation(value: number, showInnerMarker: boolean, text?: string, showOuterMarker?: boolean): void;
            refreshActiveState(): void;
            update(deltaTime: number): void;
            refreshMainValue(value: number, force?: boolean): void
            refreshOuterIndicator(value: number, force?: boolean): void
            refreshOuterDynamicArc(start: number, end: number, force?: boolean): void
        }
    }
}

// asobo-vcockpits-instruments-airliners/html_ui/Pages/VCockpit/Instruments/Airliners/Shared/BaseAirliners.js
declare global {
    namespace Airliners {
        class BaseEICAS {
        }

        class EICASTemplateElement extends TemplateElement {
            init(): void
        }
    }
}

// fs-base-ui/html_ui/JS/animation/animation.js
declare global {
    class UITimeline {
        // TODO fill this.
    }
}

// fs-base-ui/html_ui/JS/Avionics.js
declare global {
    namespace Avionics {
        class Utils {
            static make_bcd16(arg: number): number;

            static make_adf_bcd32(arg: number): number;

            static make_xpndr_bcd16(arg: number): number;

            /**
             * Sets the element's innerHTML to newValue when different.
             */
            static diffAndSet(element: InnerHTML, newValue: string): void;

            /**
             * Sets the element's attribute with the given qualifiedName to newValue when different.
             */
            static diffAndSetAttribute(element: Element, qualifiedName: string, newValue: string): void;

            /**
             * Computes the coordinates at the given distance and bearing away from a latitude and longitude point.
             */
            static bearingDistanceToCoordinates(bearing: Heading, distance: NauticalMiles, referentialLat: Latitude,
                                                referentialLong: Longitude): LatLongAlt;

            /**
             * Computes the distance in nautical miles between two locations.
             */
            static computeDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            /**
             * Computes the great circle heading between two locations.
             */
            static computeGreatCircleHeading(from: LatLong | LatLongAlt, to: LatLong | LatLongAlt): Heading;

            /**
             * Computes the great circle distance in nautical miles between two locations.
             */
            static computeGreatCircleDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            static lerpAngle(from: number, to: number, d: number): number;

            static meanAngle(a: number, b: number): number;

            static angleDiff(a: number, b: number): number;

            static fmod(a: number, b: number): number;

            /**
             * Adds a "0" prefix to runway designators which have only one number.
             */
            static formatRunway(designation: string): string;

            static DEG2RAD: number;

            static RAD2DEG: number;

            static runwayRegex: RegExp;
        }

        class SVG {
            static NS: string;

            /**
             * Requests a SVG image from the given url and sets it on the imageElement.
             */
            static InlineSvg(url: string, imageElement: InnerHTML): void;

            static computeDashLine(startX: number, startY: number, length: number, steps: number, width: number, color: string): SVGElement;
        }

        class SVGGraduation {
        }

        class Scroller {
            constructor(nbItems: number, increment: number, canBeNegative: boolean,
                        moduloValue: number, notched: number);

            offsetY: number;

            scroll(value: number): void;
            get increment(): number;
            /**
             * Getter with side-effects: Scroller's index is set to 0.
             */
            get firstValue(): number;
            /**
             * Getter with side-effects: Scroller's index is incremented by 1.
             */
            get nextValue(): number;
            getCurrentValue(): number;
        }

        class AirspeedScroller extends Scroller {
            constructor(spacing: number, notched: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value: string): void;
            update(value: number, divider: number, hideIfLower: number): void;
        }

        class AltitudeScroller extends Scroller {
            constructor(nbItems: number, spacing: number, increment: number, moduloValue: number, notched: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value: string): void;
            update(value: number, divider: number, hideIfLower: number): void;
        }

        class SVGArc {
            static radiansPerPercent: number;

            percent: number;
            angle: number;
            gaugeCenterX: number;
            gaugeCenterY: number;
            gaugeCloseThreshold: number;
            computedStartX: number;
            computedStartY: number;
            computedEndX: number;
            computedEndY: number;
            computedEndAngle: number;

            arc?: HTMLElement;
            arcRadius?: number;
            arcSize?: number;
            arcColor?: string;

            init(arcName: string, radius: number, size: number, color: string): void;
            setPercent(percent: number): void;
            translate(x: number, y: number): void;
            rotate(angle: number): void;
            get svg(): HTMLElement;
            get centerX(): number;
            get centerY(): number;
            get radius(): number | undefined;
            get startX(): number;
            get startY(): number;
            get endX(): number;
            get endY(): number;
            get startAngle(): number;
            get endAngle(): number;
            get currentPercent(): number;
            updateShape(): void;
            getArcPath(percent: number, radius: number): string;
        }

        class CurveTimeValuePair {
            constructor(time: number, value: any);

            time: number;
            value: any;
        }

        class CurveTool {
            static NumberInterpolation(n1: number, n2: number, dt: number): number;
            static StringColorRGBInterpolation(c1: string, c2: string, dt: number): string;
        }

        class Curve {
            add(time: number, value: any): void;
            evaluate(time: number): number | string;
            debugLog(): void;
        }

        class DictionaryItem {
        }

        class Dictionary {
            items: any[];
            changed: boolean;

            set(key: any, value: any): void;
            get(key: any): any | undefined;
            remove(key: any): void;
            exists(key: any): boolean;
        }
    }
}

// fs-base-ui/html_ui/JS/buttons.js
declare global {
    class ButtonElement extends TemplateElement {
        onClick: (e: Event) => void;
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        onMouseDown: () => void;
        onMouseUp: () => void;
        privateOnKeysMode: () => void;
        keydownRouter: (e: Event) => void;
        keyupRouter: (e: Event) => void;
        OnNavigationModeChanged: () => void;
        OnLockButtonChanged: () => void;

        get childActiveClass(): string;
        get canFocusOnMouseOver(): boolean;
        get interactive(): boolean;
        get hasMouseOver(): boolean;
        set hasMouseOver(value: boolean);
        get defaultClick(): boolean;
        get defaultSoundType(): string;
        get soundType(): string;
        set soundType(type: string);
        disconnectedCallback(): void;
        canPlaySound(): boolean;
        set playSoundOnValidate(value: boolean);
        canPlaySoundOnValidate(): boolean;
        onLeave(): void;
        mouseDown(): void;
        onKeysMode(): void;
        mouseUp(): void;
        hasSound(): boolean;
        onHover(): void;
        checkInputbar(): void;
        getInputBarButtonName(): string;
        get tooltip(): string | null;
        get tooltipFollowsMouse(): boolean;
        get tooltipPosition(): [number, number];
        get cuttableTextBoxes(): ArrayLike<NodeListOf<any>>;
        needsTooltip(): boolean;
        get maxTooltipWidth(): number;
        updateTooltip(): void;
        get canBeSelected(): boolean;
        get validateOnReturn(): boolean;
        onKeyUp(keycode): boolean;
        onKeyDown(keycode): boolean;
        CanRegisterButton(): boolean;
        IsActive(): boolean;
        set selected(value: boolean);
        get selected(): boolean;
        Validate(): void
        onValidate(): void;
        findChildButton(parent: Node): boolean;
    }

    class UINavigationBlocElement extends ButtonElement {
        onMouseMode: () => void;
        onActiveElementChanged: () => void;
        exitInside: () => void;

        focusByKeys(keycode: number): void;
        get needInputbar(): boolean;
        forceInsideMode(): void;
        setInsideMode(value: boolean): void;
        getKeyNavigationDirection(): KeyNavigationDirection;
    }

    class ExternalLink extends ButtonElement {
    }

    class InternalLink extends ButtonElement {
    }
}

// fs-base-ui/html_ui/JS/coherent.js
declare global {
    // The functions of Coherent are found in coherent.js.
    // The namespace is assigned in fs-base-ui/html_ui/JS/common.js by CoherentSetup.
    // The vast majority of jsdoc comments in this namespace are copied from coherent.js.
    namespace Coherent {
        /**
         * Indicates whether the script is currently running inside Coherent GT.
         */
        const isAttached: boolean;
        /**
         * @deprecated Please use isAttached (with camelCase).
         * Indicates whether the script is currently running inside Coherent GT.
         */
        const IsAttached: boolean;
        /**
         * Indicates whether mocking should be enabled despite running inside Coherent GT
         */
        let forceEnableMocking: boolean;
        let onEventsReplayed: () => void | null;

        function SendMessage(name: string, id: string, ...args: any[]): void;
        function TriggerEvent(...args: any[]): void;
        function BindingsReady(): void;

        /**
         * Begins recording all events triggered using View::TriggerEvent from the game.
         */
        function beginEventRecording(): void;

        /**
         * Ends event recording.
         */
        function endEventRecording(): void;

        /**
         * Saves the events recorded in between the last calls to beginEventRecording
         * and engine.endEventRecording to a file.
         * @param path The path to the file where to save the recorded events. Defaults to "eventRecord.json".
         */
        function saveEventRecord(path?: string): void;

        /**
         * Replays the events previously recorded and stored in path. If you need to be notified when all events
         * are replayed, assign a callback to onEventsReplayed.
         * @param timeScale The speed at which to replay the events (e.g. pass 2 to double the speed). Defaults to 1.
         * @param path The path to the file the recorded events are stored. Defaults to "eventRecord.json".
         */
        function replayEvents(timeScale?: number, path?: string): void;

        /**
         * Mocks a C++ function call with the specified function.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         * @param name Name of the event.
         * @param mock A function to be called in-place of your native binding.
         * @param isEvent Whether you are mocking an event or function call.
         */
        function mock(name: string, mock: () => any, isEvent: boolean): void;

        /**
         * Translates the given text by invoking the system's localization manager if one exists.
         * @param text The text to translate.
         * @return undefined if no localization manager is set or no translation exists,
         * else returns the translated string.
         */
        function translate(text: string): string | undefined;

        /**
         * Updates the text on all elements with the data-l10n-id attribute by calling translate.
         */
        function reloadLocalization(): void;

        const events: {
            [key: string]: { code: () => void; context: any };
        }
        /**
         * Add a handler for an event.
         * @param name The event name.
         * @param callback Function to be called when the event is triggered.
         * @param context This binding for executing the handler, defaults to the Emitter.
         * @return An object with a clear function to remove the handler for the event.
         */
        function on(name: string, callback: () => void, context: any): { clear: () => void };
        /**
         * Remove a handler for an event.
         * @param name The event name.
         * @param callback Function to be called when the event is triggered.
         * @param context This binding for executing the handler, defaults to the Emitter.
         */
        function off(name: string, callback: () => void, context: any): void;
        /**
         * Trigger an event. This function will trigger any C++ handler registered for
         * this event with `Coherent::UI::View::RegisterForEvent`.
         * @param name name of the event.
         * @param args any extra arguments to be passed to the event handlers.
         */
        function trigger(name: string, ...args: any[]): void;
        /**
         * Shows the debugging overlay in the browser.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         */
        function showOverlay(): void;
        /**
         * Hides the debugging overlay in the browser.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         */
        function hideOverlay(): void;
        /**
         * Call asynchronously a C++ handler and retrieve the result.
         * The C++ handler must have been registered with `Coherent::UI::View::BindCall`.
         * @param name name of the C++ handler to be called.
         * @param args any extra parameters to be passed to the C++ handler.
         * @return ECMAScript 6 promise.
         */
        function call<T>(name: string, ...args: any[]): Promise<T>;
    }
}

// fs-base-ui/html_ui/JS/common.js
declare global {
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
        function pad(num: number, length: number): string;

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
        function formatNumber(value: number): string;

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
        function setInputFilter(inputElement: HTMLInputElement | HTMLTextAreaElement, inputFilter: (value: string) => boolean);

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

        function Translate(key: string): string;

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
        function countDecimals(value: number): number;
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
        static getUIElement(elem: UIElement): UIElement | null;
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
        canBeSelectedWithKeys(): boolean;
        get forceNoKeyNavigation(): boolean;
        get canBeSelected(): boolean;
        set locked(value: boolean);
        get locked(): boolean;
        set loading(value: boolean);
        get loading(): boolean;
        connectedCallback(): void;
        attributeChangedCallback(name: string, oldValue: any, newValue: any): void;
        isParentOf(child: Node): boolean;
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
        onKeyUp(keycode: string): boolean;
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
        onResourceLoaded(e: CustomEvent<any>): void;
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
        __Type: "Name_Z";
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

        constructor(x: number, y: number);

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

// fs-base-ui/html_ui/JS/dataStorage.js
declare global {
    interface DataStorage {
        getData(key: string): any;
        searchData(key: string): DataStorageSearchData[] | null;
        setData(key: string, data: any): any;
        deleteData(key: string): any;
    }

    interface DataStorageSearchData {
        key: any;
        data: any;
    }

    function OnDataStorageReady(): void;
    function GetDataStorage(): DataStorage | void;
    function GetStoredData(key: string): any;
    function SearchStoredData(key: string): any;
    function SetStoredData(key: string, data: any): any;
    function DeleteStoredData(key: string): any;
}

// fs-base-ui/html_ui/JS/debug.js
declare global {
    // The following variables are already declared in fs-base-ui/html_ui/JS/common.js.
    // bLiveReload = false;
    // bAutoReloadCSS = false;
    // bDebugListeners = false;
    // bDebugKeyNavigation = false;
}

// fs-base-ui/html_ui/JS/Flight.js
declare global {
    class LeaderboardEntry {
        constructor(data: any);
        getScoreStr(): string;
    }

    enum LocationType {
        Departure,
        Arrival,
        Free
    }

    class AirportInfos {
    }

    class WaypointInfos {
    }

    class POIInfos {
    }

    class NPCPlaneInfo {
    }

    class WorldLocation {
        static getDebugValue(): {
            image: string;
            icao: string;
            name: string;
            weather: WeatherData;
        };

        constructor(data: {
            lla: LatLongAlt;
            image: string;
            icao: string;
            name: string;
            weather: WeatherData;
        });

        lla: LatLongAlt;
        image: string;
        icao: string;
        name: string;
        weather: WeatherData;

        toString(): string;
    }

    class WeatherData {
        static isEqual(a: any, b: any): boolean;
        static getDebugValue(): WeatherData;

        locked: boolean;
        index: any;
        name: string;
        icon: string;
        weatherImage: string;
        weatherImageLayered: any;
        live: boolean;
        visibility: string;
        wind: string;
    }

    interface TimeDataValue {
        min: number;
        max: number;
        value: number;
        valueStr: string;
        percent: number;
    }

    class TimeData {
        static getDebugValue(): TimeData;

        timeImage: string;
        live: boolean;
        timeLocal: TimeDataValue;
        timeUTC: TimeDataValue;
        dateLocal: TimeDataValue;
        dateUTC: TimeDataValue;
    }

    class ATC_FLIGHTPLAN_TYPE {
        static getName(obj: any): "" | "TT:GAME.ATC_ROUTE_IFR" | "TT:GAME.ATC_ROUTE_VFR";

        constructor(value: any);

        value: any;
    }

    class ATC_ROUTE_TYPE {
        static getName(obj: any): "" | "TT:GAME.ATC_ROUTE_GPS" | "TT:GAME.ATC_ROUTE_VOR_TO_VOR"
            | "TT:GAME.ATC_ROUTE_LOW_AIRWAYS" | "TT:GAME.ATC_ROUTE_HIGH_AIRWAYS" | "TT:GAME.ATC_ROUTE_UNAVAILABLE";

        constructor(value: any);

        value: any;
    }

    class RouteAlgorithmChoice {
    }

    enum FlightLegStateEnum {
        LEG_NOT_STARTED,
        LEG_STARTED,
        LEG_FINISHED
    }

    class FlightLegInfo {
    }

    class Flight {
        constructor(data: any);

        canBeResumed: boolean;
        nextWaypoints: LatLongAlt[];
        leaderboardWorld: LeaderboardEntry[];
        leaderboardFriends: LeaderboardEntry[];
        leaderboardAroundPlayer: LeaderboardEntry[];
    }

    class WorldMapListener extends ViewListener.ViewListener {
        onWorldmapSelectionChange(callback: (...args: any[]) => void): void;
        selectRunway(index: any): void;
        selectWaypointByIndex(index: any): void;
        onWorldMapScaleChanged(callback: (...args: any[]) => void): void;
        onWorldMapFilterChange(callback: (...args: any[]) => void): void;
        getWorldMapFilters(): Promise<unknown>;
        getSelectedFilter(): Promise<unknown>;
        getWorldMapLegend(): Promise<unknown>;
    }

    class GameFlightListener extends ViewListener.ViewListener {
        constructor(name: string);

        onGameFlightUpdated(callback: (...args: any[]) => void): void;
        onTimeUpdated(callback: (...args: any[]) => void): void;
        onWeatherUpdated(callback: (...args: any[]) => void): void;
        onShowFlightPlan(callback: (...args: any[]) => void): void;
        onLeaderbaordUpdated(callback: (...args: any[]) => void): void;
        onEnterActivityMode(callback: (...args: any[]) => void): void;
        onExitActivityMode(callback: (...args: any[]) => void): void;
        resetGameFlight(): void;
        setSelectionAsDeparture(): void;
        resetDeparture(): void;
        onGameFlightReseted(callback: (...args: any[]) => void): void;
        setDepartureRunwayIndex(index: any): void;
        setDepartureTaxiIndex(index: any): void;
        setDeparturePlateIndex(index: any): void;
        setArrivalRunwayIndex(index: any): void;
        setArrivalTaxiIndex(index: any): void;
        setArrivalPlateIndex(index: any): void;
        setApproachIndex(index: any): void;
        setAlgorithmType(fpType: any, routeType: any): void;
        switchDepartureArrival(): void;
        setSelectionAsArrival(): void;
        resetArrival(): void;
        addSelectionToFlightPlan(): void;
        removeSelectionFromFlightPlan(): void;
        setDepartureTime(timeInSeconds: number, utc: any): void;
        increaseDepartureTime(utc: any): void;
        decreaseDepartureTime(utc: any): void;
        setDepartureDate(year: any, monthStart0: any, dayStart0: any): void;
        setWeatherPreset(iPreset: any): void;
        resetToSystemTime(val: any): void;
        setSelectedLegIndex(index: any): void;
        onFlightLegChanged(callback: (...args: any[]) => void): void;
        launchFlight(): void;
        launchFlightWithNPC(): void;
        showLoadSavePopUp(): void;
        setAircraftTailNumber(value: any): void;
        setAircraftCallSign(value: any): void;
        setAircraftFlightNumber(value: any): void;
        setAppendHeavyToCallSign(value: any): void;
        setShowTailNumber(value: any): void;
        setFlightConditionConfiguration(id: any): void;
        updateFlightConditions(): void;
        onUpdateFlightConditionConfiguration(callback: (...args: any[]) => void): void;
        requestGameFlight(callback: (flight: any) => void): void;
    }

    function RegisterGameFlightListener(callback?: () => void): GameFlightListener;
    function RegisterWorldMapListener(callback?: () => void): WorldMapListener;

    class WaypointData {
    }

    class LocationInfo {
    }

    class FlightPlanData {
    }

    class FlightPlanListener {
        constructor(name: any);
        onUpdateFlightPlan(callback: (...args: any[]) => void): void;
        setCruisingAltitude(value: number): void;
        requestFlightPlan(): void;
    }

    function RegisterFlightPlanListener(callback?: () => void): FlightPlanListener;
}

// fs-base-ui/html_ui/JS/Inputs.js
declare global {
    interface Inputs {
        getInputStatus(context: any, action: any): any;
    }

    function GetInputs(): Inputs;

    enum EInputStatus {
        idle,
        pressed,
        down,
        released
    }

    function GetInputStatus(context: any, action: any): any;
}

// fs-base-ui/html_ui/NetBingMap.js
declare global {
    class BingMapsConfig {
        load(source: {
            netBingHeightColor1?: any;
            netBingAltitudeColors1?: any;
            netBingTextureResolution?: any;
            netBingSkyColor1?: any;
            netBingHeightColor2?: any;
            netBingAltitudeColors2?: any;
            netBingSkyColor2?: any;
            netBingHeightColor3?: any;
            netBingAltitudeColors3?: any;
            netBingSkyColor3?: any;
        }, id: number): boolean;
        heightColors: number[];
        aspectRatio: number;
        resolution: number;
        clearColor: number;
    }

    enum EBingMode {
        CURSOR = "Cursor",
        PLANE = "Plane",
        VFR = "Vfr",
        HORIZON = "Horizon"
    }

    enum EBingReference {
        SEA = "Sea",
        PLANE = "Plane"
    }

    enum EWeatherRadar {
        OFF = "Off",
        TOPVIEW = "Topview",
        HORIZONTAL = "Horizontal",
        VERTICAL = "Vertical"
    }

    class BingMapsBinder {
    }

    class BingMapElement extends HTMLElement {
        onListenerRegistered: () => void;
        onListenerBinded: (binder: { friendlyName: any; is3D: boolean }, uid: any) => void;
        updateMapImage: (uid: any, img: string) => void;
        OnDestroy: () => void;
        connectedCallback(): void;
        disconnectedCallback(): void;
        isReady(): boolean;
        setBingId(id: any): void;
        setMode(mode: EBingMode): void;
        setReference(ref: EBingReference): void;
        addConfig(config: BingMapsConfig): void;
        setConfig(configId: number): void;
        setParams(value: any): void;
        showIsolines(show: any): void;
        getIsolines(): any;
        showWeather(mode: any, cone: any): void;
        getWeather(): any;
        setVisible(show: any): void;
        is3D(): boolean;
        updateBinding(): void;
        updateConfig(): void;
        updateReference(): void;
        updatePosAndSize(): void;
        updateVisibility(): void;
        updateIsolines(): void;
        updateWeather(): void;
    }
}

// fs-base-ui/html_ui/JS/SimPlane.js
declare global {
    namespace Simplane {
        function getDesignSpeeds(): DesignSpeeds;
        function getCurrentFlightPhase(): FlightPhase

        function getVerticalSpeed(): number
        function getAltitude(): number
        function getAltitudeAboveGround(): number
        function getHeadingMagnetic(): number

        function getIsGrounded(): boolean

        function getTotalAirTemperature(): number
        function getAmbientTemperature(): number

        function getPressureSelectedMode(_aircraft: Aircraft): string
        function getPressureSelectedUnits(): string
        function getPressureValue(_units?: string): number

        function getAutoPilotDisplayedAltitudeLockValue(_units?: string): number
        function getAutoPilotAirspeedManaged(): boolean
        function getAutoPilotHeadingManaged(): boolean
        function getAutoPilotAltitudeManaged(): boolean

        function getAutoPilotMachModeActive(): number
        function getEngineActive(_engineIndex: number): number
        function getEngineThrottle(_engineIndex: number): number
        function getEngineThrottleMaxThrust(_engineIndex: number): number
        function getEngineThrottleMode(_engineIndex: number): number
        function getEngineCommandedN1(_engineIndex: number): number
        function getFlexTemperature(): number

        //Seems to implement caching behaviour, can be overridden with forceSimVarCall
        function getFlapsHandleIndex(forceSimVarCall?: boolean): number
    }

    class GlassCockpitSettings {
        FuelFlow:                ColorRangeDisplay;
        FuelQuantity:            ColorRangeDisplay2;
        FuelTemperature:         ColorRangeDisplay3;
        FuelPressure:            ColorRangeDisplay3;
        OilPressure:             ColorRangeDisplay3;
        OilTemperature:          ColorRangeDisplay3;
        EGTTemperature:          RangeDisplay;
        Vacuum:                  ColorRangeDisplay;
        ManifoldPressure:        ColorRangeDisplay;
        AirSpeed:                ColorRangeDisplay4;
        Torque:                  ColorRangeDisplay2;
        RPM:                     ColorRangeDisplay2;
        TurbineNg:               ColorRangeDisplay2;
        ITTEngineOff:            ColorRangeDisplay3;
        ITTEngineOn:             ColorRangeDisplay3;
        MainBusVoltage:          ColorRangeDisplay3;
        HotBatteryBusVoltage:    ColorRangeDisplay3;
        BatteryBusAmps:          ColorRangeDisplay2;
        GenAltBusAmps:           ColorRangeDisplay2;
        CoolantLevel:            RangeDisplay;
        CoolantTemperature:      ColorRangeDisplay3;
        GearOilTemperature:      ColorRangeDisplay2;
        CabinAltitude:           ColorRangeDisplay;
        CabinAltitudeChangeRate: RangeDisplay;
        CabinPressureDiff:       ColorRangeDisplay;
        ThrottleLevels:          ThrottleLevelsInfo;
        FlapsLevels:             FlapsLevelsInfo;
    }

    class RangeDisplay {
        __Type: "RangeDisplay" | "ColorRangeDisplay" | "ColorRangeDisplay2" | "ColorRangeDisplay3"
            | "ColorRangeDisplay4" | "FlapsRangeDisplay";
        min:       number;
        max:       number;
        lowLimit:  number;
        highLimit: number;
    }

    class ColorRangeDisplay extends RangeDisplay {
        greenStart: number;
        greenEnd:   number;
    }

    class ColorRangeDisplay2 extends ColorRangeDisplay {
        yellowStart: number;
        yellowEnd:   number;
        redStart:    number;
        redEnd:      number;
    }

    class ColorRangeDisplay3 extends ColorRangeDisplay2 {
        lowRedStart:    number;
        lowRedEnd:      number;
        lowYellowStart: number;
        lowYellowEnd:   number;
    }

    class ColorRangeDisplay4 extends ColorRangeDisplay2 {
        whiteStart: number;
        whiteEnd:   number;
    }

    class FlapsLevelsInfo {
        __Type: "FlapsLevelsInfo";
        slatsAngle: [number, number, number, number];
        flapsAngle: [number, number, number, number];
    }

    class FlapsRangeDisplay extends RangeDisplay {
        takeOffValue: number;
    }

    class ThrottleLevelsInfo {
        __Type: "ThrottleLevelsInfo";
        minValues: [number, number, number, number, number];
        names:     [string, string, string, string, string];
    }

    class FuelLevels {
        fuel_tank_selector: any[];
    }

    class DesignSpeeds {
        VS0: number;
        VS1: number;
        VFe: number;
        VNe: number;
        VNo: number;
        VMin: number;
        VMax: number;
        Vr: number;
        Vx: number;
        Vy: number;
        Vapp: number;
        BestGlide: number;
    }

    enum FlightPhase {
        FLIGHT_PHASE_PREFLIGHT,
        FLIGHT_PHASE_TAXI,
        FLIGHT_PHASE_TAKEOFF,
        FLIGHT_PHASE_CLIMB,
        FLIGHT_PHASE_CRUISE,
        FLIGHT_PHASE_DESCENT,
        FLIGHT_PHASE_APPROACH,
        FLIGHT_PHASE_GOAROUND
    }

    enum AutopilotMode {
        MANAGED,
        SELECTED,
        HOLD
    }

    enum ThrottleMode {
        UNKNOWN,
        REVERSE,
        IDLE,
        AUTO,
        CLIMB,
        FLEX_MCT,
        TOGA,
        HOLD
    }

    enum Aircraft {
        CJ4,
        A320_NEO,
        B747_8,
        AS01B,
        AS02A
    }

    enum NAV_AID_STATE {
        OFF,
        ADF,
        VOR
    }

    enum NAV_AID_MODE {
        NONE,
        MANUAL,
        REMOTE
    }
}

// fs-base-ui/html_ui/JS/simvar.js.
declare global {
    namespace SimVar {
        class SimVarValue {
            constructor(name?: string, unit?: VarUnit, type?: string);
            name?: string;
            unit?: string;
            type?: string;
        }

        class SimVarBatch {
            constructor(simVarCount: string, simVarIndex: string);
            add(name: string, unit: NumberVarUnit | TextVarUnit, type?: SimVarBatchType): void;
            getCount(): string;
            getIndex(): string;
            getNames(): string[];
            getUnits(): (NumberVarUnit | TextVarUnit)[];
            getTypes(): SimVarBatchType[];
        }

        /**
         * Determines if SimVar is ready.
         * @returns Something when ready, null when not ready.
         */
        function IsReady(): any | null;

        /**
         * When the SimVarValueHistory is stored (disabled by default and currently not exposed),
         * logs per SimVar (slowest per number of invocations first):
         * - The amount of invocations.
         * - The average invocation time in milliseconds.
         * - The total invocation time in milliseconds.
         * - The slowest invocation time in milliseconds.
         * - The average invocation time per frame in milliseconds.
         * - The average amount of invocations per frame.
         *
         *  Also logs the total invokes per frame and total time in milliseconds taken per frame.
         */
        function LogSimVarValueHistory(): void;

        /**
         * When the SimVarValueHistory is stored (disabled by default and currently not exposed),
         * logs per SimVar (slowest per frame first):
         * - The amount of invocations.
         * - The average invocation time in milliseconds.
         * - The total invocation time in milliseconds.
         * - The slowest invocation time in milliseconds.
         * - The average invocation time per frame in milliseconds.
         * - The average amount of invocations per frame.
         *
         *  Also logs the total invokes per frame and total time in milliseconds taken per frame.
         */
        function LogSimVarValueHistoryByTimePerFrame(): void;

        function GetSimVarArrayValues(batch: SimVarBatch, callback: (results: any[][]) => void, dataSource?: string): void;

        function GetSimVarValue(name: string, unit: NumberVarUnit, dataSource?: string): number | null;
        function GetSimVarValue(name: string, unit: TextVarUnit, dataSource?: string): string | null;
        function GetSimVarValue(name: string, unit: LatLongAltVarUnit, dataSource?: string): LatLongAlt | null;
        function GetSimVarValue(name: string, unit: LatLongAltPBHVarUnit, dataSource?: string): LatLongAltPBH | null;
        function GetSimVarValue(name: string, unit: PitchBankHeadingVarUnit, dataSource?: string): PitchBankHeading | null;
        function GetSimVarValue(name: string, unit: PID_STRUCTVarUnit, dataSource?: string): PID_STRUCT | null;
        function GetSimVarValue(name: string, unit: XYZVarUnit, dataSource?: string): XYZ | null;

        function SetSimVarValue(name: string, unit: NumberVarUnit, value: number, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: TextVarUnit, value: string, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: LatLongAltVarUnit, value: LatLongAlt, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: LatLongAltPBHVarUnit, value: LatLongAltPBH, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: PitchBankHeadingVarUnit, value: PitchBankHeading, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: PID_STRUCTVarUnit, value: PID_STRUCT, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: XYZVarUnit, value: XYZ, dataSource?: string): Promise<void>;

        function GetGlobalVarValue(name: string, unit: any): any | null;

        function GetGameVarValue(name: string, unit: NumberVarUnit, param1?: number, param2?: number): number | null;
        function GetGameVarValue(name: string, unit: TextVarUnit): string | null;
        function GetGameVarValue(name: string, unit: XYZVarUnit): XYZ | null;
        function GetGameVarValue(name: string, unit: POIListVarUnit): any | null;
        function GetGameVarValue(name: string, unit: FuelLevelsVarUnit): FuelLevels | null;
        function GetGameVarValue(name: string, unit: GlassCockpitSettingsVarUnit): GlassCockpitSettings | null;
        function GetGameVarValue(name: string, unit: string): any | null;

        function SetGameVarValue(name: string, unit: NumberVarUnit, value: number): Promise<void>;
        /**
         * Doesn't do anything.
         */
        function SetGameVarValue(name: string, unit: "string" | XYZVarUnit | POIListVarUnit | FuelLevelsVarUnit | GlassCockpitSettingsVarUnit, value: any): Promise<void>;
    }
}

// fs-base-ui/html_ui/JS/Types.js.
declare global {
    class LatLong {
        constructor(latitude: Latitude, longitude: Longitude);
        constructor(data: { lat: Latitude, long: Longitude });

        __Type: "LatLong";
        lat: Latitude;
        long: Longitude;

        /**
         * @returns A string formatted as "40.471000, 73.580000".
         */
        toStringFloat(): string;

        /**
         * @returns A string formatted as "lat 40.47, long 73.58".
         */
        toString(): string;

        /**
         * @returns A string formatted as "4047.1N".
         */
        latToDegreeString(): string;

        /**
         * @returns A string formatted as "07358.0W".
         */
        longToDegreeString(): string;

        /**
         * @returns A string formatted as "N40°47.1 W073°58.0".
         */
        toDegreeString(): string;

        /**
         * @returns A string formatted as "4047.1N07358.0W".
         */
        toShortDegreeString(): string;

        /**
         * Parses a string into a LatLong or LatLongAlt
         * @param str A string formatted as either "0.0,0.0" or "0.0,0.0,0.0".
         * When the string contains spaces around the numbers, those are ignored.
         * @returns An instance of LatLong or LatLongAlt, depending on the number of values in the string. Null when
         * the string doesn't contain a comma.
         */
        static fromStringFloat(str: string): LatLong | LatLongAlt | null;
    }

    class LatLongAlt {
        constructor(latitude: Latitude, longitude: Longitude, alt: Altitude);
        constructor(data: { lat: Latitude, long: Longitude, alt: Altitude });

        __Type: "LatLongAlt";
        lat: Latitude;
        long: Longitude;
        alt: Altitude;

        /**
         * @returns A LatLong instance containing the latitude and longitude of this instance.
         */
        toLatLong(): LatLong;

        /**
         * @returns A string formatted as "52.370216, 4.895168, 1500.0".
         */
        toStringFloat(): string;

        /**
         * @returns A string formatted as "lat 52.37, long 4.90, alt 1500.00".
         */
        toString(): string;

        /**
         * @returns A string formatted as "5222.2N".
         */
        latToDegreeString(): string;

        /**
         * @returns A string formatted as "00453.7E".
         */
        longToDegreeString(): string;

        /**
         * @returns A string formatted as "N52°22.2 E004°53.7".
         */
        toDegreeString(): string;
    }

    class PitchBankHeading {
        constructor(data: { pitchDegree: number, bankDegree: number, headingDegree: number });

        __Type: "PitchBankHeading";
        pitchDegree: number;
        bankDegree: number;
        headingDegree: number;

        /**
         * @returns A string formatted as "p 2.40, b 10.60, h 240.20".
         */
        toString(): string;
    }

    class LatLongAltPBH {
        constructor(data: { lla: LatLongAlt, pbh: PitchBankHeading });

        __Type: "LatLongAltPBH";
        lla: LatLongAlt;
        pbh: PitchBankHeading;

        /**
         * @returns A string formatted as "lla lat 52.37, long 4.90, alt 1500.00, pbh p 2.40, b 10.60, h 240.20".
         */
        toString(): string;
    }

    class PID_STRUCT {
        constructor(data: { pid_p: number; pid_i: number; pid_i2: number; pid_d: number;
            i_boundary: number; i2_boundary: number; d_boundary: number; });

        // __Type is missing on this type.

        pid_p: number;
        pid_i: number;
        pid_i2: number;
        pid_d: number;
        i_boundary: number;
        i2_boundary: number;
        d_boundary: number;

        /**
         * @returns A string formatted as "pid_p 123.46, pid_i 123.46, pid_i2 123.46, pid_d 123.46, i_boundary 123.46, i2_boundary 123.46, d_boundary 123.46".
         */
        toString(): string;
    }

    class XYZ {
        constructor(data: { x: number; y: number; z: number; });

        x: number;
        y: number;
        z: number;

        /**
         * @returns A string formatted as "x 123.00, y 456.00, z 789.13".
         */
        toString(): string;
    }

    class DataDictionaryEntry {
        constructor(data: { key: any, data: any });

        __Type: "DataDictionaryEntry";

        /**
         * @returns A string formatted as "key: " + key + ", data: " + data
         */
        toString(): string;
    }

    class POIInfo {
        constructor(data: { distance: any, angle: any, isSelected: any });

        __Type: "POIInfo";

        /**
         * @returns A string formatted as "Distance: " + distance + ", angle: " + angle + ", selected: " + isSelected
         */
        toString(): string;
    }

    class KeyActionParams {
        /**
         * Parses the JSON string and sets the properties on the newly created instance.
         */
        constructor(json: string | null);

        bReversed: boolean;
        static sKeyDelimiter: string;
    }

    /**
     * The Simvar class is not to be confused with the SimVar namespace.
     */
    class Simvar {
        __Type: "Simvar";
    }

    class Attribute {
        __Type: "Attribute";
    }
}

declare global {
    interface Document {
        createElement(tagName: "a320-neo-ecam-gauge"): A320_Neo_ECAM_Common.Gauge;
    }
}

export {};
