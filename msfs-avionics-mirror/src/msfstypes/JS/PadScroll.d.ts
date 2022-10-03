declare var padScrollManager: PadScrollManager;
declare function getGlobalPadScrollManager(): PadScrollManager;
declare enum PADSCROLL_AXIS {
    horizontal = "horizontal",
    vertical = "vertical"
}
declare enum PADSCROLL_CARDINALS {
    up = "up",
    down = "down",
    left = "left",
    right = "right"
}
declare enum PADSCROLL_SIGN {
    negative = -1,
    positive = 1
}
declare type PadScrollAxisDataType = {
    label: string;
    context: string;
    action: string;
    cardinals: {
        [sign in PADSCROLL_SIGN]: PADSCROLL_CARDINALS;
    };
};
declare const PADSCROLL_AXIS_DATA: {
    [axis in PADSCROLL_AXIS]: PadScrollAxisDataType;
};
declare type PadScrollCardinalsDataType = {
    label: string;
    axis: PADSCROLL_AXIS;
    sign: PADSCROLL_SIGN;
    factor: number;
};
declare const PADSCROLL_CARDINALS_DATA: {
    [cardinal in PADSCROLL_CARDINALS]: PadScrollCardinalsDataType;
};
declare const PADSCROLL_MASKS: {
    [direction in 'no' | PADSCROLL_CARDINALS | PADSCROLL_AXIS | 'all']: number;
};
declare type PadScrollCardinalNumber = {
    [cardinal in PADSCROLL_CARDINALS]: number;
};
declare type PadScrollCardinalBool = {
    [cardinal in PADSCROLL_CARDINALS]: boolean;
};
declare type PadScrollAnalog = PadScrollCardinalNumber;
declare type PadScrollDigital = PadScrollCardinalBool;
declare type PadScrollTarget<baseType> = (baseType & {
    onAnalogPadScroll?: (PadScrollAnalog: any) => void;
    onAnalogPadScrollUp?: (number: any) => void;
    onAnalogPadScrollDown?: (number: any) => void;
    onAnalogPadScrollLeft?: (number: any) => void;
    onAnalogPadScrollRight?: (number: any) => void;
    onDigitalPadScroll?: (PadScrollDigital: any) => void;
    onDigitalPadScrollUp?: Function;
    onDigitalPadScrollDown?: Function;
    onDigitalPadScrollLeft?: Function;
    onDigitalPadScrollRight?: Function;
    onPadScrollRelease?: Function;
    onPadScrollReleaseUp?: Function;
    onPadScrollReleaseDown?: Function;
    onPadScrollReleaseLeft?: Function;
    onPadScrollReleaseRight?: Function;
});
declare class PadScrollManager {
    private m_scrollTargetList;
    private m_currentDirectionMask;
    private m_rawValues;
    private m_analogValues;
    private m_digitalValues;
    private m_fetchingLoopID;
    private m_lastFrameTimestamp;
    static SCROLL_FRAMERATE_MS: number;
    static SCROLL_DIAGONAL_THINNESS: number;
    static SCROLL_DEADZONE: number;
    static SCROLL_DIGITAL_BREAKPOINT: number;
    static SCROLL_DIGITAL_HYSTERESIS: number;
    private m_isLockedInThreshold;
    private m_isScrolling;
    private m_wasScrolling;
    static SCROLL_ACCELERATION_BREAKPOINT: number;
    static SCROLL_ACCELERATION_HYSTERESIS: number;
    static SCROLL_ACCELERATION_MULTIPLIER: number;
    private m_currentAccelerations;
    constructor();
    private onActiveElementChanged;
    private onPadCursorHoverElementChanged;
    private onElementChanged;
    private UIElementToScrollTargetList;
    private fetchAnalogValues;
    private computeAcceleration;
    private computeDigitalValues;
    private notifyValuesToTargets;
    private startValuesFetchingLoop;
    private stopValuesFetchingLoop;
    isCurrentTargetList(otherElementList: PadScrollManager['m_scrollTargetList']): boolean;
    isElementInTargetList(element: UIElement, searchList: PadScrollManager['m_scrollTargetList']): boolean;
    set scrollTargetList(elementList: PadScrollManager['m_scrollTargetList']);
    private updateDatas;
    private updateCurrentDirectionMask;
    private attachTargetListeners;
    private detachTargetListeners;
    private UIElementToMask;
    private get currentDirectionMask();
    get hasTarget(): boolean;
    private canTargetScroll;
    get canScroll(): boolean;
    private debugLog;
}
declare function installPadscrollPassthrough(from: PadScrollTarget<HTMLElement>, to: PadScrollTarget<HTMLElement>): void;
