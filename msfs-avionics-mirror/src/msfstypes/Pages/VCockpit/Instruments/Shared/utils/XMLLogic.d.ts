declare class LogicXMLContext {
    functions: Array<LogicXMLFunction>;
    currentParameters: Array<number | string>;
    update(): void;
    addFunction(_func: LogicXMLFunction): void;
    executeFunction(_name: string, _uniqueCall?: boolean): number | string;
}
declare class LogicXMLFunction {
    callback: CompositeLogicXMLElement;
    name: string;
    hasBeenCalled: boolean;
    lastValue: number | string;
    context: any;
    getValue(uniqueCall?: boolean, args?: Array<number | string>): number | string;
}
declare abstract class LogicXMLElement {
    gps: BaseInstrument;
    element: Element;
    constructor(_gps: BaseInstrument, _element: Element);
    abstract getValue(_context?: LogicXMLContext): number | string;
    getValueAsNumber(_context?: LogicXMLContext): number;
    getValueAsString(_context?: LogicXMLContext): string;
    reset(): void;
}
declare class CompositeLogicXMLElement extends LogicXMLElement {
    childrens: Array<LogicXMLElement>;
    constructor(_gps: BaseInstrument, _element: Element);
    protected createChildrens(): void;
    getValue(_context?: LogicXMLContext): number | string;
    reset(): void;
}
declare class AndLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class OrLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class NotLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class MultiplyLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class DivideLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class AddLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): string | number;
}
declare class SubstractLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class MaxLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class MinLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class ClampLogicXMLElement extends CompositeLogicXMLElement {
    private min;
    private max;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
}
declare class LowerLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class LowerEqualLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class GreaterLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class GreaterEqualLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context?: LogicXMLContext): number;
}
declare class EqualLogicXMLElement extends CompositeLogicXMLElement {
    private tolerance;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
}
declare class DifferentLogicXMLElement extends CompositeLogicXMLElement {
    private tolerance;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
}
declare class TimerLogicXMLElement extends CompositeLogicXMLElement {
    private wasTrue;
    private timerBegin;
    private time;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
    reset(): void;
}
declare class SimvarLogicXMLElement extends LogicXMLElement {
    private simvar;
    private unit;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(): string | number;
}
declare class GamevarLogicXMLElement extends LogicXMLElement {
    private gamevar;
    private unit;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(): string | number;
}
declare class ConstantLogicXMLElement extends LogicXMLElement {
    private value;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(): string | number;
}
declare class TimeSinceStartLogicXMLElement extends LogicXMLElement {
    getValue(): number;
}
declare class InstrumentWasOffLogicXMLElement extends LogicXMLElement {
    getValue(): number;
}
declare class LinearMultiPointLogicXMLElement extends LogicXMLElement {
    private referencePoints;
    private minimums;
    private maximums;
    private param1;
    private param2;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
    reset(): void;
}
declare class MultiDimensionsTableInput {
    references: Array<number>;
    param: CompositeLogicXMLElement;
    private _factor;
    get factor(): number;
    private _previousIndex;
    get previousIndex(): number;
    private _nextIndex;
    get nextIndex(): number;
    update(_context?: LogicXMLContext): void;
}
declare class MultiDimensionsTableLogicXMLElement extends LogicXMLElement {
    private inputs;
    private outputTable;
    constructor(_gps: BaseInstrument, _element: Element);
    private constructOutputTable;
    private initializeOutputTable;
    private getTableValue;
    private setTableValue;
    private fillUndefinedValues;
    private interpolate;
    getValue(_context?: LogicXMLContext): number;
}
declare class StateTransitionLogicXML {
    toId: Name_Z;
    conditions: CompositeLogicXMLElement;
}
declare class StateLogicXML {
    id: Name_Z;
    value: number;
    transitions: Array<StateTransitionLogicXML>;
}
declare class StateMachineLogicXMLElement extends LogicXMLElement {
    private currentState;
    private states;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): number;
    makeTransitions(_context?: LogicXMLContext): void;
    reset(): void;
}
declare class ToFixedLogicXMLElement extends CompositeLogicXMLElement {
    private precision;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): string;
}
declare class IfLogicXMLElement extends LogicXMLElement {
    private precision;
    private condition;
    private then;
    private else;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): string | number;
    reset(): void;
}
declare class FunctionXMLElement extends LogicXMLElement {
    private functionName;
    private uniqueCall;
    constructor(_gps: BaseInstrument, _element: Element);
    getValue(_context?: LogicXMLContext): string | number;
}
declare class MaxSinceStartXMLElement extends CompositeLogicXMLElement {
    maxValue: number;
    getValue(_context?: LogicXMLContext): number | string;
}
declare class MinSinceStartXMLElement extends CompositeLogicXMLElement {
    minValue: number;
    getValue(_context?: LogicXMLContext): number | string;
}
declare class DistanceFromOriginXMLElement extends LogicXMLElement {
    originPosition: LatLong;
    getValue(_context?: LogicXMLContext): number | string;
}
declare class DistanceToDestinationXMLElement extends LogicXMLElement {
    destinationPosition: LatLong;
    getValue(_context?: LogicXMLContext): number | string;
}
declare class HeadingChangeFromDepartureXMLElement extends LogicXMLElement {
    headingAtTakeOff: number;
    wasOnGround: boolean;
    maxHeadingChange: number;
    getValue(_context?: LogicXMLContext): number | string;
}
