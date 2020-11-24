class NavSystemTouch extends NavSystem {
    get IsGlassCockpit() {
        return true;
    }
    get isInteractive() {
        return true;
    }
    connectedCallback() {
        super.connectedCallback();
        this.selectionList = new NavSystemElementContainer("Selection List", "SelectionList", new NavSystemTouch_SelectionList());
        this.selectionList.setGPS(this);
    }
    makeButton(_button, _callback) {
        if (!_button) {
            console.warn("Trying to add an interaction on null element, ignoring");
            return;
        }
        _button.addEventListener("mouseup", this.onButtonPressed.bind(this, _callback));
    }
    onButtonPressed(_callback) {
        _callback();
        this.playInstrumentSound("tone_NavSystemTouch_touch");
    }
    openConfirmationWindow(_message, _button) {
    }
    getFullKeyboard() {
        console.error("getFullKeyboard called but not overrided !");
        return null;
    }
}
class NavSystemTouch_Transponder extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.transponderState = -1;
        this.currentInput = [-1, -1, -1, -1];
        this.inputIndex = -1;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.transponder_CodeDisplay = this.gps.getChildById("transponder_Code");
        this.transponder_Bksp = this.gps.getChildById("transponder_Bksp");
        this.transponder_Vfr = this.gps.getChildById("transponder_Vfr");
        this.transponder_0 = this.gps.getChildById("transponder_0");
        this.transponder_1 = this.gps.getChildById("transponder_1");
        this.transponder_2 = this.gps.getChildById("transponder_2");
        this.transponder_3 = this.gps.getChildById("transponder_3");
        this.transponder_4 = this.gps.getChildById("transponder_4");
        this.transponder_5 = this.gps.getChildById("transponder_5");
        this.transponder_6 = this.gps.getChildById("transponder_6");
        this.transponder_7 = this.gps.getChildById("transponder_7");
        this.transponder_Stby = this.gps.getChildById("transponder_Stby");
        this.transponder_On = this.gps.getChildById("transponder_On");
        this.transponder_Alt = this.gps.getChildById("transponder_Alt");
        this.gps.makeButton(this.transponder_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.transponder_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.transponder_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.transponder_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.transponder_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.transponder_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.transponder_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.transponder_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.transponder_Bksp, this.backpacePress.bind(this));
        this.gps.makeButton(this.transponder_Stby, this.setTransponderState.bind(this, 1));
        this.gps.makeButton(this.transponder_On, this.setTransponderState.bind(this, 3));
        this.gps.makeButton(this.transponder_Alt, this.setTransponderState.bind(this, 4));
        this.gps.makeButton(this.transponder_Vfr, this.setCurrentCode.bind(this, [1, 2, 0, 0]));
        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == 0) {
            this.setTransponderState(1);
        }
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.currentInput = [-1, -1, -1, -1];
        this.inputIndex = -1;
    }
    onUpdate(_deltaTime) {
        const transponderState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (this.transponderState != transponderState) {
            this.transponderState = transponderState;
            this.transponder_Stby.setAttribute("state", (transponderState == 1 ? "Active" : ""));
            this.transponder_On.setAttribute("state", (transponderState == 3 ? "Active" : ""));
            this.transponder_Alt.setAttribute("state", (transponderState == 4 ? "Active" : ""));
        }
        let transponderCode;
        if (this.inputIndex == -1) {
            transponderCode = '<span class="Fixed">' + ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4) + '</span>';
            if (this.transponder_CodeDisplay.innerHTML != transponderCode) {
                this.transponder_CodeDisplay.innerHTML = transponderCode;
            }
            this.inputChanged = true;
        } else if (this.inputChanged) {
            const regex = new RegExp('^(.{' + this.inputIndex + '})(.)(.*)');
            const replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
            transponderCode = "";
            for (let i = 0; i < this.currentInput.length; i++) {
                transponderCode += (this.currentInput[i] == -1 ? "_" : this.currentInput[i]);
            }
            transponderCode = (transponderCode + " ").replace(regex, replace);
            this.transponder_CodeDisplay.innerHTML = transponderCode;
            this.inputChanged = false;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.currentInput = [-1, -1, -1, -1];
            this.inputIndex = 0;
        }
        if (this.inputIndex < 4) {
            this.currentInput[this.inputIndex] = _digit;
            this.inputIndex++;
        }
        this.inputChanged = true;
    }
    backpacePress() {
        if (this.inputIndex == -1) {
            this.currentInput = [-1, -1, -1, -1];
            this.inputIndex = 0;
        } else if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput[this.inputIndex] = -1;
        }
        this.inputChanged = true;
    }
    setTransponderState(_state) {
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", _state);
    }
    cancelCode() {
        this.gps.closePopUpElement();
    }
    validateCode() {
        if (this.inputIndex != -1) {
            for (let i = 0; i < this.currentInput.length; i++) {
                if (this.currentInput[i] == -1) {
                    return;
                }
            }
            const code = this.currentInput[0] * 4096 + this.currentInput[1] * 256 + this.currentInput[2] * 16 + this.currentInput[3];
            SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
        }
        this.cancelCode();
    }
    setCurrentCode(_code) {
        this.currentInput = _code;
        this.inputIndex = 4;
        this.inputChanged = true;
    }
}
class NavSystemTouch_ScrollElement {
    constructor() {
        this.nbElements = NaN;
        this.lastNbElements = 0;
        this.scrollObjective = 0;
        this.isScrollLocked = false;
        this.frameWithoutMovement = 0;
        this.toBottom = false;
        this.isInit = false;
    }
    init() {
        this.elementContainer.addEventListener("mouseup", this.mouseUp.bind(this));
        this.elementContainer.addEventListener("mouseleave", this.mouseUp.bind(this));
        this.elementContainer.addEventListener("mousedown", this.mouseDown.bind(this));
        this.elementContainer.addEventListener("mousemove", this.mouseMove.bind(this));
    }
    mouseDown(event) {
        this.mouseMoveLastPosY = event.y;
        this.isMouseDragging = true;
    }
    mouseUp(event) {
        this.isMouseDragging = false;
    }
    mouseMove(event) {
        if (this.isMouseDragging) {
            this.elementContainer.scrollTop -= event.y - this.mouseMoveLastPosY;
            this.mouseMoveLastPosY = event.y;
        }
    }
    update() {
        if (!this.isInit) {
            this.init();
            this.isInit = true;
        }
        const speed = 100;
        if (this.elementContainer.scrollHeight - this.elementContainerSize < this.scrollObjective) {
            this.scrollObjective = Math.round(this.elementContainer.scrollHeight - this.elementContainerSize);
        }
        if (!isNaN(this.nbElements) && this.lastNbElements != this.nbElements) {
            this.lastNbElements = this.nbElements;
            this.elementSize = this.elementContainer.scrollHeight / this.nbElements;
        }
        if (this.isScrollLocked) {
            if (this.elementContainer.scrollTop < this.scrollObjective) {
                if (this.scrollObjective - this.elementContainer.scrollTop < speed) {
                    this.elementContainer.scrollTop = this.scrollObjective;
                } else {
                    this.elementContainer.scrollTop += speed;
                }
            } else if (this.elementContainer.scrollTop > this.scrollObjective) {
                if (this.elementContainer.scrollTop - this.scrollObjective < speed) {
                    this.elementContainer.scrollTop = this.scrollObjective;
                } else {
                    this.elementContainer.scrollTop -= speed;
                }
            } else {
                this.isScrollLocked = false;
            }
            if (this.scrollObjective == this.elementContainer.scrollTop) {
                this.isScrollLocked = false;
            }
        } else {
            if (this.lastScroll == this.elementContainer.scrollTop) {
                this.frameWithoutMovement++;
            } else {
                this.frameWithoutMovement = 0;
                this.toBottom = this.lastScroll < this.elementContainer.scrollTop;
                this.lastScroll = this.elementContainer.scrollTop;
            }
            if (this.frameWithoutMovement > 3 && (this.elementContainer.scrollTop % this.elementSize) != 0 && !this.isMouseDragging) {
                if (this.toBottom) {
                    this.scrollObjective = Math.round(Math.min((this.elementContainer.scrollTop + this.elementSize) - (this.elementContainer.scrollTop % this.elementSize), this.elementContainer.scrollHeight - this.elementContainer.getBoundingClientRect().height));
                } else {
                    this.scrollObjective = Math.round(this.elementContainer.scrollTop - this.elementContainer.scrollTop % this.elementSize);
                }
                this.isScrollLocked = true;
            }
        }
    }
    scrollUp(_oneStep = false) {
        if (_oneStep) {
            this.scrollObjective = this.elementContainer.scrollTop - this.elementSize;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        } else {
            const height = this.elementContainer.getBoundingClientRect().height;
            this.scrollObjective = this.elementContainer.scrollTop - height;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        }
        this.isScrollLocked = true;
    }
    scrollDown(_oneStep = false) {
        if (_oneStep) {
            this.scrollObjective = this.elementContainer.scrollTop + this.elementSize;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        } else {
            const height = this.elementContainer.getBoundingClientRect().height;
            this.scrollObjective = this.elementContainer.scrollTop + height;
            if (this.scrollObjective > (this.elementContainer.scrollHeight - height)) {
                this.scrollObjective = this.elementContainer.scrollHeight - height;
            } else {
                const elementHeight = this.elementSize;
                this.scrollObjective -= (this.scrollObjective) % elementHeight;
            }
        }
        this.isScrollLocked = true;
    }
}
class NavSystemTouch_AltitudeKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("AK_Bksp");
        this.button_0 = this.gps.getChildById("AK_0");
        this.button_1 = this.gps.getChildById("AK_1");
        this.button_2 = this.gps.getChildById("AK_2");
        this.button_3 = this.gps.getChildById("AK_3");
        this.button_4 = this.gps.getChildById("AK_4");
        this.button_5 = this.gps.getChildById("AK_5");
        this.button_6 = this.gps.getChildById("AK_6");
        this.button_7 = this.gps.getChildById("AK_7");
        this.button_8 = this.gps.getChildById("AK_8");
        this.button_9 = this.gps.getChildById("AK_9");
        this.display = this.gps.getChildById("AK_Display");
        this.cancelButton = this.gps.getChildById("AK_Cancel");
        this.enterButton = this.gps.getChildById("AK_Enter");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.cancelButton, this.cancelEdit.bind(this));
        this.gps.makeButton(this.enterButton, this.validateEdit.bind(this));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
    }
    setContext(_endCallback, _backPage, _startingValue) {
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.currentInput = _startingValue;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.isInputing = false;
        this.digits = [0, 0, 0, 0, 0];
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.display.innerHTML = text;
            }
        } else {
            this.display.innerHTML = this.currentInput + "FT";
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = 10000 * this.digits[0] + 1000 * this.digits[1] + 100 * this.digits[2] + 10 * this.digits[3] + this.digits[4];
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = 10000 * this.digits[0] + 1000 * this.digits[1] + 100 * this.digits[2] + 10 * this.digits[3] + this.digits[4];
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
        this.gps.closePopUpElement();
    }
    validateEdit() {
        this.endCallback(this.currentInput);
        this.cancelEdit();
    }
}
class NavSystemTouch_FullKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.maxChars = 6;
        this.currentValue = ["_", "_", "_", "_", "_", "_"];
        this.displayedValue = "______";
        this.currentIndex = -1;
        this.needUpdate = true;
        this.keyboardDisplayed = 1;
    }
    init(root) {
        this.window = root;
        this.EditText = this.gps.getChildById("EditText");
        this.Keyboard_LetterTable = this.gps.getChildById("Keyboard_LetterTable");
        this.Keyboard_NumberTable = this.gps.getChildById("Keyboard_NumberTable");
        this.InfosContent = this.gps.getChildById("InfosContent");
        this.InfosSymbol = this.gps.getChildById("InfosSymbol");
        this.K_Bksp = this.gps.getChildById("K_Bksp");
        this.KN_Bksp = this.gps.getChildById("KN_Bksp");
        this.K_SwitchToNum = this.gps.getChildById("K_SwitchToNum");
        this.KN_SwitchToLetters = this.gps.getChildById("KN_SwitchToLetters");
        this.K_A = this.gps.getChildById("K_A");
        this.K_B = this.gps.getChildById("K_B");
        this.K_C = this.gps.getChildById("K_C");
        this.K_D = this.gps.getChildById("K_D");
        this.K_E = this.gps.getChildById("K_E");
        this.K_F = this.gps.getChildById("K_F");
        this.K_G = this.gps.getChildById("K_G");
        this.K_H = this.gps.getChildById("K_H");
        this.K_I = this.gps.getChildById("K_I");
        this.K_J = this.gps.getChildById("K_J");
        this.K_K = this.gps.getChildById("K_K");
        this.K_L = this.gps.getChildById("K_L");
        this.K_M = this.gps.getChildById("K_M");
        this.K_N = this.gps.getChildById("K_N");
        this.K_O = this.gps.getChildById("K_O");
        this.K_P = this.gps.getChildById("K_P");
        this.K_Q = this.gps.getChildById("K_Q");
        this.K_R = this.gps.getChildById("K_R");
        this.K_S = this.gps.getChildById("K_S");
        this.K_T = this.gps.getChildById("K_T");
        this.K_U = this.gps.getChildById("K_U");
        this.K_V = this.gps.getChildById("K_V");
        this.K_W = this.gps.getChildById("K_W");
        this.K_X = this.gps.getChildById("K_X");
        this.K_Y = this.gps.getChildById("K_Y");
        this.K_Z = this.gps.getChildById("K_Z");
        this.KN_0 = this.gps.getChildById("KN_0");
        this.KN_1 = this.gps.getChildById("KN_1");
        this.KN_2 = this.gps.getChildById("KN_2");
        this.KN_3 = this.gps.getChildById("KN_3");
        this.KN_4 = this.gps.getChildById("KN_4");
        this.KN_5 = this.gps.getChildById("KN_5");
        this.KN_6 = this.gps.getChildById("KN_6");
        this.KN_7 = this.gps.getChildById("KN_7");
        this.KN_8 = this.gps.getChildById("KN_8");
        this.KN_9 = this.gps.getChildById("KN_9");
        this.KN_N = this.gps.getChildById("KN_N");
        this.KN_S = this.gps.getChildById("KN_S");
        this.KN_E = this.gps.getChildById("KN_E");
        this.KN_W = this.gps.getChildById("KN_W");
        this.gps.makeButton(this.K_Bksp, this.backSpace.bind(this));
        this.gps.makeButton(this.KN_Bksp, this.backSpace.bind(this));
        this.gps.makeButton(this.K_SwitchToNum, this.switchToKeyboard.bind(this, "Numbers"));
        this.gps.makeButton(this.KN_SwitchToLetters, this.switchToKeyboard.bind(this, "Letters"));
        this.gps.makeButton(this.K_A, this.characterPressed.bind(this, "A"));
        this.gps.makeButton(this.K_B, this.characterPressed.bind(this, "B"));
        this.gps.makeButton(this.K_C, this.characterPressed.bind(this, "C"));
        this.gps.makeButton(this.K_D, this.characterPressed.bind(this, "D"));
        this.gps.makeButton(this.K_E, this.characterPressed.bind(this, "E"));
        this.gps.makeButton(this.K_F, this.characterPressed.bind(this, "F"));
        this.gps.makeButton(this.K_G, this.characterPressed.bind(this, "G"));
        this.gps.makeButton(this.K_H, this.characterPressed.bind(this, "H"));
        this.gps.makeButton(this.K_I, this.characterPressed.bind(this, "I"));
        this.gps.makeButton(this.K_J, this.characterPressed.bind(this, "J"));
        this.gps.makeButton(this.K_K, this.characterPressed.bind(this, "K"));
        this.gps.makeButton(this.K_L, this.characterPressed.bind(this, "L"));
        this.gps.makeButton(this.K_M, this.characterPressed.bind(this, "M"));
        this.gps.makeButton(this.K_N, this.characterPressed.bind(this, "N"));
        this.gps.makeButton(this.K_O, this.characterPressed.bind(this, "O"));
        this.gps.makeButton(this.K_P, this.characterPressed.bind(this, "P"));
        this.gps.makeButton(this.K_Q, this.characterPressed.bind(this, "Q"));
        this.gps.makeButton(this.K_R, this.characterPressed.bind(this, "R"));
        this.gps.makeButton(this.K_S, this.characterPressed.bind(this, "S"));
        this.gps.makeButton(this.K_T, this.characterPressed.bind(this, "T"));
        this.gps.makeButton(this.K_U, this.characterPressed.bind(this, "U"));
        this.gps.makeButton(this.K_V, this.characterPressed.bind(this, "V"));
        this.gps.makeButton(this.K_W, this.characterPressed.bind(this, "W"));
        this.gps.makeButton(this.K_X, this.characterPressed.bind(this, "X"));
        this.gps.makeButton(this.K_Y, this.characterPressed.bind(this, "Y"));
        this.gps.makeButton(this.K_Z, this.characterPressed.bind(this, "Z"));
        this.gps.makeButton(this.KN_0, this.characterPressed.bind(this, "0"));
        this.gps.makeButton(this.KN_1, this.characterPressed.bind(this, "1"));
        this.gps.makeButton(this.KN_2, this.characterPressed.bind(this, "2"));
        this.gps.makeButton(this.KN_3, this.characterPressed.bind(this, "3"));
        this.gps.makeButton(this.KN_4, this.characterPressed.bind(this, "4"));
        this.gps.makeButton(this.KN_5, this.characterPressed.bind(this, "5"));
        this.gps.makeButton(this.KN_6, this.characterPressed.bind(this, "6"));
        this.gps.makeButton(this.KN_7, this.characterPressed.bind(this, "7"));
        this.gps.makeButton(this.KN_8, this.characterPressed.bind(this, "8"));
        this.gps.makeButton(this.KN_9, this.characterPressed.bind(this, "9"));
        this.gps.makeButton(this.KN_N, this.characterPressed.bind(this, "N"));
        this.gps.makeButton(this.KN_S, this.characterPressed.bind(this, "S"));
        this.gps.makeButton(this.KN_E, this.characterPressed.bind(this, "E"));
        this.gps.makeButton(this.KN_W, this.characterPressed.bind(this, "W"));
        this.currentWaypoint = new WayPoint(this.gps);
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.currentValue = ["_", "_", "_", "_", "_", "_"];
        this.displayedValue = "______";
        this.currentIndex = -1;
        this.needUpdate = true;
    }
    onUpdate(_deltaTime) {
        let updateDisplay = false;
        if (this.needUpdate) {
            let string = "";
            let icao = "";
            for (let i = 0; i < this.currentValue.length; i++) {
                string += this.currentValue[i];
                if (this.currentValue[i] != "_") {
                    icao += this.currentValue[i];
                }
            }
            string += " ";
            this.displayedValue = string;
            this.needUpdate = false;
            updateDisplay = true;
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", icao, this.gps.instrumentIdentifier);
        } else if (this.currentIndex != -1) {
            const ident = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.gps.instrumentIdentifier);
            const icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier);
            const type = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcaoType", "string", this.gps.instrumentIdentifier);
            const nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
            if (nbMatched > 1) {
                this.InfosContent.innerHTML = "Duplicates found";
            } else if (nbMatched == 0) {
                this.InfosContent.innerHTML = "No matches found";
            } else {
                if (this.lastIcao != icao) {
                    this.gps.facilityLoader.getFacilityCB(icao, (waypoint) => {
                        this.currentWaypoint = waypoint;
                        if (waypoint) {
                            const infos = this.currentWaypoint.infos;
                            this.InfosContent.innerHTML = infos.name;
                            const newValue = ident + "______".slice(ident.length);
                            if (this.displayedValue != newValue && ident.charAt(0) == this.currentValue[0]) {
                                this.displayedValue = newValue;
                                updateDisplay = true;
                            }
                        }
                    });
                    this.lastIcao = icao;
                }
            }
        } else {
            this.InfosContent.innerHTML = "Waypoint Identifier Lookup";
        }
        if (updateDisplay) {
            if (this.currentIndex == -1) {
                this.EditText.innerHTML = '<span class="NoEdit">' + this.displayedValue + '</span>';
            } else {
                const regex = new RegExp('^(.{' + this.currentIndex + '})(.)(.*)');
                const replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
                this.EditText.innerHTML = this.displayedValue.replace(regex, replace);
            }
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_endCallback, _types = "AVNW") {
        this.endCallback = _endCallback;
        this.searchTypes = _types;
    }
    characterPressed(_character) {
        if (this.currentIndex < this.currentValue.length) {
            if (this.currentIndex == -1) {
                this.currentIndex = 0;
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", this.searchTypes, this.gps.instrumentIdentifier);
            }
            this.currentValue[this.currentIndex] = _character;
            this.currentIndex++;
            for (let i = this.currentIndex; i < this.currentValue.length; i++) {
                this.currentValue[i] = "_";
            }
            this.needUpdate = true;
            return true;
        }
        return false;
    }
    backSpace() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            for (let i = this.currentIndex; i < this.currentValue.length; i++) {
                this.currentValue[i] = "_";
            }
            this.needUpdate = true;
            return true;
        }
        return false;
    }
    switchToKeyboard(_keyboard) {
        this.window.setAttribute("keyboard", _keyboard);
        return true;
    }
}
class NavSystemTouch_FrequencyKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.inputIndex = -1;
        this.waitingTitle = "";
        this.inputChanged = true;
        this.nbDigits = 2;
        this.unit = "MHz";
    }
    init(root) {
        this.window = root;
        this.title = this.window.getElementsByClassName("WindowTitle")[0];
        this.title.innerHTML = this.waitingTitle;
        this.findButton = this.gps.getChildById("FK_Find");
        this.activeFrequency = this.gps.getChildById("FK_ActiveFrequency");
        this.frequencyDisplay = this.gps.getChildById("FK_FreqDisplay");
        this.backspaceButton = this.gps.getChildById("FK_Bksp");
        this.xferButton = this.gps.getChildById("FK_Xfer");
        this.button_0 = this.gps.getChildById("FK_0");
        this.button_1 = this.gps.getChildById("FK_1");
        this.button_2 = this.gps.getChildById("FK_2");
        this.button_3 = this.gps.getChildById("FK_3");
        this.button_4 = this.gps.getChildById("FK_4");
        this.button_5 = this.gps.getChildById("FK_5");
        this.button_6 = this.gps.getChildById("FK_6");
        this.button_7 = this.gps.getChildById("FK_7");
        this.button_8 = this.gps.getChildById("FK_8");
        this.button_9 = this.gps.getChildById("FK_9");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
        this.gps.makeButton(this.xferButton, this.validateAndTransferEdit.bind(this));
    }
    setContext(_title, _minFreq, _maxFreq, _activeFreqSimVar, _stbyFreqSimVar, _endCallback, _backPage, _frequencySpacingModeSimVar) {
        if (this.title) {
            this.title.innerHTML = _title;
        } else {
            this.waitingTitle = _title;
        }
        this.minFreq = _minFreq;
        this.maxFreq = _maxFreq;
        this.activeFreqSimVar = _activeFreqSimVar;
        this.stbyFreqSimVar = _stbyFreqSimVar;
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.frequencySpacingModeSimVar = _frequencySpacingModeSimVar;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.inputIndex = -1;
    }
    onUpdate(_deltaTime) {
        this.frequencySpacingMode = 0;
        if (this.frequencySpacingModeSimVar && this.frequencySpacingModeSimVar != "") {
            this.frequencySpacingMode = SimVar.GetSimVarValue(this.frequencySpacingModeSimVar, "Enum");
        }
        const nbDigits = this.frequencySpacingMode == 0 ? this.nbDigits : this.nbDigits + 1;
        const freqActive = SimVar.GetSimVarValue(this.activeFreqSimVar, this.unit).toFixed(nbDigits);
        if (this.activeFrequency.innerHTML != freqActive) {
            this.activeFrequency.innerHTML = freqActive;
        }
        let freqStby;
        if (this.inputIndex == -1) {
            const stbyFreq = SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit);
            this.currentInput = stbyFreq;
            freqStby = '<span class="StbyFreq">' + stbyFreq.toFixed(nbDigits) + '</span>';
            if (this.frequencyDisplay.innerHTML != freqStby) {
                this.frequencyDisplay.innerHTML = freqStby;
            }
        } else if (this.inputChanged) {
            const regex = new RegExp('^(.{' + (this.inputIndex > (5 - this.nbDigits - 1) ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            const replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
            let value = ((this.currentInput / (this.unit == "KHz" ? 1 : 1000000)).toFixed(nbDigits) + " ");
            for (let i = 0; i < Math.floor(Math.log10(this.maxFreq * (this.unit == "KHz" ? 1 : 1000000))) - Math.floor(Math.log10(this.currentInput)); i++) {
                value = "0" + value;
            }
            freqStby = value.replace(regex, replace);
            this.inputChanged = false;
            this.frequencyDisplay.innerHTML = freqStby;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.inputIndex = 0;
            this.currentInput = this.minFreq * 1000000;
        }
        if (this.inputIndex < (5 + this.frequencySpacingMode) && (this.frequencySpacingMode == 1 || !(this.inputIndex == 4 && !(_digit == 2 || _digit == 5 || _digit == 7)))) {
            const newInput = Math.pow(10, 9 - this.inputIndex) * Math.floor((this.currentInput + 1) / Math.pow(10, 9 - this.inputIndex)) + Math.pow(10, 8 - this.inputIndex) * _digit;
            if (newInput <= this.maxFreq * 1000000 && newInput >= this.minFreq * 1000000) {
                this.currentInput = newInput;
                this.inputIndex++;
            } else if (newInput < this.minFreq * 1000000 && Math.pow(10, 8 - this.inputIndex) > this.minFreq * 1000000 - newInput) {
                this.currentInput = this.minFreq * 1000000;
                this.inputIndex++;
            }
        }
        this.inputChanged = true;
    }
    onBackSpacePress() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 9 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 9 - this.inputIndex));
            if (this.currentInput < this.minFreq * 1000000) {
                this.currentInput = this.minFreq * 1000000;
            }
        }
        this.inputChanged = true;
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
    }
    validateEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * 1000000 : this.currentInput, false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * 1000000 : this.currentInput, true);
        this.cancelEdit();
    }
}
class NavSystemTouch_ADFFrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    constructor() {
        super();
        this.nbDigits = 1;
        this.unit = "KHz";
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.inputIndex = 0;
            this.currentInput = this.minFreq;
        }
        if (this.inputIndex < 5) {
            const newInput = Math.pow(10, 4 - this.inputIndex) * Math.floor((this.currentInput + 0.001) / Math.pow(10, 4 - this.inputIndex)) + Math.pow(10, 3 - this.inputIndex) * _digit;
            if (newInput <= this.maxFreq && newInput >= this.minFreq) {
                this.currentInput = newInput;
                this.inputIndex++;
            } else if (newInput < this.minFreq && Math.pow(10, 3 - this.inputIndex) > this.minFreq - newInput) {
                this.currentInput = this.minFreq;
                this.inputIndex++;
            }
        }
        this.inputChanged = true;
    }
    onBackSpacePress() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 4 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 4 - this.inputIndex));
            if (this.currentInput < this.minFreq) {
                this.currentInput = this.minFreq;
            }
        }
        this.inputChanged = true;
    }
    validateEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) : this.currentInput, false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) : this.currentInput, true);
        this.cancelEdit();
    }
}
class NavSystemTouch_TimeKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0, 0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("TK_Bksp");
        this.button_0 = this.gps.getChildById("TK_0");
        this.button_1 = this.gps.getChildById("TK_1");
        this.button_2 = this.gps.getChildById("TK_2");
        this.button_3 = this.gps.getChildById("TK_3");
        this.button_4 = this.gps.getChildById("TK_4");
        this.button_5 = this.gps.getChildById("TK_5");
        this.button_6 = this.gps.getChildById("TK_6");
        this.button_7 = this.gps.getChildById("TK_7");
        this.button_8 = this.gps.getChildById("TK_8");
        this.button_9 = this.gps.getChildById("TK_9");
        this.timeDisplay = this.gps.getChildById("TK_TimeDisplay");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
    }
    setContext(_endCallback, _backPage, _startingValue) {
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.currentInput = _startingValue;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.isInputing = false;
        this.digits = [0, 0, 0, 0, 0, 0];
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    if (i % 2 == 1) {
                        text += '<span class="Writed">:<span>';
                    }
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.timeDisplay.innerHTML = text;
            }
        } else {
            const seconds = fastToFixed(Math.floor(this.currentInput / 1000) % 60, 0);
            const minutes = fastToFixed(Math.floor(this.currentInput / 60000) % 60, 0);
            const hours = fastToFixed(Math.floor(this.currentInput / 3600000) % 24, 0);
            this.timeDisplay.innerHTML = "00".slice(0, 2 - hours.length) + hours + ":" + "00".slice(0, 2 - minutes.length) + minutes + ":" + "00".slice(0, 2 - seconds.length) + seconds;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = (10 * this.digits[0] + this.digits[1]) * 3600000 + (10 * this.digits[2] + this.digits[3]) * 60000 + (10 * this.digits[4] + this.digits[5]) * 1000;
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = (10 * this.digits[0] + this.digits[1]) * 3600000 + (10 * this.digits[2] + this.digits[3]) * 60000 + (10 * this.digits[4] + this.digits[5]) * 1000;
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
    }
    validateEdit() {
        const maxDigits = [2, 3, 5, 9, 5, 9];
        let isValid = true;
        for (let i = 0; i < this.digits.length; i++) {
            if (this.digits[i] > maxDigits[i]) {
                isValid = false;
            }
        }
        if (isValid) {
            this.endCallback(this.currentInput);
            this.cancelEdit();
        } else {
            this.isInputing = false;
            this.gps.openConfirmationWindow("Invalid Entry <br/> Valid range is 00:00:00 to 23:59:59", "OK");
        }
    }
}
class NavSystemTouch_DupWPLine {
    constructor(_gps) {
        this.geoCalc = new GeoCalcInfo(_gps);
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.identButton_Ident = window.document.createElement("div");
                    this.identButton_Ident.setAttribute("class", "Ident");
                    this.identButton.appendChild(this.identButton_Ident);
                    this.identButton_Logo = window.document.createElement("img");
                    this.identButton_Logo.setAttribute("class", "Logo");
                    this.identButton.appendChild(this.identButton_Logo);
                    this.identButton_Name = window.document.createElement("div");
                    this.identButton_Name.setAttribute("class", "Name");
                    this.identButton.appendChild(this.identButton_Name);
                    this.identButton_City = window.document.createElement("div");
                    this.identButton_City.setAttribute("class", "City");
                    this.identButton.appendChild(this.identButton_City);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("class", "BearingArrow");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                this.bearingText.setAttribute("class", "BearingText");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                this.distance.setAttribute("class", "Distance");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
        }
    }
    onEndGeoCalcCompute() {
        Avionics.Utils.diffAndSetAttribute(this.bearingArrow, "style", "transform: rotate(" + fastToFixed(this.geoCalc.bearing, 3) + "deg)");
        Avionics.Utils.diffAndSet(this.bearingText, fastToFixed(this.geoCalc.bearing, 0) + "°");
        Avionics.Utils.diffAndSet(this.distance, fastToFixed(this.geoCalc.distance, 0) + "NM");
    }
}
class NavSystemTouch_DuplicateWaypointSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.wayPoints = [];
    }
    setContext(_endCallback) {
        this.endCallback = _endCallback;
    }
    init(root) {
        this.window = root;
        this.lines = [];
        this.table = this.gps.getChildById("WPDup_WayPointsTable");
        this.tableBody = this.gps.getChildById("WPDup_WaypointsBody");
        this.searchTitle = this.gps.getChildById("WPDup_SearchTitle");
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.tableBody;
        this.scrollElement.elementSize = this.lines.length > 0 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.batch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcaoType", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIdent", "string", "string");
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.searchTitle.textContent = 'Search Results for "' + SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.gps.instrumentIdentifier) + '"';
        SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
            this.wayPoints = [];
            for (let i = 0; i < _Values.length; i++) {
                const waypoint = new WayPoint(this.gps);
                waypoint.type = _Values[i][0];
                waypoint.SetIdent(_Values[i][2]);
                waypoint.SetICAO(_Values[i][1]);
                this.wayPoints.push(waypoint);
            }
            this.endLoad();
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.gps.instrumentIdentifier);
        }.bind(this), this.gps.instrumentIdentifier);
    }
    endLoad() {
        for (let i = 0; i < this.wayPoints.length; i++) {
            if (i >= this.lines.length) {
                const newLine = new NavSystemTouch_DupWPLine(this.gps);
                this.tableBody.appendChild(newLine.base);
                this.lines.push(newLine);
                this.gps.makeButton(newLine.identButton, this.onButtonClick.bind(this, i));
            }
        }
        for (let i = this.wayPoints.length; i < this.lines.length; i++) {
            this.lines[i].base.setAttribute("state", "Inactive");
        }
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 0 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        for (let i = 0; i < this.wayPoints.length; i++) {
            const infos = this.wayPoints[i].GetInfos();
            Avionics.Utils.diffAndSet(this.lines[i].identButton_Ident, infos.ident);
            Avionics.Utils.diffAndSet(this.lines[i].identButton_Name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].identButton_City, infos.city + "," + infos.region);
            const logo = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].identButton_Logo, "src", logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            if (infos.coordinates && infos.coordinates.lat) {
                this.lines[i].geoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
                this.lines[i].geoCalc.Compute(this.lines[i].onEndGeoCalcCompute.bind(this.lines[i]));
            }
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onButtonClick(_index) {
        this.endCallback(this.wayPoints[_index].icao);
    }
}
class NavSystemTouch_NRST_Airport_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            const td4 = window.document.createElement("td");
            {
                this.appr = window.document.createElement("div");
                td4.appendChild(this.appr);
                this.runway = window.document.createElement("div");
                td4.appendChild(this.runway);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_Airport extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.airportLines = [];
        this.selectedElement = -1;
        this.showOnMap = false;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstAirport_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstAirport_InsertInFpl");
        this.airportInfos_button = this.gps.getChildById("NrstAirport_AirportInfo");
        this.airportChart_button = this.gps.getChildById("NrstAirport_AirportChart");
        this.showOnMap_button = this.gps.getChildById("NrstAirport_ShowOnMap");
        this.nearestAirports = new NearestAirportList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
        this.gps.makeButton(this.airportInfos_button, this.airportInfo.bind(this));
        this.gps.makeButton(this.showOnMap_button, this.showOnMapToggle.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearestAirports.Update(25, 200);
        for (let i = 0; i < this.nearestAirports.airports.length; i++) {
            if (this.airportLines.length < i + 1) {
                const newLine = new NavSystemTouch_NRST_Airport_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.airportLines.push(newLine);
            }
            const infos = this.nearestAirports.airports[i];
            Avionics.Utils.diffAndSet(this.airportLines[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.airportLines[i].name, infos.name);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.airportLines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.airportLines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.airportLines[i].runway, fastToFixed(infos.longestRunwayLength, 0) + "FT");
            Avionics.Utils.diffAndSet(this.airportLines[i].appr, infos.bestApproach);
        }
        for (let i = this.nearestAirports.airports.length; i < this.airportLines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[_index].identButton.setAttribute("state", "None");
        } else {
            if (this.selectedElement != -1) {
                this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.airportLines[_index].identButton.setAttribute("state", "SelectedWP");
        }
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[_index].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[_index].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearestAirports.airports[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearestAirports.airports[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
    airportInfo() {
        this.gps.SwitchToPageName("MFD", "Airport Info");
    }
    showOnMapToggle() {
        this.showOnMap = !this.showOnMap;
        this.showOnMap_button.setAttribute("state", this.showOnMap ? "Active" : "");
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        } else {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
        }
    }
}
class NavSystemTouch_NRST_Intersection_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
        }
    }
}
class NavSystemTouch_NRST_Intersection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstIntersection_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstIntersection_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstIntersection_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstAirport_ShowOnMap");
        this.nearest = new NearestIntersectionList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.intersections.length; i++) {
            if (this.lines.length < i + 1) {
                const newLine = new NavSystemTouch_NRST_Intersection_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.lines.push(newLine);
            }
            const infos = this.nearest.intersections[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
        }
        for (let i = this.nearest.intersections.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        } else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.intersections[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.intersections[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_NRST_VOR_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            const td4 = window.document.createElement("td");
            {
                this.frequencyButton = window.document.createElement("div");
                this.frequencyButton.setAttribute("class", "gradientButton");
                {
                    this.frequency = window.document.createElement("div");
                    this.frequency.setAttribute("class", "mainNumber");
                    this.frequencyButton.appendChild(this.frequency);
                }
                td4.appendChild(this.frequencyButton);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_VOR extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstVOR_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstVOR_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstVOR_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstVOR_ShowOnMap");
        this.nearest = new NearestVORList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.vors.length; i++) {
            if (this.lines.length < i + 1) {
                const newLine = new NavSystemTouch_NRST_VOR_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.gps.makeButton(newLine.frequencyButton, this.clickOnFrequency.bind(this, i));
                this.lines.push(newLine);
            }
            const infos = this.nearest.vors[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.lines[i].name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].frequency, infos.frequencyMHz.toFixed(2));
        }
        for (let i = this.nearest.vors.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        } else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    clickOnFrequency(_index) {
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.vors[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.vors[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_NRST_NDB_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            const td4 = window.document.createElement("td");
            {
                this.frequency = window.document.createElement("div");
                this.frequency.setAttribute("class", "Frequency");
                td4.appendChild(this.frequency);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_NDB extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstNDB_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstNDB_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstNDB_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstNDB_ShowOnMap");
        this.nearest = new NearestNDBList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.ndbs.length; i++) {
            if (this.lines.length < i + 1) {
                const newLine = new NavSystemTouch_NRST_NDB_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.lines.push(newLine);
            }
            const infos = this.nearest.ndbs[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.lines[i].name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].frequency, infos.frequencyMHz.toFixed(1));
        }
        for (let i = this.nearest.ndbs.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        } else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.ndbs[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.ndbs[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_DirectTo extends NavSystemElement {
    init(root) {
        this.SelectedWaypoint = this.gps.getChildById("SelectedWaypoint");
        this.SelectedWaypoint_Symbol = this.SelectedWaypoint.getElementsByClassName("waypointSymbol")[0];
        this.SelectedWaypoint_MainText = this.SelectedWaypoint.getElementsByClassName("mainText")[0];
        this.SelectedWaypoint_MainValue = this.SelectedWaypoint.getElementsByClassName("mainValue")[0];
        this.SelectedWaypoint_SubText = this.SelectedWaypoint.getElementsByClassName("title")[0];
        this.DRCT_City = this.gps.getChildById("DRCT_City");
        this.DRCT_Region = this.gps.getChildById("DRCT_Region");
        this.DRCT_Bearing = this.gps.getChildById("DRCT_Bearing");
        this.DRCT_Distance = this.gps.getChildById("DRCT_Distance");
        this.DRCT_CancelButton = this.gps.getChildById("DRCT_CancelButton");
        this.DRCT_CancelButton_MainValue = this.DRCT_CancelButton.getElementsByClassName("mainValue")[0];
        this.DRCT_ActivateDirect = this.gps.getChildById("DRCT_ActivateDirect");
        this.DRCT_ActivateDirect_MainValue = this.DRCT_ActivateDirect.getElementsByClassName("mainValue")[0];
        this.gps.makeButton(this.SelectedWaypoint, this.openKeyboard.bind(this));
        this.gps.makeButton(this.DRCT_CancelButton, this.cancelDirectTo.bind(this));
        this.gps.makeButton(this.DRCT_ActivateDirect, this.activateDirectTo.bind(this));
        this.GeoCalc = new GeoCalcInfo(this.gps);
    }
    onEnter() {
        if (this.gps.lastRelevantICAO) {
            this.endKeyboard(this.gps.lastRelevantICAO);
            this.gps.lastRelevantICAO = null;
        }
    }
    onUpdate(_deltaTime) {
        const isDirectTo = this.gps.currFlightPlanManager.getIsDirectTo();
        if (isDirectTo) {
            const nextIdent = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            this.DRCT_CancelButton_MainValue.innerHTML = nextIdent;
        } else {
            this.DRCT_CancelButton_MainValue.innerHTML = "_____";
        }
        if (!this.CurrentWaypoint) {
            this.SelectedWaypoint_MainText.setAttribute("style", "visibility: visible");
            this.DRCT_City.innerHTML = "";
            this.DRCT_Region.innerHTML = "";
            this.DRCT_Bearing.innerHTML = "___°";
            this.DRCT_Distance.innerHTML = "__._NM";
        }
    }
    onLoadEnd() {
        const infos = this.CurrentWaypoint.GetInfos();
        this.SelectedWaypoint_MainText.setAttribute("style", "visibility: hidden");
        this.SelectedWaypoint_MainValue.innerHTML = infos.ident;
        this.DRCT_ActivateDirect_MainValue.innerHTML = infos.ident;
        this.SelectedWaypoint_SubText.innerHTML = infos.name;
        this.DRCT_City.innerHTML = infos.city;
        this.DRCT_Region.innerHTML = infos.region;
        this.GeoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
        this.GeoCalc.Compute(this.onCalcEnd.bind(this));
    }
    onCalcEnd() {
        this.DRCT_Bearing.innerHTML = fastToFixed(this.GeoCalc.bearing, 0) + "°";
        this.DRCT_Distance.innerHTML = fastToFixed(this.GeoCalc.distance, 1) + "NM";
        const infos = this.CurrentWaypoint.GetInfos();
        this.GeoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
        this.GeoCalc.Compute(this.onCalcEnd.bind(this));
    }
    onExit() {
    }
    onEvent(_event) {
    }
    openKeyboard() {
    }
    endKeyboard(_icao) {
        if (_icao != "") {
            this.CurrentWaypoint = new WayPoint(this.gps);
            this.CurrentWaypoint.type = _icao.charAt(0);
            this.gps.facilityLoader.getFacilityCB(_icao, (wp) => {
                this.CurrentWaypoint = wp;
                this.onLoadEnd();
            });
        } else {
            this.CurrentWaypoint = null;
        }
    }
    activateDirectTo() {
        this.gps.currFlightPlanManager.activateDirectTo(this.CurrentWaypoint.GetInfos().icao, () => {
            this.back();
        });
    }
    cancelDirectTo() {
        this.gps.currFlightPlanManager.cancelDirectTo(() => {
            this.back();
        });
    }
    back() {
    }
}
class NavSystemTouch_FPLWaypointLine {
}
class NavSystemTouch_ActiveFPL extends NavSystemElement {
    constructor(_smallArrow = false) {
        super();
        this.origin_wayPoint = new NavSystemTouch_FPLWaypointLine();
        this.departureWaypoints = [];
        this.enRouteWaypoints = [];
        this.destination_wayPoint = new NavSystemTouch_FPLWaypointLine();
        this.arrivalWaypoints = [];
        this.approachWaypoints = [];
        this.selectedWaypoint = -1;
        this.selectedGroup = 0;
        this.selectedElement = null;
        this.currentMenu = 0;
        this.arrowLeftOffset = 35;
        this.arrowTopOffset = 35;
        this.arrowLineWidth = 8;
        this.arrowLineDistance = 16;
        this.arrowHeadWidth = 13;
        this._t = 0;
        if (_smallArrow) {
            this.arrowLeftOffset = 30;
            this.arrowTopOffset = 30;
            this.arrowLineDistance = 11;
            this.arrowLineWidth = 5;
            this.arrowHeadWidth = 8;
        }
    }
    setArrowSizes(_leftOffset, _topOffset, _lineDistance, _lineWidth, _headWidth) {
        this.arrowLeftOffset = _leftOffset;
        this.arrowTopOffset = _topOffset;
        this.arrowLineDistance = _lineDistance;
        this.arrowLineWidth = _lineWidth;
        this.arrowHeadWidth = _headWidth;
    }
    init(root) {
        this.directToButton = this.gps.getChildById("AFPL_Drct");
        this.flightPlanDiv = this.gps.getChildById("flightPlan");
        this.waypointsBody = this.gps.getChildById("AFPL_WaypointsBody");
        this.fplName = this.gps.getChildById("AFPL_Name");
        this.origin = this.gps.getChildById("AFPL_Origin");
        this.origin_mainText = this.origin.getElementsByClassName("mainText")[0];
        this.origin_mainValue = this.origin.getElementsByClassName("mainValue")[0];
        this.origin_wayPoint.base = this.gps.getChildById("AFPL_OriginWaypoint");
        this.origin_wayPoint.identButton = this.origin_wayPoint.base.getElementsByClassName("gradientButton")[0];
        this.origin_wayPoint.identButton_Ident = this.origin_wayPoint.identButton.getElementsByClassName("mainValue")[0];
        this.origin_wayPoint.identButton_Name = this.origin_wayPoint.identButton.getElementsByClassName("title")[0];
        this.origin_wayPoint.identButton_Logo = this.origin_wayPoint.identButton.getElementsByClassName("symbol")[0];
        this.origin_wayPoint.index = 0;
        this.enRoute = this.gps.getChildById("AFPL_EnRoute");
        this.enRouteAdd = this.gps.getChildById("AFPL_EnRouteAdd");
        this.destination = this.gps.getChildById("AFPL_Destination");
        this.destination_mainText = this.destination.getElementsByClassName("mainText")[0];
        this.destination_mainValue = this.destination.getElementsByClassName("mainValue")[0];
        this.destination_wayPoint.base = this.gps.getChildById("AFPL_DestinationWaypoint");
        this.destination_wayPoint.identButton = this.destination_wayPoint.base.getElementsByClassName("gradientButton")[0];
        this.destination_wayPoint.identButton_Ident = this.destination_wayPoint.identButton.getElementsByClassName("mainValue")[0];
        this.destination_wayPoint.identButton_Name = this.destination_wayPoint.identButton.getElementsByClassName("title")[0];
        this.destination_wayPoint.identButton_Logo = this.destination_wayPoint.identButton.getElementsByClassName("symbol")[0];
        this.destination_wayPoint.altButton = this.destination_wayPoint.base.getElementsByClassName("gradientButton")[1];
        this.destination_wayPoint.altButton_Value = this.destination_wayPoint.altButton.getElementsByClassName("mainValue")[0];
        this.destination_wayPoint.distance = this.destination_wayPoint.base.getElementsByClassName("DIS")[0];
        this.destination_wayPoint.dtk = this.destination_wayPoint.base.getElementsByClassName("DTK")[0];
        this.approach = this.gps.getChildById("AFPL_Approach");
        this.approach_mainText = this.approach.getElementsByClassName("mainText")[0];
        this.approach_mainValue = this.approach.getElementsByClassName("mainValue")[0];
        this.CurrentLegArrow = this.gps.getChildById("CurrentLegArrow");
        this.insertBefore_Button = this.gps.getChildById("AFPL_InsertBefore_Button");
        this.insertAfter_Button = this.gps.getChildById("AFPL_InsertAfter_Button");
        this.drct_Button = this.gps.getChildById("AFPL_Drct_Button");
        this.activateLegTo_Button = this.gps.getChildById("AFPL_ActivateLegTo_Button");
        this.removeWaypoint_Button = this.gps.getChildById("AFPL_RemoveWaypoint_Button");
        this.AFPL_EnRouteAdd = this.gps.getChildById("AFPL_EnRouteAdd");
        this.AddEnrouteButton = this.gps.getChildById("AddEnrouteButton");
        this.AddEnrouteDone = this.gps.getChildById("AddEnrouteDone");
        this.selectOriginAirportButton = this.gps.getChildById("AFPL_SelectOrigin_Button");
        this.selectDestinationAirportButton = this.gps.getChildById("AFPL_SelectDest_Button");
        this.altitudeKeyboard = new NavSystemElementContainer("Altitude Keyboard", "altitudeKeyboard", new NavSystemTouch_AltitudeKeyboard());
        this.altitudeKeyboard.setGPS(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.waypointsBody;
        this.scrollElement.elementSize = this.origin.getBoundingClientRect().height;
        this.gps.makeButton(this.directToButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Direct To"));
        this.gps.makeButton(this.origin, this.originClick.bind(this));
        this.gps.makeButton(this.origin_wayPoint.identButton, this.originWaypointClick.bind(this));
        this.gps.makeButton(this.destination, this.destinationClick.bind(this));
        this.gps.makeButton(this.destination_wayPoint.identButton, this.destinationWaypointClick.bind(this));
        this.gps.makeButton(this.destination_wayPoint.altButton, this.editAltitude.bind(this, 0, 4));
        this.gps.makeButton(this.insertBefore_Button, this.insertBefore.bind(this));
        this.gps.makeButton(this.insertAfter_Button, this.insertAfter.bind(this));
        this.gps.makeButton(this.drct_Button, this.directTo.bind(this));
        this.gps.makeButton(this.activateLegTo_Button, this.activateLegTo.bind(this));
        this.gps.makeButton(this.removeWaypoint_Button, this.removeWaypoint.bind(this));
        this.gps.makeButton(this.AddEnrouteButton, this.addEnroute.bind(this));
        this.gps.makeButton(this.AddEnrouteDone, this.enrouteDone.bind(this));
        this.gps.makeButton(this.selectOriginAirportButton, this.selectOrigin.bind(this));
        this.gps.makeButton(this.selectDestinationAirportButton, this.selectDestination.bind(this));
    }
    onEnter() {
        this.gps.currFlightPlanManager.updateFlightPlan(this.updateDisplay.bind(this));
        this.gps.currFlightPlanManager.updateCurrentApproach(this.updateDisplay.bind(this));
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.origin.getBoundingClientRect().height;
        }
        this.scrollElement.update();
        this._t++;
        if (this._t > 30) {
            this.gps.currFlightPlanManager.updateFlightPlan(this.updateDisplay.bind(this));
            this._t = 0;
        }
        this.updateDisplay();
    }
    onExit() {
        let waypoint;
        if (this.selectedGroup === 5) {
            waypoint = this.gps.currFlightPlanManager.getApproachWaypoints()[this.getSelectedIndex()];
        } else {
            waypoint = this.gps.currFlightPlanManager.getWaypoint(this.getSelectedIndex());
        }
        if (waypoint) {
            this.gps.lastRelevantICAOType = waypoint.type;
            this.gps.lastRelevantICAO = waypoint.icao;
        }
    }
    onEvent(_event) {
    }
    updateDisplay() {
        if (this.gps.currFlightPlanManager.getWaypointsCount() < 3) {
            Avionics.Utils.diffAndSetAttribute(this.AFPL_EnRouteAdd, "state", "Active");
        }
        let name = (this.gps.currFlightPlanManager.getWaypointsCount() > 0 && this.gps.currFlightPlanManager.getWaypoint(0) != undefined ? this.gps.currFlightPlanManager.getWaypoint(0).infos.ident : "______");
        name += "/";
        name += (this.gps.currFlightPlanManager.getWaypointsCount() > 1 && this.gps.currFlightPlanManager.getWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1) != undefined ? this.gps.currFlightPlanManager.getWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1).infos.ident : "______");
        Avionics.Utils.diffAndSet(this.fplName, name);
        const departure = this.gps.currFlightPlanManager.getDepartureWaypointsMap();
        const arrival = this.gps.currFlightPlanManager.getArrivalWaypointsMap();
        const approach = this.gps.currFlightPlanManager.getApproachWaypoints();
        const approachInfos = this.gps.currFlightPlanManager.getAirportApproach();
        const enroute = this.gps.currFlightPlanManager.getEnRouteWaypoints();
        const origin = this.gps.currFlightPlanManager.getOrigin();
        const destination = this.gps.currFlightPlanManager.getDestination();
        if (origin) {
            if (departure.length > 0) {
                Avionics.Utils.diffAndSet(this.origin_mainValue, "Departure - " + this.gps.currFlightPlanManager.getDeparture().name);
            } else {
                Avionics.Utils.diffAndSet(this.origin_mainValue, "Origin - " + origin.infos.ident);
            }
            Avionics.Utils.diffAndSet(this.origin_mainText, "");
            Avionics.Utils.diffAndSetAttribute(this.origin_wayPoint.base, "state", "Active");
            const originInfo = this.gps.currFlightPlanManager.getWaypoint(0).infos;
            Avionics.Utils.diffAndSet(this.origin_wayPoint.identButton_Ident, originInfo.ident);
            Avionics.Utils.diffAndSet(this.origin_wayPoint.identButton_Name, originInfo.name);
            const symbol = originInfo.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.origin_wayPoint.identButton_Logo, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            for (let i = 0; i < departure.length; i++) {
                if (this.departureWaypoints.length <= i) {
                    this.departureWaypoints.push(new NavSystemTouch_FPLWaypointLine());
                    this.departureWaypoints[i].base = document.createElement("tr");
                    {
                        const td1 = document.createElement("td");
                        {
                            this.departureWaypoints[i].identButton = document.createElement("div");
                            {
                                Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].identButton, "class", "gradientButton Waypoint");
                                this.departureWaypoints[i].identButton_Ident = document.createElement("div");
                                {
                                    this.departureWaypoints[i].identButton_Ident.setAttribute("class", "mainValue");
                                }
                                this.departureWaypoints[i].identButton.appendChild(this.departureWaypoints[i].identButton_Ident);
                                this.departureWaypoints[i].identButton_Name = document.createElement("div");
                                {
                                    this.departureWaypoints[i].identButton_Name.setAttribute("class", "title");
                                }
                                this.departureWaypoints[i].identButton.appendChild(this.departureWaypoints[i].identButton_Name);
                                this.departureWaypoints[i].identButton_Logo = document.createElement("img");
                                {
                                    this.departureWaypoints[i].identButton_Logo.setAttribute("class", "symbol");
                                }
                                this.departureWaypoints[i].identButton.appendChild(this.departureWaypoints[i].identButton_Logo);
                            }
                            td1.appendChild(this.departureWaypoints[i].identButton);
                        }
                        this.departureWaypoints[i].base.appendChild(td1);
                        const td2 = document.createElement("td");
                        {
                            this.departureWaypoints[i].altButton = document.createElement("div");
                            {
                                Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].altButton, "class", "gradientButton");
                                this.departureWaypoints[i].altButton_Value = document.createElement("div");
                                {
                                    Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].altButton_Value, "class", "mainValue");
                                    Avionics.Utils.diffAndSet(this.departureWaypoints[i].altButton_Value, "_____FT");
                                }
                                this.departureWaypoints[i].altButton.appendChild(this.departureWaypoints[i].altButton_Value);
                            }
                            td2.appendChild(this.departureWaypoints[i].altButton);
                        }
                        this.departureWaypoints[i].base.appendChild(td2);
                        const td3 = document.createElement("td");
                        {
                            this.departureWaypoints[i].dtk = document.createElement("div");
                            Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].dtk, "class", "DTK");
                            td3.appendChild(this.departureWaypoints[i].dtk);
                            this.departureWaypoints[i].distance = document.createElement("div");
                            Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].distance, "class", "DIS");
                            td3.appendChild(this.departureWaypoints[i].distance);
                        }
                        this.departureWaypoints[i].base.appendChild(td3);
                    }
                    this.waypointsBody.insertBefore(this.departureWaypoints[i].base, this.enRoute);
                    this.gps.makeButton(this.departureWaypoints[i].identButton, this.waypointClick.bind(this, i, 1));
                    this.gps.makeButton(this.departureWaypoints[i].altButton, this.editAltitude.bind(this, i, 1));
                }
                this.departureWaypoints[i].index = i + (origin ? 1 : 0);
                if (!this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getActiveWaypointIndex() == this.departureWaypoints[i].index) {
                    Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].base, "state", "CurrentLeg");
                } else {
                    Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].base, "state", "Active");
                }
                const infos = departure[i].infos;
                Avionics.Utils.diffAndSet(this.departureWaypoints[i].identButton_Ident, infos.ident != "" ? infos.ident : departure[i].ident);
                Avionics.Utils.diffAndSet(this.departureWaypoints[i].identButton_Name, infos.name);
                Avionics.Utils.diffAndSet(this.departureWaypoints[i].altButton_Value, departure[i].altitudeinFP ? fastToFixed(Math.round(departure[i].altitudeinFP), 0) + "FT" : "_____FT");
                Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].altButton_Value, "altitudeMode", departure[i].altitudeModeinFP);
                const symbol = infos.imageFileName();
                Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].identButton_Logo, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
                Avionics.Utils.diffAndSet(this.departureWaypoints[i].dtk, fastToFixed(departure[i].bearingInFP, 0) + "°");
                Avionics.Utils.diffAndSet(this.departureWaypoints[i].distance, fastToFixed(departure[i].distanceInFP, 0) + "NM");
            }
        } else {
            Avionics.Utils.diffAndSet(this.origin_mainValue, "");
            Avionics.Utils.diffAndSet(this.origin_mainText, "Add Origin");
            Avionics.Utils.diffAndSetAttribute(this.origin_wayPoint.base, "state", "Inactive");
        }
        for (let i = departure.length; i < this.departureWaypoints.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.departureWaypoints[i].base, "state", "Inactive");
        }
        if (enroute.length > 0) {
            Avionics.Utils.diffAndSetAttribute(this.enRoute, "state", "Active");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.enRoute, "state", "Inactive");
        }
        for (let i = 0; i < enroute.length; i++) {
            if (this.enRouteWaypoints.length <= i) {
                this.enRouteWaypoints.push(new NavSystemTouch_FPLWaypointLine());
                this.enRouteWaypoints[i].base = document.createElement("tr");
                {
                    const td1 = document.createElement("td");
                    {
                        this.enRouteWaypoints[i].identButton = document.createElement("div");
                        {
                            Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].identButton, "class", "gradientButton Waypoint");
                            this.enRouteWaypoints[i].identButton_Ident = document.createElement("div");
                            {
                                this.enRouteWaypoints[i].identButton_Ident.setAttribute("class", "mainValue");
                            }
                            this.enRouteWaypoints[i].identButton.appendChild(this.enRouteWaypoints[i].identButton_Ident);
                            this.enRouteWaypoints[i].identButton_Name = document.createElement("div");
                            {
                                this.enRouteWaypoints[i].identButton_Name.setAttribute("class", "title");
                            }
                            this.enRouteWaypoints[i].identButton.appendChild(this.enRouteWaypoints[i].identButton_Name);
                            this.enRouteWaypoints[i].identButton_Logo = document.createElement("img");
                            {
                                this.enRouteWaypoints[i].identButton_Logo.setAttribute("class", "symbol");
                            }
                            this.enRouteWaypoints[i].identButton.appendChild(this.enRouteWaypoints[i].identButton_Logo);
                        }
                        td1.appendChild(this.enRouteWaypoints[i].identButton);
                    }
                    this.enRouteWaypoints[i].base.appendChild(td1);
                    const td2 = document.createElement("td");
                    {
                        this.enRouteWaypoints[i].altButton = document.createElement("div");
                        {
                            Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].altButton, "class", "gradientButton");
                            this.enRouteWaypoints[i].altButton_Value = document.createElement("div");
                            {
                                Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].altButton_Value, "class", "mainValue");
                                Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].altButton_Value, "_____FT");
                            }
                            this.enRouteWaypoints[i].altButton.appendChild(this.enRouteWaypoints[i].altButton_Value);
                        }
                        td2.appendChild(this.enRouteWaypoints[i].altButton);
                    }
                    this.enRouteWaypoints[i].base.appendChild(td2);
                    const td3 = document.createElement("td");
                    {
                        this.enRouteWaypoints[i].dtk = document.createElement("div");
                        Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].dtk, "class", "DTK");
                        td3.appendChild(this.enRouteWaypoints[i].dtk);
                        this.enRouteWaypoints[i].distance = document.createElement("div");
                        Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].distance, "class", "DIS");
                        td3.appendChild(this.enRouteWaypoints[i].distance);
                    }
                    this.enRouteWaypoints[i].base.appendChild(td3);
                }
                this.waypointsBody.insertBefore(this.enRouteWaypoints[i].base, this.enRouteAdd);
                this.gps.makeButton(this.enRouteWaypoints[i].identButton, this.waypointClick.bind(this, i, 2));
                this.gps.makeButton(this.enRouteWaypoints[i].altButton, this.editAltitude.bind(this, i, 2));
            }
            this.enRouteWaypoints[i].index = i + departure.length + (origin ? 1 : 0);
            if (!this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getActiveWaypointIndex() == this.enRouteWaypoints[i].index) {
                Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].base, "state", "CurrentLeg");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].base, "state", "Active");
            }
            const infos = enroute[i].infos;
            Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].identButton_Ident, infos.ident != "" ? infos.ident : enroute[i].ident);
            Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].identButton_Name, infos.name);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].altButton_Value, enroute[i].altitudeinFP ? fastToFixed(Math.round(enroute[i].altitudeinFP), 0) + "FT" : "_____FT");
            Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].altButton_Value, "altitudeMode", enroute[i].altitudeModeinFP);
            Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].identButton_Logo, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].dtk, fastToFixed(enroute[i].bearingInFP, 0) + "°");
            Avionics.Utils.diffAndSet(this.enRouteWaypoints[i].distance, fastToFixed(enroute[i].distanceInFP, 0) + "NM");
        }
        for (let i = enroute.length; i < this.enRouteWaypoints.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.enRouteWaypoints[i].base, "state", "Inactive");
        }
        if (destination) {
            if (arrival.length > 0) {
                Avionics.Utils.diffAndSet(this.destination_mainValue, "Arrival - " + this.gps.currFlightPlanManager.getArrival().name);
            } else {
                Avionics.Utils.diffAndSet(this.destination_mainValue, "Destination - " + destination.infos.ident);
            }
            Avionics.Utils.diffAndSet(this.destination_mainText, "");
            Avionics.Utils.diffAndSetAttribute(this.destination_wayPoint.base, "state", "Active");
            this.destination_wayPoint.index = this.gps.currFlightPlanManager.getWaypointsCount() - 1;
            const destinationInfo = destination.infos;
            Avionics.Utils.diffAndSet(this.destination_wayPoint.identButton_Ident, destinationInfo.ident);
            Avionics.Utils.diffAndSet(this.destination_wayPoint.identButton_Name, destinationInfo.name);
            Avionics.Utils.diffAndSet(this.destination_wayPoint.dtk, fastToFixed(destination.bearingInFP, 0) + "°");
            Avionics.Utils.diffAndSet(this.destination_wayPoint.distance, fastToFixed(destination.distanceInFP, 0) + "NM");
            Avionics.Utils.diffAndSet(this.destination_wayPoint.altButton_Value, destination.altitudeinFP ? fastToFixed(Math.round(destination.altitudeinFP), 0) + "FT" : "_____FT");
            Avionics.Utils.diffAndSetAttribute(this.destination_wayPoint.altButton_Value, "altitudeMode", destination.altitudeModeinFP);
            const symbol = destinationInfo.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.destination_wayPoint.identButton_Logo, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            for (let i = 0; i < arrival.length; i++) {
                if (this.arrivalWaypoints.length <= i) {
                    this.arrivalWaypoints.push(new NavSystemTouch_FPLWaypointLine());
                    this.arrivalWaypoints[i].base = document.createElement("tr");
                    {
                        const td1 = document.createElement("td");
                        {
                            this.arrivalWaypoints[i].identButton = document.createElement("div");
                            {
                                Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].identButton, "class", "gradientButton Waypoint");
                                this.arrivalWaypoints[i].identButton_Ident = document.createElement("div");
                                {
                                    this.arrivalWaypoints[i].identButton_Ident.setAttribute("class", "mainValue");
                                }
                                this.arrivalWaypoints[i].identButton.appendChild(this.arrivalWaypoints[i].identButton_Ident);
                                this.arrivalWaypoints[i].identButton_Name = document.createElement("div");
                                {
                                    this.arrivalWaypoints[i].identButton_Name.setAttribute("class", "title");
                                }
                                this.arrivalWaypoints[i].identButton.appendChild(this.arrivalWaypoints[i].identButton_Name);
                                this.arrivalWaypoints[i].identButton_Logo = document.createElement("img");
                                {
                                    this.arrivalWaypoints[i].identButton_Logo.setAttribute("class", "symbol");
                                }
                                this.arrivalWaypoints[i].identButton.appendChild(this.arrivalWaypoints[i].identButton_Logo);
                            }
                            td1.appendChild(this.arrivalWaypoints[i].identButton);
                        }
                        this.arrivalWaypoints[i].base.appendChild(td1);
                        const td2 = document.createElement("td");
                        {
                            this.arrivalWaypoints[i].altButton = document.createElement("div");
                            {
                                Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].altButton, "class", "gradientButton");
                                this.arrivalWaypoints[i].altButton_Value = document.createElement("div");
                                {
                                    Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].altButton_Value, "class", "mainValue");
                                    Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].altButton_Value, "_____FT");
                                }
                                this.arrivalWaypoints[i].altButton.appendChild(this.arrivalWaypoints[i].altButton_Value);
                            }
                            td2.appendChild(this.arrivalWaypoints[i].altButton);
                        }
                        this.arrivalWaypoints[i].base.appendChild(td2);
                        const td3 = document.createElement("td");
                        {
                            this.arrivalWaypoints[i].dtk = document.createElement("div");
                            Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].dtk, "class", "DTK");
                            td3.appendChild(this.arrivalWaypoints[i].dtk);
                            this.arrivalWaypoints[i].distance = document.createElement("div");
                            Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].distance, "class", "DIS");
                            td3.appendChild(this.arrivalWaypoints[i].distance);
                        }
                        this.arrivalWaypoints[i].base.appendChild(td3);
                    }
                    this.waypointsBody.insertBefore(this.arrivalWaypoints[i].base, this.destination_wayPoint.base);
                    this.gps.makeButton(this.arrivalWaypoints[i].identButton, this.waypointClick.bind(this, i, 3));
                    this.gps.makeButton(this.arrivalWaypoints[i].altButton, this.editAltitude.bind(this, i, 3));
                }
                this.arrivalWaypoints[i].index = i + departure.length + (origin ? 1 : 0) + enroute.length;
                if (!this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getActiveWaypointIndex() == this.arrivalWaypoints[i].index) {
                    Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].base, "state", "CurrentLeg");
                } else {
                    Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].base, "state", "Active");
                }
                const infos = arrival[i].infos;
                Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].identButton_Ident, infos.ident != "" ? infos.ident : arrival[i].ident);
                Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].identButton_Name, infos.name);
                const symbol = infos.imageFileName();
                Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].altButton_Value, arrival[i].altitudeinFP ? fastToFixed(Math.round(arrival[i].altitudeinFP), 0) + "FT" : "_____FT");
                Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].altButton_Value, "altitudeMode", arrival[i].altitudeModeinFP);
                Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].identButton_Logo, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
                Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].dtk, fastToFixed(arrival[i].bearingInFP, 0) + "°");
                Avionics.Utils.diffAndSet(this.arrivalWaypoints[i].distance, fastToFixed(arrival[i].distanceInFP, 0) + "NM");
            }
            if (approach && approach.length > 0) {
                Avionics.Utils.diffAndSet(this.approach_mainValue, "Approach - " + approachInfos.name);
                for (let i = 0; i < approach.length; i++) {
                    if (i >= this.approachWaypoints.length) {
                        this.approachWaypoints.push(new NavSystemTouch_FPLWaypointLine());
                        this.approachWaypoints[i].base = document.createElement("tr");
                        {
                            const td1 = document.createElement("td");
                            {
                                this.approachWaypoints[i].identButton = document.createElement("div");
                                {
                                    Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].identButton, "class", "gradientButton Waypoint");
                                    this.approachWaypoints[i].identButton_Ident = document.createElement("div");
                                    {
                                        this.approachWaypoints[i].identButton_Ident.setAttribute("class", "mainValue");
                                    }
                                    this.approachWaypoints[i].identButton.appendChild(this.approachWaypoints[i].identButton_Ident);
                                    this.approachWaypoints[i].identButton_Name = document.createElement("div");
                                    {
                                        this.approachWaypoints[i].identButton_Name.setAttribute("class", "title");
                                    }
                                    this.approachWaypoints[i].identButton.appendChild(this.approachWaypoints[i].identButton_Name);
                                    this.approachWaypoints[i].identButton_Logo = document.createElement("img");
                                    {
                                        this.approachWaypoints[i].identButton_Logo.setAttribute("class", "symbol");
                                    }
                                    this.approachWaypoints[i].identButton.appendChild(this.approachWaypoints[i].identButton_Logo);
                                }
                                td1.appendChild(this.approachWaypoints[i].identButton);
                            }
                            this.approachWaypoints[i].base.appendChild(td1);
                            const td2 = document.createElement("td");
                            {
                                this.approachWaypoints[i].altButton = document.createElement("div");
                                {
                                    Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].altButton, "class", "gradientButton");
                                    this.approachWaypoints[i].altButton_Value = document.createElement("div");
                                    {
                                        Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].altButton_Value, "class", "mainValue");
                                        Avionics.Utils.diffAndSet(this.approachWaypoints[i].altButton_Value, "_____FT");
                                    }
                                    this.approachWaypoints[i].altButton.appendChild(this.approachWaypoints[i].altButton_Value);
                                }
                                td2.appendChild(this.approachWaypoints[i].altButton);
                            }
                            this.approachWaypoints[i].base.appendChild(td2);
                            const td3 = document.createElement("td");
                            {
                                this.approachWaypoints[i].dtk = document.createElement("div");
                                Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].dtk, "class", "DTK");
                                td3.appendChild(this.approachWaypoints[i].dtk);
                                this.approachWaypoints[i].distance = document.createElement("div");
                                Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].distance, "class", "DIS");
                                td3.appendChild(this.approachWaypoints[i].distance);
                            }
                            this.approachWaypoints[i].base.appendChild(td3);
                        }
                        this.waypointsBody.appendChild(this.approachWaypoints[i].base);
                        this.gps.makeButton(this.approachWaypoints[i].identButton, this.waypointClick.bind(this, i, 5));
                        this.gps.makeButton(this.approachWaypoints[i].altButton, this.editAltitude.bind(this, i, 5));
                    }
                    this.approachWaypoints[i].index = i;
                    if (this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getActiveWaypointIndex() == this.approachWaypoints[i].index) {
                        Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].base, "state", "CurrentLeg");
                    } else {
                        Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].base, "state", "Active");
                    }
                    const infos = approach[i];
                    Avionics.Utils.diffAndSet(this.approachWaypoints[i].identButton_Ident, infos.ident);
                    Avionics.Utils.diffAndSet(this.approachWaypoints[i].identButton_Name, infos.ident);
                    Avionics.Utils.diffAndSet(this.approachWaypoints[i].altButton_Value, approach[i].altitudeinFP ? fastToFixed(approach[i].altitudeinFP, 0) + "FT" : "_____FT");
                    Avionics.Utils.diffAndSet(this.approachWaypoints[i].dtk, infos.bearingInFP ? fastToFixed(infos.bearingInFP, 0) + "°" : "");
                    Avionics.Utils.diffAndSet(this.approachWaypoints[i].distance, infos.distanceInFP ? fastToFixed(infos.distanceInFP, 0) + "NM" : "");
                }
                for (let i = approach.length; i < this.approachWaypoints.length; i++) {
                    Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].base, "state", "Inactive");
                }
                Avionics.Utils.diffAndSetAttribute(this.approach, "state", "Active");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.approach, "state", "Inactive");
                for (let i = 0; i < this.approachWaypoints.length; i++) {
                    Avionics.Utils.diffAndSetAttribute(this.approachWaypoints[i].base, "state", "Inactive");
                }
            }
        } else {
            Avionics.Utils.diffAndSet(this.destination_mainValue, "");
            Avionics.Utils.diffAndSet(this.destination_mainText, "Add Destination");
            Avionics.Utils.diffAndSetAttribute(this.destination_wayPoint.base, "state", "Inactive");
            Avionics.Utils.diffAndSetAttribute(this.approach, "state", "Inactive");
        }
        for (let i = arrival.length; i < this.arrivalWaypoints.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.arrivalWaypoints[i].base, "state", "Inactive");
        }
        if (this.gps.currFlightPlanManager.getActiveWaypointIndex() > 0 && origin != null) {
            const activeIndex = this.gps.currFlightPlanManager.getActiveWaypointIndex();
            const beginElement = (this.gps.currFlightPlanManager.isActiveApproach() ? activeIndex > 0 ? this.approachWaypoints[activeIndex - 1].base : null :
                activeIndex == 1 ? this.origin_wayPoint.base :
                    activeIndex <= departure.length + 1 ? this.departureWaypoints[activeIndex - 2].base :
                        activeIndex <= departure.length + enroute.length + (origin ? 1 : 0) ? this.enRouteWaypoints[activeIndex - departure.length - (origin ? 1 : 0) - 1].base :
                            activeIndex <= departure.length + enroute.length + (origin ? 1 : 0) + arrival.length ? this.arrivalWaypoints[activeIndex - departure.length - (origin ? 1 : 0) - enroute.length - 1].base :
                                null);
            const endElement = (this.gps.currFlightPlanManager.isActiveApproach() ? this.approachWaypoints[activeIndex].base :
                activeIndex < departure.length + 1 ? this.departureWaypoints[activeIndex - 1].base :
                    activeIndex < departure.length + enroute.length + (origin ? 1 : 0) ? this.enRouteWaypoints[activeIndex - departure.length - (origin ? 1 : 0)].base :
                        activeIndex < departure.length + enroute.length + (origin ? 1 : 0) + arrival.length ? this.arrivalWaypoints[activeIndex - departure.length - (origin ? 1 : 0) - enroute.length].base :
                            destination ? this.destination_wayPoint.base :
                                null);
            if (beginElement && endElement) {
                const x = beginElement.offsetLeft + this.arrowLeftOffset;
                const y1 = beginElement.offsetTop + this.arrowTopOffset;
                const y2 = endElement.offsetTop + this.arrowTopOffset;
                const lineWidth = this.arrowLineWidth;
                const lineDistance = this.arrowLineDistance;
                const headWidth = this.arrowHeadWidth;
                Avionics.Utils.diffAndSetAttribute(this.CurrentLegArrow, "d", "M" + x + " " + (y1 - lineWidth / 2) + " L" + x + " " + (y1 + lineWidth / 2) + " L" + (x - lineDistance) + " " + (y1 + lineWidth / 2) + " L" + (x - lineDistance) + " " + (y2 - lineWidth / 2) + " L" + (x - headWidth) + " " + (y2 - lineWidth / 2) + " L" + (x - headWidth) + " " + (y2 - lineWidth * 1.5) + " L" + x + " " + y2 + " L" + (x - headWidth) + " " + (y2 + lineWidth * 1.5) + " L" + (x - headWidth) + " " + (y2 + lineWidth / 2) + " L" + (x - lineDistance - lineWidth) + " " + (y2 + lineWidth / 2) + " L" + (x - lineDistance - lineWidth) + " " + (y1 - lineWidth / 2) + "Z");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.CurrentLegArrow, "d", "");
            }
        } else {
            Avionics.Utils.diffAndSetAttribute(this.CurrentLegArrow, "d", "");
        }
        this.updateAltitudeRoles();
    }
    updateAltitudeRoles() {
        let maxAltitude = undefined;
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount() - 1; i >= 0; i--) {
            const wp = this.gps.currFlightPlanManager.getWaypoint(i);
            if (wp != undefined) {
                if (maxAltitude == undefined || wp.altitudeinFP > maxAltitude) {
                    if (wp.altitudeModeinFP == "Subdued") {
                        this.gps.currFlightPlanManager.setWaypointAdditionalData(i, "ALTITUDE_MODE", "Manual");
                    }
                    maxAltitude = wp.altitudeinFP;
                }
                if (wp.altitudeinFP < maxAltitude) {
                    if (wp.altitudeModeinFP == "Manual") {
                        this.gps.currFlightPlanManager.setWaypointAdditionalData(i, "ALTITUDE_MODE", "Subdued");
                    }
                }
            }
        }
    }
    updateWaypoint(_waypoint, _elements) {
        const infos = _waypoint.GetInfos();
        Avionics.Utils.diffAndSet(_elements.identButton_Ident, infos.ident);
        Avionics.Utils.diffAndSet(_elements.identButton_Name, infos.name);
        Avionics.Utils.diffAndSet(_elements.altButton_Value, _waypoint.altitudeinFP ? fastToFixed(Math.round(_waypoint.altitudeinFP), 0) + "FT" : "_____FT");
        Avionics.Utils.diffAndSetAttribute(_elements.altButton_Value, "altitudeMode", _waypoint.altitudeModeinFP);
    }
    originWaypointClick() {
        if (this.selectedGroup == 0 && this.currentMenu == 1) {
            this.closeMenu();
        } else {
            this.unselectLastButton();
            this.origin_wayPoint.identButton.setAttribute("state", "SelectedWP");
            this.flightPlanDiv.setAttribute("displayedMenu", "Waypoint");
            this.currentMenu = 1;
            this.selectedGroup = 0;
            this.selectedWaypoint = 0;
            this.selectedElement = this.origin_wayPoint;
            this.updateMenu();
        }
    }
    waypointClick(_index, _phase = 2) {
        if (this.selectedWaypoint == _index && this.selectedGroup == _phase && this.currentMenu == 1) {
            this.closeMenu();
        } else {
            this.unselectLastButton();
            switch (_phase) {
                case 1:
                    this.selectedElement = this.departureWaypoints[_index];
                    break;
                case 2:
                    this.selectedElement = this.enRouteWaypoints[_index];
                    break;
                case 3:
                    this.selectedElement = this.arrivalWaypoints[_index];
                    break;
                case 5:
                    this.selectedElement = this.approachWaypoints[_index];
                    break;
            }
            this.selectedElement.identButton.setAttribute("state", "SelectedWP");
            this.flightPlanDiv.setAttribute("displayedMenu", "Waypoint");
            this.currentMenu = 1;
            this.selectedWaypoint = _index;
            this.selectedGroup = _phase;
            this.updateMenu();
        }
    }
    destinationWaypointClick() {
        if (this.selectedGroup == 4 && this.currentMenu == 1) {
            this.closeMenu();
        } else {
            this.unselectLastButton();
            this.destination_wayPoint.identButton.setAttribute("state", "SelectedWP");
            this.flightPlanDiv.setAttribute("displayedMenu", "Waypoint");
            this.currentMenu = 1;
            this.selectedGroup = 4;
            this.selectedWaypoint = 0;
            this.selectedElement = this.destination_wayPoint;
            this.updateMenu();
        }
    }
    getSelectedIndex() {
        const departureLength = this.gps.currFlightPlanManager.getDepartureWaypointsMap().length;
        switch (this.selectedGroup) {
            case 0:
                return 0;
                break;
            case 1:
                return 1 + this.selectedWaypoint;
                break;
            case 2:
                return 1 + departureLength + this.selectedWaypoint;
                break;
            case 3:
                return 1 + departureLength + this.gps.currFlightPlanManager.getEnRouteWaypoints().length + this.selectedWaypoint;
                break;
            case 4:
                return this.gps.currFlightPlanManager.getWaypointsCount() - 1;
                break;
            case 5:
                return this.selectedWaypoint;
                break;
        }
    }
    insertBefore() {
        this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.insertBeforeEndKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
    }
    insertBeforeEndKeyboard(_icao) {
        this.gps.currFlightPlanManager.addWaypoint(_icao, this.getSelectedIndex());
        this.closeMenu();
    }
    insertAfter() {
        this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.insertAfterEndKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
    }
    insertAfterEndKeyboard(_icao) {
        this.gps.currFlightPlanManager.addWaypoint(_icao, this.getSelectedIndex() + 1);
        this.closeMenu();
    }
    destinationClick() {
        if (this.gps.currFlightPlanManager.getWaypointsCount() < 2) {
            this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.insertDestinationEndKeyboard.bind(this));
            this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
        } else {
            if (this.currentMenu == 2) {
                this.closeMenu();
                this.destination.setAttribute("state", "");
            } else {
                this.unselectLastButton();
                this.destination.setAttribute("state", "SelectedWP");
                this.flightPlanDiv.setAttribute("displayedMenu", "Destination");
                this.currentMenu = 2;
                this.selectedWaypoint = -1;
                this.updateMenu();
            }
        }
    }
    insertDestinationEndKeyboard(_icao) {
        this.gps.currFlightPlanManager.setDestination(_icao, () => {
            this.updateDisplay();
        });
    }
    originClick() {
        if (this.gps.currFlightPlanManager.getWaypointsCount() < 1) {
            this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.insertOriginEndKeyboard.bind(this));
            this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
        } else {
            if (this.currentMenu == 3) {
                this.closeMenu();
                this.origin.setAttribute("state", "");
            } else {
                this.unselectLastButton();
                this.origin.setAttribute("state", "SelectedWP");
                this.flightPlanDiv.setAttribute("displayedMenu", "Origin");
                this.currentMenu = 3;
                this.selectedWaypoint = -1;
                this.updateMenu();
            }
        }
    }
    insertOriginEndKeyboard(_icao) {
        if (_icao != "") {
            this.gps.currFlightPlanManager.setOrigin(_icao, () => {
                this.updateDisplay();
            });
        }
    }
    directTo() {
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    activateLegTo() {
        if (this.selectedGroup === 5) {
            const icao = this.gps.currFlightPlanManager.getApproachWaypoints()[this.selectedElement.index].icao;
            this.gps.currFlightPlanManager.activateApproach(() => {
                const index = this.gps.currFlightPlanManager.getApproachWaypoints().findIndex(w => {
                    return w.infos && w.infos.icao === icao;
                });
                this.gps.currFlightPlanManager.setActiveWaypointIndex(index);
            });
        } else {
            this.gps.currFlightPlanManager.setActiveWaypointIndex(this.selectedElement.index);
        }
    }
    waypointInfo() {
    }
    updateMenu() {
        if (this.currentMenu == 1) {
            if (this.selectedGroup == 0) {
                Avionics.Utils.diffAndSetAttribute(this.insertBefore_Button, "state", "Greyed");
                Avionics.Utils.diffAndSetAttribute(this.insertAfter_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.activateLegTo_Button, "state", "Greyed");
                Avionics.Utils.diffAndSetAttribute(this.removeWaypoint_Button, "state", "None");
            } else if (this.selectedGroup == 4) {
                Avionics.Utils.diffAndSetAttribute(this.insertBefore_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.insertAfter_Button, "state", "Greyed");
                Avionics.Utils.diffAndSetAttribute(this.activateLegTo_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.removeWaypoint_Button, "state", "None");
            } else if (this.selectedGroup == 5) {
                Avionics.Utils.diffAndSetAttribute(this.insertBefore_Button, "state", "Greyed");
                Avionics.Utils.diffAndSetAttribute(this.insertAfter_Button, "state", "Greyed");
                Avionics.Utils.diffAndSetAttribute(this.activateLegTo_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.removeWaypoint_Button, "state", "Greyed");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.insertBefore_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.insertAfter_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.activateLegTo_Button, "state", "None");
                Avionics.Utils.diffAndSetAttribute(this.removeWaypoint_Button, "state", "None");
            }
        }
    }
    removeWaypoint() {
        this.gps.currFlightPlanManager.removeWaypoint(this.getSelectedIndex());
        this.closeMenu();
    }
    addEnroute() {
        this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.addEnrouteEndKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
    }
    addEnrouteEndKeyboard(_icao) {
        let position = this.gps.currFlightPlanManager.getOrigin() ? 1 : 0;
        position += this.gps.currFlightPlanManager.getDepartureWaypointsMap().length;
        position += this.gps.currFlightPlanManager.getEnRouteWaypoints().length;
        position == 1;
        this.gps.currFlightPlanManager.addWaypoint(_icao, position);
    }
    enrouteDone() {
        Avionics.Utils.diffAndSetAttribute(this.AFPL_EnRouteAdd, "state", "Inactive");
    }
    editAltitude(_index, _group) {
        this.selectedGroup = _group;
        this.selectedWaypoint = _index;
        this.altitudeKeyboard.element.setContext(this.onEndAltitudeEdition.bind(this), this.container, Math.round(this.gps.currFlightPlanManager.getWaypoints()[_index].altitudeinFP));
        this.gps.switchToPopUpPage(this.altitudeKeyboard);
    }
    onEndAltitudeEdition(_altitude) {
        const index = this.getSelectedIndex();
        this.gps.currFlightPlanManager.setWaypointAdditionalData(index, "ALTITUDE_MODE", "Manual");
        this.gps.currFlightPlanManager.setWaypointAltitude(_altitude / 3.2808, index, this.updateDisplay.bind(this));
    }
    scrollUp() {
        if (this.currentMenu == 1) {
            if (this.selectedWaypoint == 0) {
                let ok = false;
                let length;
                this.unselectLastButton();
                do {
                    switch (this.selectedGroup) {
                        case 0:
                            ok = true;
                            this.origin_wayPoint.identButton.setAttribute("state", "SelectedWP");
                            break;
                        case 1:
                            this.selectedGroup = 0;
                            this.selectedWaypoint = 0;
                            this.selectedElement = this.origin_wayPoint;
                            this.origin_wayPoint.identButton.setAttribute("state", "SelectedWP");
                            ok = true;
                            break;
                        case 2:
                            this.selectedGroup = 1;
                            length = this.gps.currFlightPlanManager.getDepartureWaypointsMap().length;
                            if (length > 0) {
                                this.selectedWaypoint = length - 1;
                                this.selectedElement = this.departureWaypoints[this.selectedWaypoint];
                                this.departureWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                                ok = true;
                            }
                            break;
                        case 3:
                            this.selectedGroup = 2;
                            length = this.gps.currFlightPlanManager.getEnRouteWaypoints().length;
                            if (length > 0) {
                                this.selectedWaypoint = length - 1;
                                this.selectedElement = this.enRouteWaypoints[this.selectedWaypoint];
                                this.enRouteWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                                ok = true;
                            }
                            break;
                        case 4:
                            this.selectedGroup = 3;
                            length = this.gps.currFlightPlanManager.getArrivalWaypointsMap().length;
                            if (length > 0) {
                                this.selectedWaypoint = length - 1;
                                this.selectedElement = this.arrivalWaypoints[this.selectedWaypoint];
                                this.arrivalWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                                ok = true;
                            }
                            break;
                        case 5:
                            this.selectedGroup = 4;
                            if (this.gps.currFlightPlanManager.getDestination()) {
                                this.selectedWaypoint = 0;
                                this.selectedElement = this.destination_wayPoint;
                                this.destination_wayPoint.identButton.setAttribute("state", "SelectedWP");
                                ok = true;
                            }
                            break;
                    }
                } while (!ok);
            } else {
                this.scrollElement.scrollUp(true);
                this.unselectLastButton();
                this.selectedWaypoint--;
                switch (this.selectedGroup) {
                    case 1:
                        this.selectedElement = this.departureWaypoints[this.selectedWaypoint];
                        this.departureWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                        break;
                    case 2:
                        this.selectedElement = this.enRouteWaypoints[this.selectedWaypoint];
                        this.enRouteWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                        break;
                    case 3:
                        this.selectedElement = this.arrivalWaypoints[this.selectedWaypoint];
                        this.arrivalWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                        break;
                    case 5:
                        this.selectedElement = this.approachWaypoints[this.selectedWaypoint];
                        this.approachWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                        break;
                }
            }
            this.updateMenu();
        } else {
            this.scrollElement.scrollUp();
        }
    }
    scrollDown() {
        if (this.currentMenu == 1) {
            let isOk = false;
            let length;
            this.unselectLastButton();
            do {
                switch (this.selectedGroup) {
                    case 0:
                        this.selectedGroup = 1;
                        if (this.gps.currFlightPlanManager.getDepartureWaypointsMap().length > 0) {
                            isOk = true;
                            this.selectedWaypoint = 0;
                            this.selectedElement = this.departureWaypoints[0];
                            this.departureWaypoints[0].identButton.setAttribute("state", "SelectedWP");
                        }
                        break;
                    case 1:
                        length = this.gps.currFlightPlanManager.getDepartureWaypointsMap().length;
                        if (this.selectedWaypoint == length - 1 || length == 0) {
                            this.selectedGroup = 2;
                            if (this.gps.currFlightPlanManager.getEnRouteWaypoints().length > 0) {
                                isOk = true;
                                this.selectedWaypoint = 0;
                                this.selectedElement = this.enRouteWaypoints[0];
                                this.enRouteWaypoints[0].identButton.setAttribute("state", "SelectedWP");
                            }
                        } else {
                            this.selectedWaypoint++;
                            this.departureWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                            this.selectedElement = this.departureWaypoints[this.selectedWaypoint];
                            isOk = true;
                        }
                        break;
                    case 2:
                        length = this.gps.currFlightPlanManager.getEnRouteWaypoints().length;
                        if (this.selectedWaypoint == length - 1 || length == 0) {
                            this.selectedGroup = 3;
                            if (this.gps.currFlightPlanManager.getArrivalWaypointsMap().length > 0) {
                                isOk = true;
                                this.selectedWaypoint = 0;
                                this.selectedElement = this.arrivalWaypoints[0];
                                this.arrivalWaypoints[0].identButton.setAttribute("state", "SelectedWP");
                            }
                        } else {
                            this.selectedWaypoint++;
                            this.enRouteWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                            this.selectedElement = this.enRouteWaypoints[this.selectedWaypoint];
                            isOk = true;
                        }
                        break;
                    case 3:
                        length = this.gps.currFlightPlanManager.getArrivalWaypointsMap().length;
                        if (this.selectedWaypoint == length - 1 || length == 0) {
                            this.selectedGroup = 4;
                            if (this.gps.currFlightPlanManager.getDestination()) {
                                isOk = true;
                                this.selectedWaypoint = 0;
                                this.selectedElement = this.destination_wayPoint;
                                this.destination_wayPoint.identButton.setAttribute("state", "SelectedWP");
                            }
                        } else {
                            this.selectedWaypoint++;
                            this.arrivalWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                            this.selectedElement = this.arrivalWaypoints[this.selectedWaypoint];
                            isOk = true;
                        }
                        break;
                    case 4:
                        this.selectedGroup = 5;
                        if (length > 0) {
                            isOk = true;
                            this.selectedWaypoint = 0;
                            this.selectedElement = this.approachWaypoints[0];
                            this.destination_wayPoint.identButton.setAttribute("state", "SelectedWP");
                        }
                        break;
                    case 5:
                        length = this.gps.currFlightPlanManager.getApproachWaypoints().length;
                        if (!(this.selectedWaypoint == length - 1) && !(length == 0)) {
                            this.selectedWaypoint++;
                            this.approachWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "SelectedWP");
                            this.selectedElement = this.arrivalWaypoints[this.selectedWaypoint];
                            isOk = true;
                        }
                        break;
                }
            } while (!isOk);
            this.scrollElement.scrollDown(true);
            this.updateMenu();
        } else {
            this.scrollElement.scrollDown();
        }
    }
    back() {
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    unselectLastButton() {
        if (this.currentMenu == 1) {
            if (this.selectedGroup == 0) {
                this.origin_wayPoint.identButton.setAttribute("state", "None");
            } else if (this.selectedGroup == 1) {
                this.departureWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "None");
            } else if (this.selectedGroup == 2) {
                this.enRouteWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "None");
            } else if (this.selectedGroup == 3) {
                this.arrivalWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "None");
            } else if (this.selectedGroup == 4) {
                this.destination_wayPoint.identButton.setAttribute("state", "None");
            } else if (this.selectedGroup == 5) {
                this.approachWaypoints[this.selectedWaypoint].identButton.setAttribute("state", "None");
            } else {
            }
        } else if (this.currentMenu == 2) {
            this.destination.setAttribute("state", "");
        } else if (this.currentMenu == 3) {
            this.origin.setAttribute("state", "");
        }
    }
    closeMenu() {
        this.unselectLastButton();
        this.flightPlanDiv.setAttribute("displayedMenu", "None");
        this.currentMenu = 0;
    }
    selectOrigin() {
        this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.selectOriginEndKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
    }
    selectOriginEndKeyboard(_icao) {
        this.gps.currFlightPlanManager.removeDeparture(() => {
            this.gps.currFlightPlanManager.removeWaypoint(0, true, () => {
                this.gps.currFlightPlanManager.addWaypoint(_icao, 0, () => {
                    this.closeMenu();
                });
            });
        });
    }
    selectDestination() {
        this.gps.getFullKeyboard().getElementOfType(NavSystemTouch_FullKeyboard).setContext(this.selectDestinationEndKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.getFullKeyboard());
    }
    selectDestinationEndKeyboard(_icao) {
        this.gps.currFlightPlanManager.removeArrival(() => {
            this.gps.currFlightPlanManager.setApproachIndex(-1, () => {
                this.gps.currFlightPlanManager.removeWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1, true, () => {
                    this.gps.currFlightPlanManager.addWaypoint(_icao, this.gps.currFlightPlanManager.getWaypointsCount(), () => {
                        this.closeMenu();
                    });
                });
            });
        });
    }
}
class NavSystemTouch_Procedures extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.reloadCounter = 0;
    }
    init(root) {
        this.departureButton = this.gps.getChildById("Procedures_Departure");
        this.departureButton_value = this.departureButton.getElementsByClassName("value")[0];
        this.arrivalButton = this.gps.getChildById("Procedures_Arrival");
        this.arrivalButton_value = this.arrivalButton.getElementsByClassName("value")[0];
        this.approachButton = this.gps.getChildById("Procedures_Approach");
        this.approachButton_value = this.approachButton.getElementsByClassName("value")[0];
        this.activateApproachButton = this.gps.getChildById("Procedures_ActivateApproach");
        this.gps.makeButton(this.departureButton, this.openDeparture.bind(this));
        this.gps.makeButton(this.arrivalButton, this.openArrival.bind(this));
        this.gps.makeButton(this.approachButton, this.openApproach.bind(this));
        this.gps.makeButton(this.activateApproachButton, this.activateApproach.bind(this));
    }
    openDeparture() {
        this.gps.SwitchToPageName("MFD", "Departure Selection");
    }
    openArrival() {
        this.gps.SwitchToPageName("MFD", "Arrival Selection");
    }
    openApproach() {
        this.gps.SwitchToPageName("MFD", "Approach Selection");
    }
    activateApproach() {
        this.gps.currFlightPlanManager.activateApproach();
    }
    onEnter() {
        this.gps.currFlightPlanManager.updateFlightPlan();
        this.gps.currFlightPlanManager.updateCurrentApproach();
    }
    onUpdate(_deltaTime) {
        this.reloadCounter++;
        if (this.reloadCounter > 30) {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.currFlightPlanManager.updateCurrentApproach();
            this.reloadCounter = 0;
        }
        const departure = this.gps.currFlightPlanManager.getDeparture();
        if (departure) {
            Avionics.Utils.diffAndSet(this.departureButton_value, departure.name);
        } else {
            Avionics.Utils.diffAndSet(this.departureButton_value, "____");
        }
        const arrival = this.gps.currFlightPlanManager.getArrival();
        if (arrival) {
            Avionics.Utils.diffAndSet(this.arrivalButton_value, arrival.name);
        } else {
            Avionics.Utils.diffAndSet(this.arrivalButton_value, "____");
        }
        const approach = this.gps.currFlightPlanManager.getAirportApproach();
        if (approach) {
            Avionics.Utils.diffAndSet(this.approachButton_value, approach.name);
        } else {
            Avionics.Utils.diffAndSet(this.approachButton_value, "____");
        }
        Avionics.Utils.diffAndSetAttribute(this.activateApproachButton, "state", this.gps.currFlightPlanManager.isLoadedApproach() ? "" : "Greyed");
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class NavSystemTouch_DepartureSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedDeparture = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.sequenceElements = [];
    }
    init(root) {
        this.airport = this.gps.getChildById("Departure_Airport");
        this.airportIdent = this.airport.getElementsByClassName("ident")[0];
        this.airportName = this.airport.getElementsByClassName("name")[0];
        this.departure = this.gps.getChildById("Departure_Departure");
        this.departureValue = this.departure.getElementsByClassName("value")[0];
        this.transition = this.gps.getChildById("Departure_Transition");
        this.transitionValue = this.transition.getElementsByClassName("value")[0];
        this.runway = this.gps.getChildById("Departure_Runway");
        this.runwayValue = this.runway.getElementsByClassName("value")[0];
        this.remove = this.gps.getChildById("Departure_Remove");
        this.load = this.gps.getChildById("Departure_Load");
        this.sequence = this.gps.getChildById("Departure_Sequence");
        this.sequenceContent = this.sequence.getElementsByClassName("content")[0];
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.sequenceContent;
        this.gps.makeButton(this.departure, this.openDepartureList.bind(this));
        this.gps.makeButton(this.transition, this.openEnrouteTransitionList.bind(this));
        this.gps.makeButton(this.runway, this.openRunwayList.bind(this));
        this.gps.makeButton(this.load, this.loadDeparture.bind(this));
        this.gps.makeButton(this.remove, this.removeDeparture.bind(this));
    }
    openDepartureList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            if (infos.departures && infos.departures.length > 0) {
                for (let i = 0; i < infos.departures.length; i++) {
                    strings.push(infos.departures[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Departure", strings, this.selectDeparture.bind(this));
            }
        }
    }
    close() {
    }
    removeDeparture() {
        if (this.gps.currFlightPlanManager.getDeparture() != null) {
            this.gps.currFlightPlanManager.removeDeparture();
            this.close();
        }
    }
    loadDeparture() {
        if (this.selectedAirport) {
            this.gps.currFlightPlanManager.setDepartureProcIndex(this.selectedDeparture, () => {
                this.gps.currFlightPlanManager.setDepartureEnRouteTransitionIndex(this.selectedTransition, () => {
                    this.gps.currFlightPlanManager.setDepartureRunwayIndex(this.selectedRunway, () => {
                        this.close();
                    });
                });
            });
        }
    }
    selectDeparture(_index) {
        this.selectedDeparture = _index;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
    }
    getSelectedDeparture(airport) {
        if (airport && airport.departures && this.selectedDeparture >= 0 && airport.departures.length > this.selectedDeparture) {
            return airport.departures[this.selectedDeparture];
        }
        return null;
    }
    openEnrouteTransitionList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            const departure = this.getSelectedDeparture(infos);
            if (departure && departure.enRouteTransitions && departure.enRouteTransitions.length > 0) {
                for (let i = 0; i < departure.enRouteTransitions.length; i++) {
                    strings.push(departure.enRouteTransitions[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Transition", strings, this.selectEnrouteTransition.bind(this));
            }
        }
    }
    selectEnrouteTransition(_index) {
        this.selectedTransition = _index;
    }
    openRunwayList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            const departure = this.getSelectedDeparture(infos);
            if (departure && departure.runwayTransitions && departure.runwayTransitions.length > 0) {
                for (let i = 0; i < departure.runwayTransitions.length; i++) {
                    strings.push(departure.runwayTransitions[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Runway", strings, this.selectRunway.bind(this));
            }
        }
    }
    selectRunway(_index) {
        this.selectedRunway = _index;
    }
    onEnter() {
        this.selectedAirport = this.gps.currFlightPlanManager.getOrigin();
        if (this.selectedAirport) {
            this.selectedAirport.UpdateInfos();
        }
    }
    onUpdate(_deltaTime) {
        this.scrollElement.update();
        if (this.gps.currFlightPlanManager.getDeparture() != null) {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "Greyed");
        }
        if (this.selectedAirport) {
            Avionics.Utils.diffAndSetAttribute(this.load, "state", "");
            const infos = this.selectedAirport.GetInfos();
            const departure = this.getSelectedDeparture(infos);
            Avionics.Utils.diffAndSet(this.airportIdent, infos.ident);
            Avionics.Utils.diffAndSet(this.airportName, infos.name);
            if (departure) {
                Avionics.Utils.diffAndSet(this.departureValue, departure.name);
                if (departure.enRouteTransitions && this.selectedTransition >= 0 && this.selectedTransition < departure.enRouteTransitions.length) {
                    Avionics.Utils.diffAndSet(this.transitionValue, departure.enRouteTransitions[this.selectedTransition].name);
                } else {
                    Avionics.Utils.diffAndSet(this.transitionValue, "None");
                }
                if (departure.runwayTransitions && this.selectedRunway >= 0 && this.selectedRunway < departure.runwayTransitions.length) {
                    Avionics.Utils.diffAndSet(this.runwayValue, departure.runwayTransitions[this.selectedRunway].name);
                } else {
                    Avionics.Utils.diffAndSet(this.runwayValue, "All");
                }
            } else {
                Avionics.Utils.diffAndSetAttribute(this.load, "state", "Greyed");
                Avionics.Utils.diffAndSet(this.departureValue, "None");
                Avionics.Utils.diffAndSet(this.transitionValue, "None");
                Avionics.Utils.diffAndSet(this.runwayValue, "None");
            }
            let offset = 0;
            if (departure) {
                if (departure.runwayTransitions && this.selectedRunway >= 0 && this.selectedRunway < departure.runwayTransitions.length) {
                    for (let i = 0; i < departure.runwayTransitions[this.selectedRunway].legs.length; i++) {
                        if (offset + i >= this.sequenceElements.length) {
                            const elem = document.createElement("div");
                            this.sequenceContent.appendChild(elem);
                            this.sequenceElements.push(elem);
                        }
                        Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Active");
                        Avionics.Utils.diffAndSet(this.sequenceElements[i], departure.runwayTransitions[this.selectedRunway].legs[i].fixIcao.substr(7, 5));
                    }
                    offset += departure.runwayTransitions[this.selectedRunway].legs.length;
                }
                for (let i = 0; i < departure.commonLegs.length; i++) {
                    if (offset + i >= this.sequenceElements.length) {
                        const elem = document.createElement("div");
                        this.sequenceContent.appendChild(elem);
                        this.sequenceElements.push(elem);
                    }
                    Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                    Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], departure.commonLegs[i].fixIcao.substr(7, 5));
                }
                offset += departure.commonLegs.length;
                if (departure.enRouteTransitions && this.selectedTransition >= 0 && this.selectedTransition < departure.enRouteTransitions.length) {
                    for (let i = 0; i < departure.enRouteTransitions[this.selectedTransition].legs.length; i++) {
                        if (offset + i >= this.sequenceElements.length) {
                            const elem = document.createElement("div");
                            this.sequenceContent.appendChild(elem);
                            this.sequenceElements.push(elem);
                        }
                        Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                        Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], departure.enRouteTransitions[this.selectedTransition].legs[i].fixIcao.substr(7, 5));
                    }
                    offset += departure.enRouteTransitions[this.selectedTransition].legs.length;
                }
            }
            for (let i = offset; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        } else {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.selectedAirport = this.gps.currFlightPlanManager.getOrigin();
            if (this.selectedAirport) {
                this.selectedAirport.UpdateInfos();
            }
            for (let i = 0; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class NavSystemTouch_ArrivalSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedArrival = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.sequenceElements = [];
    }
    init(root) {
        this.airport = this.gps.getChildById("Arrival_Airport");
        this.airportIdent = this.airport.getElementsByClassName("ident")[0];
        this.airportName = this.airport.getElementsByClassName("name")[0];
        this.arrival = this.gps.getChildById("Arrival_Arrival");
        this.arrivalValue = this.arrival.getElementsByClassName("value")[0];
        this.transition = this.gps.getChildById("Arrival_Transition");
        this.transitionValue = this.transition.getElementsByClassName("value")[0];
        this.runway = this.gps.getChildById("Arrival_Runway");
        this.runwayValue = this.runway.getElementsByClassName("value")[0];
        this.remove = this.gps.getChildById("Arrival_Remove");
        this.load = this.gps.getChildById("Arrival_Load");
        this.sequence = this.gps.getChildById("Arrival_Sequence");
        this.sequenceContent = this.sequence.getElementsByClassName("content")[0];
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.sequenceContent;
        this.gps.makeButton(this.arrival, this.openArrivalList.bind(this));
        this.gps.makeButton(this.transition, this.openEnrouteTransitionList.bind(this));
        this.gps.makeButton(this.runway, this.openRunwayList.bind(this));
        this.gps.makeButton(this.load, this.loadArrival.bind(this));
        this.gps.makeButton(this.remove, this.removeArrival.bind(this));
    }
    openArrivalList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            if (infos.arrivals && infos.arrivals.length > 0) {
                for (let i = 0; i < infos.arrivals.length; i++) {
                    strings.push(infos.arrivals[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Arrival", strings, this.selectArrival.bind(this));
            }
        }
    }
    close() {
    }
    removeArrival() {
        if (this.gps.currFlightPlanManager.getArrival() != null) {
            this.gps.currFlightPlanManager.removeArrival();
            this.close();
        }
    }
    loadArrival() {
        if (this.selectedAirport) {
            this.gps.currFlightPlanManager.setArrivalProcIndex(this.selectedArrival);
            this.gps.currFlightPlanManager.setArrivalEnRouteTransitionIndex(this.selectedTransition);
            this.gps.currFlightPlanManager.setArrivalRunwayIndex(this.selectedRunway);
            this.close();
        }
    }
    selectArrival(_index) {
        this.selectedArrival = _index;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
    }
    openEnrouteTransitionList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            const arrival = this.getSelectedArrival(infos);
            if (arrival && arrival.enRouteTransitions && arrival.enRouteTransitions.length > 0) {
                for (let i = 0; i < arrival.enRouteTransitions.length; i++) {
                    strings.push(arrival.enRouteTransitions[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Transition", strings, this.selectEnrouteTransition.bind(this));
            }
        }
    }
    selectEnrouteTransition(_index) {
        this.selectedTransition = _index;
    }
    getSelectedArrival(airport) {
        if (airport && airport.arrivals && this.selectedArrival >= 0 && this.selectedArrival < airport.arrivals.length) {
            return airport.arrivals[this.selectedArrival];
        }
        return null;
    }
    openRunwayList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            const arrival = this.getSelectedArrival(infos);
            if (arrival && arrival.runwayTransitions && arrival.runwayTransitions.length > 0) {
                for (let i = 0; i < arrival.runwayTransitions.length; i++) {
                    strings.push(arrival.runwayTransitions[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Runway", strings, this.selectRunway.bind(this));
            }
        }
    }
    selectRunway(_index) {
        this.selectedRunway = _index;
    }
    onEnter() {
        this.selectedAirport = this.gps.currFlightPlanManager.getDestination();
        if (this.selectedAirport) {
            this.selectedAirport.UpdateInfos();
        }
    }
    onUpdate(_deltaTime) {
        this.scrollElement.update();
        if (this.gps.currFlightPlanManager.getArrival() != null) {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "Greyed");
        }
        if (this.selectedAirport) {
            Avionics.Utils.diffAndSetAttribute(this.load, "state", "");
            const infos = this.selectedAirport.GetInfos();
            const arrival = this.getSelectedArrival(infos);
            Avionics.Utils.diffAndSet(this.airportIdent, infos.ident);
            Avionics.Utils.diffAndSet(this.airportName, infos.name);
            if (arrival) {
                Avionics.Utils.diffAndSet(this.arrivalValue, arrival.name);
                if (arrival.enRouteTransitions && arrival.enRouteTransitions.length > 0) {
                    Avionics.Utils.diffAndSet(this.transitionValue, arrival.enRouteTransitions[this.selectedTransition].name);
                } else {
                    Avionics.Utils.diffAndSet(this.transitionValue, "None");
                }
                if (arrival.runwayTransitions && arrival.runwayTransitions.length > 0) {
                    Avionics.Utils.diffAndSet(this.runwayValue, arrival.runwayTransitions[this.selectedRunway].name);
                } else {
                    Avionics.Utils.diffAndSet(this.runwayValue, "All");
                }
            } else {
                Avionics.Utils.diffAndSetAttribute(this.load, "state", "Greyed");
                Avionics.Utils.diffAndSet(this.arrivalValue, "None");
                Avionics.Utils.diffAndSet(this.transitionValue, "None");
                Avionics.Utils.diffAndSet(this.runwayValue, "None");
            }
            let offset = 0;
            if (arrival) {
                if (arrival.enRouteTransitions && this.selectedTransition >= 0 && this.selectedTransition < arrival.enRouteTransitions.length) {
                    for (let i = 0; i < arrival.enRouteTransitions[this.selectedTransition].legs.length; i++) {
                        if (offset + i >= this.sequenceElements.length) {
                            const elem = document.createElement("div");
                            this.sequenceContent.appendChild(elem);
                            this.sequenceElements.push(elem);
                        }
                        Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                        Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], arrival.enRouteTransitions[this.selectedTransition].legs[i].fixIcao.substr(7, 5));
                    }
                    offset += arrival.enRouteTransitions[this.selectedTransition].legs.length;
                }
                for (let i = 0; i < arrival.commonLegs.length; i++) {
                    if (offset + i >= this.sequenceElements.length) {
                        const elem = document.createElement("div");
                        this.sequenceContent.appendChild(elem);
                        this.sequenceElements.push(elem);
                    }
                    Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                    Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], arrival.commonLegs[i].fixIcao.substr(7, 5));
                }
                offset += arrival.commonLegs.length;
                if (arrival.runwayTransitions && this.selectedRunway >= 0 && this.selectedRunway < arrival.runwayTransitions.length) {
                    for (let i = 0; i < arrival.runwayTransitions[this.selectedRunway].legs.length; i++) {
                        if (offset + i >= this.sequenceElements.length) {
                            const elem = document.createElement("div");
                            this.sequenceContent.appendChild(elem);
                            this.sequenceElements.push(elem);
                        }
                        Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Active");
                        Avionics.Utils.diffAndSet(this.sequenceElements[i], arrival.runwayTransitions[this.selectedRunway].legs[i].fixIcao.substr(7, 5));
                    }
                    offset += arrival.runwayTransitions[this.selectedRunway].legs.length;
                }
            }
            for (let i = offset; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        } else {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.selectedAirport = this.gps.currFlightPlanManager.getOrigin();
            if (this.selectedAirport) {
                this.selectedAirport.UpdateInfos();
            }
            for (let i = 0; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class NavSystemTouch_ApproachSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedApproach = 0;
        this.selectedTransition = 0;
        this.sequenceElements = [];
    }
    init(root) {
        this.airport = this.gps.getChildById("Approach_Airport");
        this.airport_ident = this.airport.getElementsByClassName("ident")[0];
        this.airport_name = this.airport.getElementsByClassName("name")[0];
        this.airport_logo = this.airport.getElementsByClassName("logo")[0];
        this.approach = this.gps.getChildById("Approach_Approach");
        this.approach_value = this.approach.getElementsByClassName("value")[0];
        this.transition = this.gps.getChildById("Approach_Transition");
        this.transition_value = this.transition.getElementsByClassName("value")[0];
        this.minimums = this.gps.getChildById("Approach_Minimums");
        this.minimums_state = this.minimums.getElementsByClassName("state")[0];
        this.minimums_value = this.minimums.getElementsByClassName("value")[0];
        this.primaryFrequency = this.gps.getChildById("Approach_PrimaryFrequency");
        this.primaryFrequency_value = this.primaryFrequency.getElementsByClassName("value")[0];
        this.preview = this.gps.getChildById("Approach_Preview");
        this.preview_value = this.preview.getElementsByClassName("value")[0];
        this.remove = this.gps.getChildById("Approach_Remove");
        this.load = this.gps.getChildById("Approach_Load");
        this.loadAndActivate = this.gps.getChildById("Approach_LoadAndActivate");
        this.sequence = this.gps.getChildById("Approach_Sequence");
        this.sequenceContent = this.sequence.getElementsByClassName("content")[0];
        this.gps.makeButton(this.approach, this.openApproachList.bind(this));
        this.gps.makeButton(this.transition, this.openTransitionList.bind(this));
        this.gps.makeButton(this.load, this.loadApproach.bind(this));
        this.gps.makeButton(this.loadAndActivate, this.activateApproach.bind(this));
        this.gps.makeButton(this.remove, this.removeApproach.bind(this));
    }
    close() {
    }
    loadApproach() {
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            if (infos.approaches && infos.approaches.length > this.selectedApproach) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => { }, this.selectedTransition);
            }
        }
        this.close();
    }
    activateApproach() {
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            if (infos.approaches && infos.approaches.length > this.selectedApproach) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => { }, this.selectedTransition);
                this.gps.currFlightPlanManager.activateApproach();
            }
        }
        this.close();
    }
    removeApproach() {
        if (this.gps.currFlightPlanManager.getApproach() != null) {
            this.gps.currFlightPlanManager.setApproachIndex(-1);
        }
    }
    openApproachList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            if (infos.approaches && infos.approaches.length > 0) {
                for (let i = 0; i < infos.approaches.length; i++) {
                    strings.push(infos.approaches[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Approach", strings, this.selectApproach.bind(this));
            }
        }
    }
    selectApproach(_index) {
        this.selectedApproach = _index;
        this.selectedTransition = 0;
    }
    getSelectedApproach(airport) {
        if (airport && airport.approaches && this.selectedApproach >= 0 && airport.approaches.length > this.selectedApproach) {
            return airport.approaches[this.selectedApproach];
        }
        return null;
    }
    openTransitionList() {
        const strings = [];
        if (this.selectedAirport) {
            const infos = this.selectedAirport.GetInfos();
            const approach = this.getSelectedApproach(infos);
            if (approach && approach.transitions && approach.transitions.length > 0) {
                for (let i = 0; i < approach.transitions.length; i++) {
                    strings.push(approach.transitions[i].name);
                }
                this.gps.switchToPopUpPage(this.gps.selectionList);
                this.gps.selectionList.element.setElements("Select Transition", strings, this.selectTransition.bind(this));
            }
        }
    }
    selectTransition(_index) {
        this.selectedTransition = _index;
    }
    onEnter() {
        this.selectedAirport = this.gps.currFlightPlanManager.getDestination();
        if (this.selectedAirport) {
            this.selectedAirport.UpdateInfos();
        }
    }
    onUpdate(_deltaTime) {
        if (this.gps.currFlightPlanManager.getApproach() != null) {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.remove, "state", "Greyed");
        }
        if (this.selectedAirport) {
            Avionics.Utils.diffAndSet(this.airport_ident, this.selectedAirport.infos.ident);
            Avionics.Utils.diffAndSet(this.airport_name, this.selectedAirport.infos.name);
            const infos = this.selectedAirport.GetInfos();
            const approach = this.getSelectedApproach(infos);
            if (approach) {
                Avionics.Utils.diffAndSet(this.approach_value, approach.name);
                if (approach.transitions && this.selectedTransition >= 0 && this.selectedTransition < approach.transitions.length) {
                    Avionics.Utils.diffAndSet(this.transition_value, approach.transitions[this.selectedTransition].name);
                } else {
                    Avionics.Utils.diffAndSet(this.transition_value, "None");
                }
            } else {
                Avionics.Utils.diffAndSet(this.approach_value, "____");
                Avionics.Utils.diffAndSet(this.transition_value, "____");
            }
            let offset = 0;
            if (approach) {
                if (approach.transitions && this.selectedTransition >= 0 && this.selectedTransition < approach.transitions.length) {
                    for (let i = 0; i < approach.transitions[this.selectedTransition].waypoints.length; i++) {
                        if (offset + i >= this.sequenceElements.length) {
                            const elem = document.createElement("div");
                            this.sequenceContent.appendChild(elem);
                            this.sequenceElements.push(elem);
                        }
                        Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                        if (approach.transitions[this.selectedTransition].waypoints[i]) {
                            Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], approach.transitions[this.selectedTransition].waypoints[i].ident);
                        } else {
                            Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], "");
                        }
                    }
                    offset += approach.transitions[this.selectedTransition].waypoints.length;
                }
                for (let i = 0; i < approach.wayPoints.length; i++) {
                    if (offset + i >= this.sequenceElements.length) {
                        const elem = document.createElement("div");
                        this.sequenceContent.appendChild(elem);
                        this.sequenceElements.push(elem);
                    }
                    Avionics.Utils.diffAndSetAttribute(this.sequenceElements[offset + i], "state", "Active");
                    Avionics.Utils.diffAndSet(this.sequenceElements[offset + i], approach.wayPoints[i].ident);
                }
                offset += approach.wayPoints.length;
            }
            for (let i = offset; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        } else {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.selectedAirport = this.gps.currFlightPlanManager.getOrigin();
            if (this.selectedAirport) {
                this.selectedAirport.UpdateInfos();
            }
            for (let i = 0; i < this.sequenceElements.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.sequenceElements[i], "state", "Inactive");
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class NavSystemTouch_SelectionListElement {
}
class NavSystemTouch_SelectionList extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.buttons = [];
    }
    init(root) {
        this.root = root;
        this.content = root.getElementsByClassName("content")[0];
        for (let i = 0; i < this.buttons.length; i++) {
            this.content.appendChild(this.buttons[i].button);
        }
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.content;
        this.title = root.getElementsByClassName("WindowTitle")[0];
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.scrollElement.elementSize = this.buttons.length > 0 ? this.buttons[0].button.getBoundingClientRect().height : 0;
    }
    onUpdate(_deltaTime) {
        this.scrollElement.update();
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setElements(_title, _elements, _callback) {
        this.title.textContent = _title;
        this.callback = _callback;
        for (let i = 0; i < _elements.length; i++) {
            if (i >= this.buttons.length) {
                const elem = new NavSystemTouch_SelectionListElement();
                elem.button = document.createElement("div");
                elem.button.setAttribute("class", "gradientButton");
                elem.value = document.createElement("div");
                elem.value.setAttribute("class", "value");
                elem.button.appendChild(elem.value);
                if (this.content) {
                    this.content.appendChild(elem.button);
                }
                this.gps.makeButton(elem.button, this.onElemClick.bind(this, i));
                this.buttons.push(elem);
            }
            Avionics.Utils.diffAndSetAttribute(this.buttons[i].button, "state", "Active");
            Avionics.Utils.diffAndSet(this.buttons[i].value, _elements[i]);
        }
        for (let i = _elements.length; i < this.buttons.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.buttons[i].button, "state", "Inactive");
        }
    }
    onElemClick(_id) {
        this.gps.closePopUpElement();
        this.callback(_id);
    }
}
//# sourceMappingURL=NavSystemTouch.js.map