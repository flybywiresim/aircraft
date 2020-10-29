class LogicXMLContext {
    constructor() {
        this.functions = [];
    }
    update() {
        for (let i = 0; i < this.functions.length; i++) {
            this.functions[i].hasBeenCalled = false;
        }
    }
    addFunction(_func) {
        _func.context = this;
        this.functions.push(_func);
    }
    executeFunction(_name, _uniqueCall = true) {
        for (let i = 0; i < this.functions.length; i++) {
            if (this.functions[i].name == _name) {
                return this.functions[i].getValue(_uniqueCall, this.currentParameters);
            }
        }
    }
}
class LogicXMLFunction {
    constructor() {
        this.hasBeenCalled = false;
    }
    getValue(uniqueCall = true, args = []) {
        if (!uniqueCall || !this.hasBeenCalled) {
            this.context.currentParameters = args;
            this.lastValue = this.callback.getValue(this.context);
            this.hasBeenCalled = true;
        }
        return this.lastValue;
    }
}
class LogicXMLElement {
    constructor(_gps, _element) {
        this.gps = _gps;
        this.element = _element;
    }
    getValueAsNumber(_context) {
        const value = this.getValue(_context);
        if (typeof value == 'number') {
            return value;
        } else {
            return 0;
        }
    }
    getValueAsString(_context) {
        const value = this.getValue(_context);
        if (typeof value == 'number') {
            return value.toString();
        } else {
            return value;
        }
    }
}
class CompositeLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.createChildrens();
    }
    createChildrens() {
        this.childrens = [];
        if (this.element) {
            if (this.element.children.length == 0) {
                this.childrens.push(new ConstantLogicXMLElement(this.gps, this.element));
            }
            for (let i = 0; i < this.element.children.length; i++) {
                switch (this.element.children[i].nodeName) {
                    case "And":
                        this.childrens.push(new AndLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Or":
                        this.childrens.push(new OrLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Not":
                        this.childrens.push(new NotLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Multiply":
                        this.childrens.push(new MultiplyLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Divide":
                        this.childrens.push(new DivideLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Add":
                        this.childrens.push(new AddLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Substract":
                        this.childrens.push(new SubstractLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Min":
                        this.childrens.push(new MinLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Max":
                        this.childrens.push(new MaxLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Lower":
                        this.childrens.push(new LowerLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "LowerEqual":
                        this.childrens.push(new LowerEqualLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Greater":
                        this.childrens.push(new GreaterLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "GreaterEqual":
                        this.childrens.push(new GreaterEqualLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Equal":
                        this.childrens.push(new EqualLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Inequal":
                        this.childrens.push(new DifferentLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Timer":
                        this.childrens.push(new TimerLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Simvar":
                        this.childrens.push(new SimvarLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Gamevar":
                        this.childrens.push(new GamevarLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Constant":
                        this.childrens.push(new ConstantLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "LinearMultiPoint":
                        this.childrens.push(new LinearMultiPointLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "TimeSinceStart":
                        this.childrens.push(new TimeSinceStartLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "StateMachine":
                        this.childrens.push(new StateMachineLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "ToFixed":
                        this.childrens.push(new ToFixedLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "If":
                        this.childrens.push(new IfLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "Function":
                        this.childrens.push(new FunctionXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "InstrumentWasOff":
                        this.childrens.push(new InstrumentWasOffLogicXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "MaxSinceStart":
                        this.childrens.push(new MaxSinceStartXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "MinSinceStart":
                        this.childrens.push(new MinSinceStartXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "DistanceFromOrigin":
                        this.childrens.push(new DistanceFromOriginXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "DistanceToDestination":
                        this.childrens.push(new DistanceToDestinationXMLElement(this.gps, this.element.children[i]));
                        break;
                    case "HeadingChangeFromDeparture":
                        this.childrens.push(new HeadingChangeFromDepartureXMLElement(this.gps, this.element.children[i]));
                        break;
                }
            }
        }
    }
    getValue(_context) {
        if (this.childrens.length >= 1) {
            return this.childrens[0].getValue(_context);
        }
        return 0;
    }
}
class AndLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        for (let i = 0; i < this.childrens.length; i++) {
            if (this.childrens[i].getValue(_context) == 0) {
                return 0;
            }
        }
        return 1;
    }
}
class OrLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        for (let i = 0; i < this.childrens.length; i++) {
            if (this.childrens[i].getValue(_context) != 0) {
                return 1;
            }
        }
        return 0;
    }
}
class NotLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 1) {
            if (this.childrens[0].getValue(_context) == 0) {
                return 1;
            } else {
                return 0;
            }
        }
        return undefined;
    }
}
class MultiplyLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length > 0) {
            let result = 1;
            for (let i = 0; i < this.childrens.length; i++) {
                const childValue = this.childrens[i].getValue(_context);
                if (typeof childValue == 'number') {
                    result *= childValue;
                }
            }
            return result;
        } else {
            return undefined;
        }
    }
}
class DivideLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            const c1 = this.childrens[0].getValue(_context);
            const c2 = this.childrens[1].getValue(_context);
            if (typeof c1 == 'number' && typeof c2 == 'number') {
                return c1 / c2;
            }
        }
        return undefined;
    }
}
class AddLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length > 0) {
            let result = 0;
            let stringResult = "";
            let isString = false;
            for (let i = 0; i < this.childrens.length; i++) {
                const childValue = this.childrens[i].getValue(_context);
                if (typeof childValue == 'number') {
                    if (isString) {
                        stringResult += childValue.toString();
                    } else {
                        result += childValue;
                    }
                } else {
                    if (isString) {
                        stringResult += childValue;
                    } else {
                        if (i == 0) {
                            stringResult = childValue;
                        } else {
                            stringResult = result.toString() + childValue;
                        }
                    }
                    isString = true;
                }
            }
            return isString ? stringResult : result;
        } else {
            return undefined;
        }
    }
}
class SubstractLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            const c1 = this.childrens[0].getValue(_context);
            const c2 = this.childrens[1].getValue(_context);
            if (typeof c1 == 'number' && typeof c2 == 'number') {
                return c1 - c2;
            }
        }
        return undefined;
    }
}
class MaxLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        let max = this.childrens.length > 0 ? this.childrens[0].getValueAsNumber(_context) : undefined;
        for (let i = 1; i < this.childrens.length; i++) {
            const val = this.childrens[i].getValueAsNumber(_context);
            if (val > max) {
                max = val;
            }
        }
        return max;
    }
}
class MinLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        let min = this.childrens.length > 0 ? this.childrens[0].getValueAsNumber(_context) : undefined;
        for (let i = 1; i < this.childrens.length; i++) {
            const val = this.childrens[i].getValueAsNumber(_context);
            if (val < min) {
                min = val;
            }
        }
        return min;
    }
}
class LowerLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            return (this.childrens[0].getValue(_context) < this.childrens[1].getValue(_context) ? 1 : 0);
        }
        return undefined;
    }
}
class LowerEqualLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            return (this.childrens[0].getValue(_context) <= this.childrens[1].getValue(_context) ? 1 : 0);
        }
        return undefined;
    }
}
class GreaterLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            return (this.childrens[0].getValue(_context) > this.childrens[1].getValue(_context) ? 1 : 0);
        }
        return undefined;
    }
}
class GreaterEqualLogicXMLElement extends CompositeLogicXMLElement {
    getValue(_context) {
        if (this.childrens.length == 2) {
            return (this.childrens[0].getValue(_context) >= this.childrens[1].getValue(_context) ? 1 : 0);
        }
        return undefined;
    }
}
class EqualLogicXMLElement extends CompositeLogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.tolerance = 0;
        const tolerance = _element.getAttribute("tolerance");
        if (tolerance) {
            this.tolerance = parseFloat(tolerance);
        }
    }
    getValue(_context) {
        for (let i = 0; i < this.childrens.length + 1; i++) {
            for (let j = i + 1; j < this.childrens.length; j++) {
                const c1 = this.childrens[i].getValue(_context);
                const c2 = this.childrens[j].getValue(_context);
                if (typeof c1 == 'number' && typeof c2 == 'number') {
                    if (Math.abs(c1 - c2) > this.tolerance) {
                        return 0;
                    }
                } else {
                    if (c1 != c2) {
                        return 0;
                    }
                }
            }
        }
        return 1;
    }
}
class DifferentLogicXMLElement extends CompositeLogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.tolerance = 0;
        const tolerance = _element.getAttribute("tolerance");
        if (tolerance) {
            this.tolerance = parseFloat(tolerance);
        }
    }
    getValue(_context) {
        for (let i = 0; i < this.childrens.length + 1; i++) {
            for (let j = i + 1; j < this.childrens.length; j++) {
                const c1 = this.childrens[i].getValue(_context);
                const c2 = this.childrens[j].getValue(_context);
                if (typeof c1 == 'number' && typeof c2 == 'number') {
                    if (Math.abs(c1 - c2) > this.tolerance) {
                        return 1;
                    }
                } else {
                    if (c1 != c2) {
                        return 1;
                    }
                }
            }
        }
        return 0;
    }
}
class TimerLogicXMLElement extends CompositeLogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.wasTrue = false;
        this.timerBegin = 0;
        this.time = 1000 * parseFloat(_element.getAttribute("time"));
    }
    getValue(_context) {
        if (this.childrens.length == 1) {
            if (this.childrens[0].getValue(_context) != 0) {
                if (!this.wasTrue) {
                    this.wasTrue = true;
                    this.timerBegin = Date.now();
                }
            } else {
                this.wasTrue = false;
            }
            return (this.wasTrue && Date.now() - this.timerBegin >= this.time ? 1 : 0);
        }
        return undefined;
    }
}
class SimvarLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.simvar = _element.getAttribute("name");
        this.unit = _element.getAttribute("unit");
    }
    getValue() {
        return SimVar.GetSimVarValue(this.simvar, this.unit);
    }
}
class GamevarLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.gamevar = _element.getAttribute("name");
        this.unit = _element.getAttribute("unit");
    }
    getValue() {
        return SimVar.GetGameVarValue(this.gamevar, this.unit);
    }
}
class ConstantLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        const floatValue = parseFloat(_element.textContent);
        if (!isNaN(floatValue)) {
            this.value = floatValue;
        } else {
            this.value = _element.textContent;
        }
    }
    getValue() {
        return this.value;
    }
}
class TimeSinceStartLogicXMLElement extends LogicXMLElement {
    getValue() {
        return this.gps.getTimeSinceStart();
    }
}
class InstrumentWasOffLogicXMLElement extends LogicXMLElement {
    getValue() {
        return (this.gps.wasTurnedOff()) ? 1 : 0;
    }
}
class LinearMultiPointLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        const referencePoints = _element.getElementsByTagName("ReferencePoints");
        if (referencePoints.length > 0) {
            const points = referencePoints[0].textContent.split(",");
            this.referencePoints = [];
            for (let i = 0; i < points.length; i++) {
                this.referencePoints.push(parseFloat(points[i]));
            }
        }
        const minimums = _element.getElementsByTagName("Minimums");
        if (minimums.length > 0) {
            const points = minimums[0].textContent.split(",");
            this.minimums = [];
            for (let i = 0; i < points.length; i++) {
                this.minimums.push(parseFloat(points[i]));
            }
        }
        const maximums = _element.getElementsByTagName("Maximums");
        if (maximums.length > 0) {
            const points = maximums[0].textContent.split(",");
            this.maximums = [];
            for (let i = 0; i < points.length; i++) {
                this.maximums.push(parseFloat(points[i]));
            }
        }
        const params = _element.getElementsByTagName("Param");
        if (params.length > 1) {
            this.param1 = new CompositeLogicXMLElement(this.gps, params[0]);
            this.param2 = new CompositeLogicXMLElement(this.gps, params[1]);
        }
    }
    getValue() {
        let lastLowerIndex = -1;
        const valueX = this.param1.getValue();
        const valueY = this.param2.getValue();
        if (typeof valueX == 'number' && typeof valueY == 'number') {
            for (let i = 0; i < this.referencePoints.length; i++) {
                if (valueX > this.referencePoints[i]) {
                    lastLowerIndex = i;
                } else {
                    break;
                }
            }
            if (lastLowerIndex == this.referencePoints.length - 1) {
                if (this.minimums && valueY < this.minimums[lastLowerIndex]) {
                    return 0;
                }
                if (this.maximums && valueY > this.maximums[lastLowerIndex]) {
                    return 0;
                }
            } else if (lastLowerIndex == -1) {
                if (this.minimums && valueY < this.minimums[0]) {
                    return 0;
                }
                if (this.maximums && valueY > this.maximums[0]) {
                    return 0;
                }
            } else {
                const factorLower = 1 - ((valueX - this.referencePoints[lastLowerIndex]) / this.referencePoints[lastLowerIndex + 1] - this.referencePoints[lastLowerIndex]);
                if (this.minimums && valueY < (this.minimums[lastLowerIndex] * factorLower + this.minimums[lastLowerIndex + 1] * (1 - factorLower))) {
                    return 0;
                }
                if (this.maximums && valueY > (this.maximums[lastLowerIndex] * factorLower + this.maximums[lastLowerIndex + 1] * (1 - factorLower))) {
                    return 0;
                }
            }
            return 1;
        }
        return undefined;
    }
}
class StateTransitionLogicXML {
}
class StateLogicXML {
}
class StateMachineLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        const stateElements = _element.getElementsByTagName("State");
        this.states = [];
        for (let i = 0; i < stateElements.length; i++) {
            const state = new StateLogicXML();
            state.id = new Name_Z(stateElements[i].getAttribute("id"));
            state.value = parseFloat(stateElements[i].getAttribute("value"));
            const transitionElements = stateElements[i].getElementsByTagName("Transition");
            state.transitions = [];
            for (let i = 0; i < transitionElements.length; i++) {
                const transition = new StateTransitionLogicXML();
                transition.toId = new Name_Z(transitionElements[i].getAttribute("to"));
                transition.conditions = new CompositeLogicXMLElement(_gps, transitionElements[i]);
                state.transitions.push(transition);
            }
            this.states.push(state);
        }
        this.currentState = this.states[0];
    }
    getValue() {
        this.makeTransitions();
        return this.currentState.value;
    }
    makeTransitions() {
        for (let i = 0; i < this.currentState.transitions.length; i++) {
            if (this.currentState.transitions[i].conditions.getValue() != 0) {
                for (let j = 0; j < this.states.length; j++) {
                    if (Name_Z.compare(this.currentState.transitions[i].toId, this.states[j].id)) {
                        this.currentState = this.states[j];
                        return;
                    }
                }
            }
        }
    }
}
class ToFixedLogicXMLElement extends CompositeLogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.precision = parseInt(_element.getAttribute("precision"));
    }
    getValue(_context) {
        if (this.childrens.length > 0) {
            const childValue = this.childrens[0].getValue(_context);
            if (typeof childValue == 'number') {
                return childValue.toFixed(this.precision);
            } else {
                return childValue;
            }
        }
    }
}
class IfLogicXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.precision = parseInt(_element.getAttribute("precision"));
        for (let i = 0; i < this.element.children.length; i++) {
            switch (this.element.children[i].tagName) {
                case "Condition":
                    this.condition = new CompositeLogicXMLElement(this.gps, this.element.children[i]);
                    break;
                case "Then":
                    this.then = new CompositeLogicXMLElement(this.gps, this.element.children[i]);
                    break;
                case "Else":
                    this.else = new CompositeLogicXMLElement(this.gps, this.element.children[i]);
                    break;
            }
        }
    }
    getValue() {
        if (this.condition.getValue() != 0) {
            if (this.then) {
                return this.then.getValue();
            } else {
                return 0;
            }
        } else {
            if (this.else) {
                return this.else.getValue();
            } else {
                return 0;
            }
        }
    }
}
class FunctionXMLElement extends LogicXMLElement {
    constructor(_gps, _element) {
        super(_gps, _element);
        this.functionName = _element.getAttribute("Name");
        this.uniqueCall = _element.getAttribute("ForceReevaluation") != "True";
    }
    getValue(_context) {
        if (!_context) {
            return 0;
        } else {
            return _context.executeFunction(this.functionName, this.uniqueCall);
        }
    }
}
class MaxSinceStartXMLElement extends CompositeLogicXMLElement {
    constructor() {
        super(...arguments);
        this.maxValue = undefined;
    }
    getValue(_context) {
        const value = this.childrens[0].getValueAsNumber(_context);
        if (this.maxValue == undefined || value > this.maxValue) {
            this.maxValue = value;
        }
        return this.maxValue;
    }
}
class MinSinceStartXMLElement extends CompositeLogicXMLElement {
    constructor() {
        super(...arguments);
        this.minValue = undefined;
    }
    getValue(_context) {
        const value = this.childrens[0].getValueAsNumber(_context);
        if (this.minValue == undefined || value < this.minValue) {
            this.minValue = value;
        }
        return this.minValue;
    }
}
class DistanceFromOriginXMLElement extends LogicXMLElement {
    constructor() {
        super(...arguments);
        this.originPosition = null;
    }
    getValue(_context) {
        let origin = null;
        if (this.gps.flightPlanManager) {
            origin = this.gps.flightPlanManager.getOrigin();
        }
        const position = new LatLong();
        position.lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
        position.long = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "boolean");
        if (this.originPosition == null && !origin && onGround) {
            this.originPosition = position;
        }
        if (origin) {
            if (!this.originPosition) {
                this.originPosition = new LatLong(origin.infos.lat, origin.infos.long);
            } else {
                this.originPosition.lat = origin.infos.lat;
                this.originPosition.long = origin.infos.long;
            }
        }
        if (this.originPosition != null) {
            return Avionics.Utils.computeGreatCircleDistance(this.originPosition, position);
        } else {
            return Infinity;
        }
    }
}
class DistanceToDestinationXMLElement extends LogicXMLElement {
    constructor() {
        super(...arguments);
        this.destinationPosition = null;
    }
    getValue(_context) {
        let destination = null;
        if (this.gps.flightPlanManager) {
            destination = this.gps.flightPlanManager.getDestination();
        }
        const position = new LatLong();
        this.destinationPosition.lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
        this.destinationPosition.long = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
        if (this.destinationPosition == null && !destination) {
            this.destinationPosition = position;
        }
        if (destination) {
            if (!this.destinationPosition) {
                this.destinationPosition = new LatLong(destination.infos.lat, destination.infos.long);
            } else {
                this.destinationPosition.lat = destination.infos.lat;
                this.destinationPosition.long = destination.infos.long;
            }
        }
        return Avionics.Utils.computeGreatCircleDistance(this.destinationPosition, position);
    }
}
class HeadingChangeFromDepartureXMLElement extends LogicXMLElement {
    constructor() {
        super(...arguments);
        this.headingAtTakeOff = undefined;
        this.wasOnGround = true;
        this.maxHeadingChange = 0;
    }
    getValue(_context) {
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "boolean");
        if (this.wasOnGround && !onGround) {
            this.headingAtTakeOff = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees");
        } else if (onGround) {
            this.headingAtTakeOff = undefined;
            this.maxHeadingChange = 0;
        }
        this.wasOnGround = onGround;
        this.maxHeadingChange = Math.max(this.maxHeadingChange, this.headingAtTakeOff == undefined ? 0 : Math.abs(this.headingAtTakeOff - SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees")));
        return this.maxHeadingChange;
    }
}
//# sourceMappingURL=XMLLogic.js.map