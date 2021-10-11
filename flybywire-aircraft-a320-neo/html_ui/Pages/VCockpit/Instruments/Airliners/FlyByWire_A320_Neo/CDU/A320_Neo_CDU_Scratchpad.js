class ScratchpadDisplay {
    constructor(_dataLink) {
        this.dataLink = _dataLink;
    }

    init() {
        this.scratchpadElement = this.dataLink.mcdu.getChildById("in-out");
        this.scratchpadElement.style.removeProperty("color");
        this.scratchpadElement.className = "white";
    }

    write(value = "", color = "white") {
        this.scratchpadElement.textContent = value;
        this.scratchpadElement.className = color;
        this.updateStatusForDataLink(value);
    }

    /**
     * private
     */
    updateStatusForDataLink(scratchpadText) {
        if (this.dataLink.message) {
            this.dataLink.status = this.dataLink.message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
        } else {
            if (this.dataLink.text === "" || scratchpadText === "") {
                this.dataLink.status = SpDisplayStatus.empty;
            } else if (this.dataLink.text === FMCMainDisplay.clrValue) {
                this.dataLink.status = SpDisplayStatus.clrValue;
                this.dataLink.mcdu.tryShowMessage();
            } else {
                this.dataLink.status = SpDisplayStatus.userContent;
            }
        }
    }
}

class ScratchpadDataLink {
    // TODO: if scratchpad is empty -> send request event to e.g. fmgc if not deselected for new message
    constructor(_mcdu) {
        this.mcdu = _mcdu;
        this.display = new ScratchpadDisplay(this);
        this.text = "";
        this.message = undefined;
        this.status = 0;
    }

    init() {
        this.display.init();
    }

    setUserData(data) {
        this.text = data;
    }

    setText(text) {
        this.message = undefined;
        this.text = text;
        this.display.write(text);
        // this.status = text ? SpDisplayStatus.userContent : SpDisplayStatus.empty;
    }

    setMessage(message) {
        if (this.message && !this.message.isTypeTwo && message.isTypeTwo) {
            return;
        }
        this.message = message;
        this.display.write(message.text, message.isAmber ? "amber" : "white");
        // this.status = message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
    }

    addChar(char) {
        if (this.text.length + 1 < 23) {
            this.setText(this.text + char);
        }
    }

    delChar() {
        if (this.status === SpDisplayStatus.userContent) {
            this.setText(this.text.slice(0, -1));
        }
    }

    clear() {
        if (this.status === SpDisplayStatus.empty) {
            this.setText(FMCMainDisplay.clrValue);
        } else if (this.status === SpDisplayStatus.clrValue) {
            this.setText("");
        } else if (this.status === SpDisplayStatus.userContent) {
            this.delChar();
        } else {
            this.mcdu.tryRemoveMessage(this.message.text);
            this.setText(this.text);
        }
        this.tryShowMessage();
    }

    clearHeld() {
        if (this.status === SpDisplayStatus.clrValue || (!this.status > SpDisplayStatus.userContent)) {
            this.setText("");
        }
        this.tryShowMessage();
    }

    plusMinus(char) {
        if (this.status === SpDisplayStatus.empty) {
            this.addChar(char);
        } else if (this.status === SpDisplayStatus.userContent) {
            if (this.text.slice(-1) === "-") {
                this.delChar();
                this.addChar("+");
            } else {
                this.addChar(char);
            }
        }
    }

    removeUserContentFromScratchpadAndDisplayAndReturnTextContent() {
        const userContent = this.text;
        this.setText("");
        return userContent;
    }

    removeMessage(messageText) {
        if (this.message && this.message.text === messageText) {
            this.setText("");
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
