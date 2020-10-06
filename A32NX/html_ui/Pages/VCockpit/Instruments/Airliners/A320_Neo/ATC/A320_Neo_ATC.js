class A320_Neo_ATC extends Airliners.BaseATC {
    get templateID() {
        return "A320_Neo_ATC";
    }
    onEvent(_event) {
        if (_event.indexOf("BTN_") >= 0) {
            const buttonSuffix = _event.replace("BTN_", "");
            if (buttonSuffix.charAt(0) == 'C') {
                if (this.currentDigits[0] >= 0) {
                    if (this.bLastInputIsCLR) {
                        for (var i = 3; i >= 0; i--) {
                            this.currentDigits[i] = -1;
                        }
                    } else {
                        for (var i = 3; i >= 0; i--) {
                            if (this.currentDigits[i] >= 0) {
                                this.currentDigits[i] = -1;
                                break;
                            }
                        }
                    }
                    this.refreshValue();
                }
            } else if (buttonSuffix.charAt(0) == 'I') {
                return;
            } else {
                let slot = -1;
                {
                    for (var i = 0; i <= 3; i++) {
                        if (this.currentDigits[i] < 0) {
                            slot = i;
                            break;
                        }
                    }
                }
                if (slot < 0) {
                    for (var i = 0; i <= 3; i++) {
                        this.currentDigits[i] = -1;
                    }
                    slot = 0;
                }
                const buttonNumber = parseInt(buttonSuffix);
                this.currentDigits[slot] = buttonNumber;
                this.refreshValue();
                if (slot == 3 && this.currentDigits[3] >= 0) {
                    const code = (this.currentDigits[0] * 4096) + (this.currentDigits[1] * 256) + (this.currentDigits[2] * 16) + this.currentDigits[3];
                    SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", code);
                }
                this.bLastInputIsCLR = false;
            }
        }
    }
}
registerInstrument("a320-neo-atc", A320_Neo_ATC);
//# sourceMappingURL=A320_Neo_ATC.js.map