/// <reference path="../../../types.d.ts" />
/// <reference path="./Types.d.ts" />

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
            static computeDistance(x: LatLongData, y: LatLongData): NauticalMiles;

            /**
             * Computes the great circle heading between two locations.
             */
            static computeGreatCircleHeading(from: LatLongData, to: LatLongData): Heading;

            /**
             * Computes the great circle distance in nautical miles between two locations.
             */
            static computeGreatCircleDistance(x: LatLongData, y: LatLongData): NauticalMiles;

            static lerpAngle(from: number, to: number, d: number): number;

            static meanAngle(a: number, b: number): number;

            static diffAngle(a: number, b: number): number;

            static clampAngle(a: number): number;

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
            constructor(nbItems: number, increment: number, canBeNegative?: boolean,
                        moduloValue?: number, notched?: number);

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
            constructor(spacing: number, notched?: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value?: string): void;
            update(value: number, divider?: number, hideIfLower?: number): void;
        }

        class AltitudeScroller extends Scroller {
            constructor(nbItems: number, spacing: number, increment: number, moduloValue: number, notched: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value?: string): void;
            update(value: number, divider?: number, hideIfLower?: number): void;
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

            arc?: SVGPathElement;
            arcRadius?: number;
            arcSize?: number;
            arcColor?: string;

            init(arcName: string, radius: number, size: number, color: string): void;
            setPercent(percent: number): void;
            translate(x: number, y: number): void;
            rotate(angle: number): void;
            get svg(): SVGPathElement | undefined;
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
            key?: any;
            value?: any;
        }

        class Dictionary {
            items: DictionaryItem[];
            changed: boolean;

            set(key: any, value: any): void;
            get(key: any): any | undefined;
            remove(key: any): void;
            exists(key: any): boolean;
        }
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
        registerInstrument(_instrumentName: string, _instrumentClass: CustomElementConstructor): void;
    }
    declare function registerInstrument(_instrumentName: string, _instrumentClass: CustomElementConstructor): void;

    declare enum GameState {
        "mainmenu" = 0,
        "loading" = 1,
        "briefing" = 2,
        "ingame" = 3
    }

}


export {};
