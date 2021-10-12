class ScratchpadDisplay {
    constructor(scratchpadElement) {
        this.scratchpadElement = scratchpadElement;
        this.scratchpadElement.className = "white";
    }

    write(value = "", color = "white") {
        this.scratchpadElement.textContent = value;
        this.scratchpadElement.className = color;
    }
}

class ScratchpadDataLink {
    constructor(mcdu) {
        this.mcdu = mcdu;
        this.text = "";
        this.message = {};
        this.status = 0;
        this.displayUnit = null;
    }

    init(display) {
        this.displayUnit = display;
    }

    setText(text) {
        this.message = undefined;
        this.text = text;
        this.display(text);
    }

    setMessage(message) {
        if (this.message && !this.message.isTypeTwo && message.isTypeTwo) {
            return;
        }
        this.message = message;
        this.display(message.text, message.isAmber ? "amber" : "white");
    }

    removeMessage(messageText) {
        if (this.message && this.message.text === messageText) {
            this.setText("");
        }
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
    }

    clearHeld() {
        if (this.status === SpDisplayStatus.clrValue || this.status === SpDisplayStatus.userContent) {
            this.setText("");
        }
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

    setUserData(data) {
        this.text = data;
    }

    removeUserContentFromScratchpadAndDisplayAndReturnTextContent() {
        const userContent = this.text;
        if (this.status < SpDisplayStatus.typeOneMessage) {
            this.setText("");
        }
        return userContent;
    }
    // private functions below
    display(value, color = "white") {
        this.displayUnit.write(value, color);
        this.updateStatus(value);
    }

    updateStatus(scratchpadText) {
        if (this.message) {
            this.status = this.message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
        } else {
            if (this.text === "" || scratchpadText === "") {
                this.status = SpDisplayStatus.empty;
                setTimeout(() => this.mcdu.tryShowMessage(), 150);
            } else if (this.text === FMCMainDisplay.clrValue) {
                this.status = SpDisplayStatus.clrValue;
            } else {
                this.status = SpDisplayStatus.userContent;
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
