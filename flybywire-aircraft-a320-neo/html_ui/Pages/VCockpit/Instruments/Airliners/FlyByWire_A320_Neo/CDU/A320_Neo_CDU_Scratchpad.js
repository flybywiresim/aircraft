// private variables and function are marked with _ prefix
class ScratchpadDisplay {
    constructor(scratchpadElement) {
        this._scratchpadElement = scratchpadElement;
        this._scratchpadElement.className = "white";
    }

    write(value = "", color = "white") {
        this._scratchpadElement.textContent = value;
        this._scratchpadElement.className = color;
    }

    setStyle(style) {
        this._scratchpadElement.style = style;
    }
}

class ScratchpadDataLink {
    constructor(mcdu, displayUnit) {
        this._text = "";
        this._message = {};
        this._status = 0;
        this._mcdu = mcdu;
        this._displayUnit = displayUnit;
    }

    setText(text) {
        this._message = undefined;
        this._text = text;
        this._display(text);
    }

    setMessage(message) {
        if (this._message && !this._message.isTypeTwo && message.isTypeTwo) {
            return;
        }
        this._message = message;
        this._display(message.text, message.isAmber ? "amber" : "white");
    }

    removeMessage(messageText) {
        if (this._message && this._message.text === messageText) {
            this.setText("");
        }
    }

    addChar(char) {
        if (this._status === SpDisplayStatus.clrValue) {
            this.setText("");
        }
        if (this._text.length + 1 < 23) {
            this.setText(this._text + char);
        }
    }

    delChar() {
        if (this._status === SpDisplayStatus.userContent) {
            this.setText(this._text.slice(0, -1));
        }
    }

    clear() {
        if (this._status === SpDisplayStatus.empty) {
            this.setText(FMCMainDisplay.clrValue);
        } else if (this._status === SpDisplayStatus.clrValue) {
            this.setText("");
        } else if (this._status === SpDisplayStatus.userContent) {
            this.delChar();
        } else {
            this._mcdu.tryRemoveMessage(this._message.text);
            this.setText(this._text);
        }
    }

    clearHeld() {
        if (this._status === SpDisplayStatus.clrValue || this._status === SpDisplayStatus.userContent) {
            this.setText("");
        }
    }

    isClearStop() {
        return this._status !== SpDisplayStatus.userContent;
    };

    plusMinus(char) {
        if (this._status === SpDisplayStatus.empty) {
            this.addChar(char);
        } else if (this._status === SpDisplayStatus.userContent) {
            if (this._text.slice(-1) === "-") {
                this.delChar();
                this.addChar("+");
            } else {
                this.addChar(char);
            }
        }
    }

    setUserData(data) {
        this._text = data;
    }

    removeUserContentFromScratchpadAndDisplayAndReturnTextContent() {
        const userContent = this._text;
        if (this._status < SpDisplayStatus.typeOneMessage) {
            this.setText("");
        }
        return userContent;
    }

    setDisplayStyle(style) {
        this._displayUnit.setStyle(style);
    }

    getText() {
        return this._text;
    };

    _display(value, color = "white") {
        this._displayUnit.write(value, color);
        this._updateStatus(value);
    }

    _updateStatus(scratchpadText) {
        if (this._message) {
            this._status = this._message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
        } else {
            if (this._text === "" || scratchpadText === "") {
                this._status = SpDisplayStatus.empty;
                setTimeout(() => this._mcdu.tryShowMessage(), 150);
            } else if (this._text === FMCMainDisplay.clrValue) {
                this._status = SpDisplayStatus.clrValue;
            } else {
                this._status = SpDisplayStatus.userContent;
            }
        }
    }
}

const SpDisplayStatus = {
    empty: 0,
    clrValue: 1,
    userContent: 2,
    typeOneMessage: 3,
    typeTwoMessage: 4
};
