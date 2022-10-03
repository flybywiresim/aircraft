declare type AnimationDirection = 'normal' | 'reverse' | 'alternate-reverse' | 'alternate';
interface TimelineOptions {
    direction?: AnimationDirection;
    playBackRate?: number;
    initialDelay?: number;
    startWithInitialValues?: boolean;
    iterations?: number;
    startingValues?: {
        [P in keyof CSSStyleDeclaration]?: string;
    };
    startingTransition?: number;
}
interface AnimationOptions extends TimelineOptions {
    elements: HTMLElement | HTMLElement[];
    duration: number;
    keepsFinalState?: boolean;
    animationStart?: number;
    offset?: number;
    properties: AnimationProperties;
}
interface AnimationData extends AnimationOptions {
    delay: number;
}
declare type UIAnimationEventName = 'oncomplete' | 'onstart' | 'oniteration' | 'ontransitionend';
interface UITimelineConfiguration extends TimelineOptions {
    timeline: Array<AnimationOptions>;
}
interface AnimationPropertyData {
    percent: number;
    value: any;
    easing?: string;
}
interface AnimationEventData extends AnimationPropertyData {
    value: Function;
    timeoutID?: number;
}
interface ComponentAnimationData {
    delay?: number;
    play?: boolean;
}
declare type AnimationProperties = {
    [P in keyof CSSStyleDeclaration | 'event']?: AnimationPropertyData[];
};
interface TimelineEventData {
    delay: number;
    timeoutId?: number;
    event: Function;
}
interface AnimationPropertyChange {
    property: AnimationStyleSubProperties;
    value: string;
}
declare type AnimationStyleSubProperties = 'animationName' | 'animationDuration' | 'animationTimingFunction' | 'animationDelay' | 'animationIterationCount' | 'animationDirection' | 'animationFillMode' | 'animationPlayState';
declare let g_timelineCounter: number;
declare let g_KeyframesMgr: any;
declare class UITimeline {
    animations: Array<UIAnimation>;
    id: number;
    rewinding: boolean;
    playing: boolean;
    direction: AnimationDirection;
    private _animationStartCallbacks;
    private _animationEndCallbacks;
    private _animationIterationCallbacks;
    private _started;
    private completedAnimations;
    private completedTransitions;
    private iteratedAnimations;
    private events;
    private currentTime;
    private _transitionTimestamp;
    private lastUpdate;
    private configuration;
    private _transition;
    private _playBackRate;
    private _iterationEvents;
    static selectorToElements(element: HTMLElement | ShadowRoot, selector: string): HTMLElement[];
    static createFromPath(JSONPath: string, element: HTMLElement): Promise<UITimeline>;
    private static timelineOptionsValidator;
    private static animationOptionsValidator;
    private static animationPropertyValidator;
    static checkConfigurationIntegrity(data: any): data is UITimelineConfiguration;
    constructor(opt?: TimelineOptions);
    add(opt: AnimationOptions): this;
    addEvent(eventData: TimelineEventData): void;
    private computeTransitionTime;
    play(): void;
    apply(displayAtPercent?: number): void;
    getCurrentTime(): number;
    setPlaybackRate(rate: number): void;
    private animationIsFromTimeline;
    private checkAnimationComplete;
    private checkTransitionEnd;
    private checkAnimationIteration;
    pause(): void;
    stop(): void;
    rewind(): void;
    getCurrentDirection(): "normal" | "reverse";
    getDuration(): number;
    private calcStartTime;
    addTimelineEventListener(key: 'onstart' | 'oncomplete' | 'oniteration', callback: (events: AnimationEvent[]) => void): void;
    removeTimelineEventListener(key: 'onstart' | 'oncomplete' | 'oniteration', callback: (events: AnimationEvent[]) => void): void;
    removeAllTimelineEventListener(key: 'onstart' | 'oncomplete' | 'oniteration'): void;
    static launchComponentsAnimation<T extends HTMLElement>(elements: T | T[], stateFunction: (opt?: ComponentAnimationData) => UITimeline, opt?: ComponentAnimationData): Function;
    handleAnimationOptions(stateOptions: ComponentAnimationData): void;
}
declare let g_id: number;
declare class UIAnimation {
    data: AnimationData;
    currentTime: number;
    playTimestamp: number;
    animationNames: string[];
    currentDirection: 'normal' | 'reverse';
    private id;
    private name;
    private configuration;
    private elements;
    private events;
    private _playing;
    private _transition;
    private _direction;
    private _delay;
    private _rewinding;
    private _playbackRate;
    private _animationLocked;
    private _storedAnimationDeclaration;
    private _eventCallbacks;
    BUGFIX_TIMEOUT: number;
    constructor(data: AnimationData);
    private onAnimationEnd;
    getCurrentTime(): number;
    getDuration(): number;
    pause(): void;
    setDirection(direction: AnimationDirection): void;
    rewind(callback: () => void): void;
    resume(direction: AnimationDirection): void;
    setPlaybackRate(rate: number): void;
    setTransition(direction: 'in' | 'out' | 'none' | 'done', duration: number): void;
    private startLock;
    private stopLock;
    static animationPropertiesOrder: AnimationStyleSubProperties[];
    restartAnimation(propertyChanges?: AnimationPropertyChange[]): void;
    reset: () => void;
    stop(): void;
    cleanup(): void;
    private setAnimationState;
    private setAnimationProperty;
    play(): void;
    private getAnimationEventName;
    addEventListener(eventName: UIAnimationEventName, callback: (event: AnimationEvent) => any): void;
    private boundEventChecks;
    private addListener;
    private removeListener;
    removeEventListener(eventName: UIAnimationEventName, callback: (event: AnimationEvent) => any): void;
    removeAllEventListeners(eventName: UIAnimationEventName): void;
}
declare type StyleDeclaration = {
    [s in keyof CSSStyleDeclaration]?: string;
};
declare class KeyframesMgr {
    sheet: CSSStyleSheet;
    declaredKeyframes: {
        [property: string]: string;
    };
    counter: number;
    constructor();
    0: any;
    addKeyFrame(name: string, frames: {
        [s: string]: StyleDeclaration;
    }, ctx: HTMLElement): void;
    applyPropertiesAsFrames(properties: AnimationProperties, ctx: HTMLElement): string[];
    static camelCaseToDash(myStr: any): any;
}
