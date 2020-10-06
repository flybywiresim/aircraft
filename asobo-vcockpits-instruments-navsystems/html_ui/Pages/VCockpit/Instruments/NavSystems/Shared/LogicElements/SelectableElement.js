class SelectableElement {
    constructor(_gps, _element, _callBack) {
        this.isActive = true;
        this.gps = _gps;
        this.element = _element;
        this.callBack = _callBack;
    }
    SendEvent(_event = null, _index = -1) {
        if (_index == -1) {
            return this.callBack(_event);
        } else {
            return this.callBack(_event, _index);
        }
    }
    GetElement() {
        return this.element;
    }
    GetLineElement() {
        return this.element;
    }
    updateSelection(_selected) {
        if (!this.isActive) {
            this.element.setAttribute("state", "Greyed");
        } else if (_selected) {
            this.element.setAttribute("state", "Selected");
        } else {
            this.element.setAttribute("state", "Unselected");
        }
    }
    onSelection(_event) {
        return this.isActive;
    }
    setActive(_active) {
        this.isActive = _active;
        if (_active) {
            this.element.setAttribute("state", "Unselected");
        } else {
            if (this.gps.currentSelectableArray && this.gps.currentSelectableArray[this.gps.cursorIndex] == this) {
                const begin = this.gps.cursorIndex;
                this.gps.cursorIndex = (this.gps.cursorIndex + 1) % this.gps.currentSelectableArray.length;
                while (!this.gps.currentSelectableArray[this.gps.cursorIndex].isActive) {
                    this.gps.cursorIndex = (this.gps.cursorIndex + 1) % this.gps.currentSelectableArray.length;
                    if (this.gps.cursorIndex == begin) {
                        this.gps.SwitchToInteractionState(0);
                        return;
                    }
                }
            }
            this.element.setAttribute("state", "Greyed");
        }
    }
}
class DynamicSelectableElement extends SelectableElement {
    constructor(_gps, _elementName, _callback) {
        super(_gps, null, _callback);
        this.elementName = _elementName;
    }
    GetElement() {
        return this.gps.getChildById(this.elementName);
    }
    updateSelection(_selected) {
        if (_selected) {
            this.GetElement().setAttribute("state", "Selected");
        } else {
            this.GetElement().setAttribute("state", "Unselected");
        }
    }
}
class SelectableElementGroup extends SelectableElement {
    constructor(_gps, _element, _callbacks) {
        super(_gps, _element, null);
        this.callBack = this.onEvent.bind(this);
        this.callbacks = _callbacks;
        this.index = 0;
    }
    onEvent(_event, _index = -1) {
        let result;
        if (this.callbacks[this.index]) {
            if (_index == -1) {
                result = this.callbacks[this.index](_event);
            } else {
                result = this.callbacks[this.index](_event, _index);
            }
        }
        if (!result) {
            switch (_event) {
                case "NavigationLargeInc":
                    if (this.index < this.callbacks.length - 1) {
                        this.index++;
                        result = this.skipInexistantElements(true);
                    } else {
                        result = false;
                    }
                    break;
                case "NavigationLargeDec":
                    if (this.index > 0) {
                        this.index--;
                        result = this.skipInexistantElements(false);
                    } else {
                        result = false;
                    }
                    break;
            }
        }
        return result;
    }
    onSelection(_event) {
        if (_event == "NavigationLargeInc") {
            this.index = 0;
            return this.skipInexistantElements(true);
        } else if (_event == "NavigationLargeDec") {
            this.index = this.callbacks.length - 1;
            return this.skipInexistantElements(false);
        }
        return true;
    }
    skipInexistantElements(_up = true) {
        let elem;
        do {
            elem = this.element.getElementsByClassName("Select" + this.index)[0];
            if (!elem) {
                this.index += (_up ? 1 : -1);
            }
        } while (!elem && this.index >= 0 && this.index < this.callbacks.length);
        if (this.index == this.callbacks.length || this.index < 0) {
            return false;
        }
        return true;
    }
    updateSelection(_selected) {
        for (let i = 0; i < this.callbacks.length; i++) {
            const element = this.element.getElementsByClassName("Select" + i)[0];
            if (element) {
                if (_selected && i == this.index) {
                    element.setAttribute("state", "Selected");
                } else {
                    element.setAttribute("state", "Unselected");
                }
            }
            if (i == this.index && !element) {
                if (!this.skipInexistantElements(true)) {
                    this.skipInexistantElements(false);
                }
            }
        }
    }
    GetElement() {
        return this.element.getElementsByClassName("Select" + this.index)[0];
    }
}
class SelectableElementSliderGroup extends SelectableElement {
    constructor(_gps, _elements, _slider, _cursor, _step = 1, _emptyLine = "") {
        super(_gps, null, null);
        this.stringElements = [];
        this.isDisplayLocked = false;
        this.callBack = this.onEvent.bind(this);
        this.elements = _elements;
        this.slider = _slider;
        this.sliderCursor = _cursor;
        this.index = 0;
        this.offset = 0;
        this.step = _step;
        this.emptyLine = _emptyLine;
    }
    onEvent(_event) {
        let result;
        if (this.stringElements.length > 0) {
            result = this.elements[this.index].SendEvent(_event, this.offset + this.index);
            if (!result) {
                switch (_event) {
                    case "NavigationLargeInc":
                        do {
                            if (this.index == this.elements.length - 1) {
                                if ((this.index + this.offset) < this.stringElements.length - 1) {
                                    this.offset += this.step;
                                    this.index -= (this.step - 1);
                                    result = true;
                                } else {
                                    result = false;
                                }
                            } else {
                                if (this.index < Math.min(this.elements.length, this.stringElements.length) - 1) {
                                    this.index++;
                                    result = true;
                                }
                            }
                        } while (result && !this.elements[this.index].onSelection(_event));
                        break;
                    case "NavigationLargeDec":
                        do {
                            if (this.index == 0) {
                                if (this.offset > 0) {
                                    this.offset -= this.step;
                                    this.index += (this.step - 1);
                                    result = true;
                                } else {
                                    result = false;
                                }
                            } else {
                                this.index--;
                                result = true;
                            }
                        } while (result && !this.elements[this.index].onSelection(_event));
                        break;
                }
            }
        }
        this.updateDisplay();
        return result;
    }
    GetElement() {
        return this.elements[this.index].GetElement();
    }
    GetLineElement() {
        return this.elements[this.index].GetLineElement();
    }
    getIndex() {
        return this.offset + this.index;
    }
    getOffset() {
        return this.offset;
    }
    updateSelection(_selected) {
        for (let i = 0; i < this.elements.length; i++) {
            if (_selected && i == this.index) {
                this.elements[i].updateSelection(true);
            } else {
                this.elements[i].updateSelection(false);
            }
        }
    }
    getStringElements() {
        return this.stringElements;
    }
    setStringElements(_sElements) {
        this.stringElements = _sElements;
        if (this.index < 0) {
            this.index = 0;
        }
        if (this.offset + this.index >= this.stringElements.length) {
            this.offset = Math.max(0, this.stringElements.length - this.elements.length);
            this.index = Math.min(this.stringElements.length, this.elements.length) - 1;
        }
        this.updateDisplay();
    }
    incrementIndex(_up = true) {
        let result;
        if (_up) {
            do {
                if (this.index == this.elements.length - 1) {
                    if ((this.index + this.offset) < this.stringElements.length - 1) {
                        this.offset += this.step;
                        this.index -= (this.step - 1);
                        result = true;
                    } else {
                        result = false;
                    }
                } else {
                    if (this.index < Math.min(this.elements.length, this.stringElements.length) - 1) {
                        this.index++;
                        result = true;
                    }
                }
            } while (result && !this.elements[this.index].onSelection("NavigationLargeInc"));
        } else {
            do {
                if (this.index == 0) {
                    if (this.offset > 0) {
                        this.offset -= this.step;
                        this.index += (this.step - 1);
                        result = true;
                    } else {
                        result = false;
                    }
                } else {
                    this.index--;
                    result = true;
                }
            } while (result && !this.elements[this.index].onSelection("NavigationLargeDec"));
        }
    }
    onSelection(_event) {
        if (this.stringElements.length == 0) {
            return false;
        }
        if (_event == "NavigationLargeInc") {
            this.offset = 0;
            this.index = 0;
        } else if (_event == "NavigationLargeDec") {
            this.offset = Math.max(0, this.stringElements.length - this.elements.length);
            this.index = Math.min(this.stringElements.length, this.elements.length) - 1;
        }
        this.updateDisplay();
        if (!this.elements[this.index].onSelection(_event)) {
            this.onEvent(_event);
        }
        return true;
    }
    updateDisplay() {
        if (this.isDisplayLocked) {
            return;
        }
        const nbElements = this.stringElements.length;
        const maxDisplayedElements = this.elements.length;
        if (nbElements > maxDisplayedElements) {
            this.slider.setAttribute("state", "Active");
            this.sliderCursor.setAttribute("style", "height:" + (maxDisplayedElements * 100 / nbElements) +
                "%;top:" + (this.offset * 100 / nbElements) + "%");
        } else {
            this.slider.setAttribute("state", "Inactive");
        }
        for (let i = 0; i < Math.min(this.elements.length, this.stringElements.length); i++) {
            this.elements[i].GetLineElement().innerHTML = this.stringElements[this.offset + i];
        }
        for (let i = this.stringElements.length; i < this.elements.length; i++) {
            this.elements[i].GetLineElement().innerHTML = this.emptyLine;
        }
    }
    addElement(_elem) {
        this.elements.push(_elem);
    }
    lockDisplay() {
        this.isDisplayLocked = true;
    }
    unlockDisplay() {
        this.isDisplayLocked = false;
        this.updateDisplay();
    }
}
//# sourceMappingURL=SelectableElement.js.map