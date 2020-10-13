class ContextualMenu {
    constructor(_title, _elements) {
        this.title = _title;
        this.elements = _elements;
    }
    Update(_gps, _maxElems = 6) {
        _gps.contextualMenuTitle.innerHTML = this.title;
        let elementsHTML = "";
        _gps.UpdateSlider(_gps.menuSlider, _gps.menuSliderCursor, _gps.contextualMenuDisplayBeginIndex, _gps.currentContextualMenu.elements.length, _maxElems);
        for (let i = _gps.contextualMenuDisplayBeginIndex; i < Math.min(this.elements.length, _gps.contextualMenuDisplayBeginIndex + _maxElems); i++) {
            if (this.elements[i].isInactive()) {
                elementsHTML += '<div class="ContextualMenuElement" state="Inactive">' + this.elements[i].name + '</div>';
            } else {
                if (i == _gps.cursorIndex) {
                    elementsHTML += '<div class="ContextualMenuElement" state="Selected">' + this.elements[i].name + '</div>';
                } else {
                    elementsHTML += '<div class="ContextualMenuElement" state="Unselected">' + this.elements[i].name + '</div>';
                }
            }
        }
        Avionics.Utils.diffAndSet(_gps.contextualMenuElements, elementsHTML);
    }
}
class ContextualMenuConfirmation extends ContextualMenu {
    constructor(_title, _elements, _message) {
        super(_title, _elements);
        this.message = _message;
    }
    Update(_gps) {
        _gps.contextualMenuTitle.innerHTML = this.title;
        let ElementsHTML = "";
        _gps.menuSlider.setAttribute("state", "Inactive");
        ElementsHTML += '<div class="ContextualMenuElement" state="Unselected">' + this.message + '</div>';
        ElementsHTML += '<div id="ContextualMenuSeparator"></div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="' + (_gps.cursorIndex == 0 ? 'Selected' : 'Unselected') + '">' + this.elements[0].name + '</div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="Unselected">&nbsp;or&nbsp;</div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="' + (_gps.cursorIndex == 1 ? 'Selected' : 'Unselected') + '">' + this.elements[1].name + '</div>';
        _gps.contextualMenuElements.innerHTML = ElementsHTML;
    }
}
class ContextualMenuElement {
    constructor(_name, _callBack, _isInactive = false) {
        this.name = _name;
        this.callBack = _callBack;
        this.inactiveCallback = _isInactive;
    }
    SendEvent() {
        return this.callBack();
    }
    isInactive() {
        if (this.inactiveCallback instanceof Function) {
            return this.inactiveCallback();
        } else {
            return this.inactiveCallback;
        }
    }
}
//# sourceMappingURL=ContextualMenu.js.map