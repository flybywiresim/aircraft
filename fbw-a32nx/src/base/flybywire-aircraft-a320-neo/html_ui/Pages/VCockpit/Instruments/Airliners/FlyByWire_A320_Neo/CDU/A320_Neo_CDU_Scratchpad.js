// private variables and function are marked with _ prefix
/** The MCDU scratchpad display. This belongs to the MCDU itself. */
class ScratchpadDisplay {
    constructor(mcdu, scratchpadElement) {
        this.guid = `SP-${Utils.generateGUID()}`;
        this._mcdu = mcdu;
        this._scratchpadElement = scratchpadElement;
        this._scratchpadElement.className = "white";
    }

    write(value = "", color = "white") {
        this._scratchpadElement.textContent = value;
        this._scratchpadElement.className = color;
        this._mcdu.sendUpdate();
    }

    setStyle(style) {
        this._scratchpadElement.style = style;
    }

    getText() {
        return this._scratchpadElement.textContent;
    }

    getColor() {
        return this._scratchpadElement.className;
    }
}

/**
 * The scratchpad for each subsystem. These belong to the subsystems,
 * and one will be connected to the MCDU display (not paused) at any given time.
 */
class ScratchpadDataLink {
    constructor(mcdu, displayUnit, subsystem, keypadEnabled = true) {
        this._mcdu = mcdu;
        this._subsystem = subsystem;

        // actual scratchpad text/colour
        this._value = "";
        this._colour = "";

        // internal state
        this._text = "";
        this._message = undefined;
        this._status = 0;
        this._displayUnit = displayUnit;
        this._isPaused = true;
        this._keypadEnabled = keypadEnabled;
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
        if (!this._keypadEnabled) {
            return;
        }
        if (this._status !== SpDisplayStatus.userContent) {
            this.setText(char);
        } else if (this._text.length + 1 < 23) {
            this.setText(this._text + char);
        }
    }

    clear() {
        if (!this._keypadEnabled) {
            return;
        }
        if (this._status === SpDisplayStatus.empty) {
            this.setText(FMCMainDisplay.clrValue);
        } else if (this._status === SpDisplayStatus.clrValue) {
            this.setText("");
        } else if (this._status === SpDisplayStatus.userContent) {
            this.setText(this._text.slice(0, -1));
        } else {
            this._mcdu.removeMessageFromQueue(this._message.text);
            this.setText(this._text);
        }
    }

    clearHeld() {
        if (!this._keypadEnabled) {
            return;
        }
        if (this._status === SpDisplayStatus.clrValue || this._status === SpDisplayStatus.userContent) {
            this.setText("");
        }
    }

    isClearStop() {
        return this._status !== SpDisplayStatus.userContent;
    };

    plusMinus(char) {
        if (!this._keypadEnabled) {
            return;
        }
        if (this._status === SpDisplayStatus.userContent && this._text.slice(-1) === "-") {
            this.setText(this._text.slice(0, -1) + "+");
        } else {
            this.addChar(char);
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

    getText() {
        return this._text;
    };

    getColor() {
        return this._colour;
    }

    pause() {
        this._isPaused = true;
    }

    resume() {
        this._isPaused = false;
        this._display(this._value, this._colour);
    }

    _display(value, color = "white") {
        // store the content whether we're paused or not
        this._colour = color;
        this._value = value;
        this._updateStatus(value);

        // if we're not paused, write to the display
        if (!this._isPaused) {
            this._displayUnit.write(value, color);
        }
        // flag the annunciator if needed
        this._mcdu.setRequest(this._subsystem);
    }

    _updateStatus(scratchpadText) {
        if (this._message) {
            this._status = this._message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
        } else {
            if (this._text === "" || scratchpadText === "") {
                this._status = SpDisplayStatus.empty;
                setTimeout(() => this._mcdu.updateMessageQueue(), 150);
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
