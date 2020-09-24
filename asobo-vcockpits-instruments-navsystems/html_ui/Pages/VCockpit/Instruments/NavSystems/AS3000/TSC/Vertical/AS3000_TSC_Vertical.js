class AS3000_TSC_Vertical extends AS3000_TSC {
    constructor() {
        super(...arguments);
        this.middleKnobText_Save = "";
    }
    get templateID() { return "AS3000_TSC_Vertical"; }
    connectedCallback() {
        super.connectedCallback();
        this.topKnobText = this.getChildById("SoftKey_1");
        this.middleKnobText = this.getChildById("SoftKey_2");
        this.bottomKnobText = this.getChildById("SoftKey_3");
        this.addIndependentElementContainer(new NavSystemElementContainer("NavCom", "NavComLeft", new AS3000_TSC_Vertical_NavComHome()));
        this.getElementOfType(AS3000_TSC_ActiveFPL).setArrowSizes(18, 20, 10, 4, 8);
    }
    setMiddleKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.middleKnobText_Save = _text;
        }
        if (this.middleKnobText.innerHTML != _text) {
            this.middleKnobText.innerHTML = _text;
        }
    }
    rollBackKnobTexts() {
        super.rollBackKnobTexts();
        this.middleKnobText.innerHTML = this.middleKnobText_Save;
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let pageGroup = this.instrumentXmlConfig.getElementsByTagName("PageGroup");
            if (pageGroup.length > 0) {
                this.SwitchToMenuName(pageGroup[0].textContent);
            }
        }
    }
}
class AS3000_TSC_Vertical_NavComHome extends AS3000_TSC_NavComHome {
    setSelectedCom(_id) {
        if (this.inputIndex != -1) {
            this.comFreqValidate();
        }
        this.selectedCom = _id;
        this.setSoftkeysNames();
        if (_id == 1) {
            this.gps.frequencyKeyboard.getElementOfType(AS3000_TSC_FrequencyKeyboard).setContext("COM1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), this.container, "COM SPACING MODE:1");
        }
        else {
            this.gps.frequencyKeyboard.getElementOfType(AS3000_TSC_FrequencyKeyboard).setContext("COM2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), this.container, "COM SPACING MODE:2");
        }
        this.gps.switchToPopUpPage(this.gps.frequencyKeyboard);
    }
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
        }
    }
}
registerInstrument("as3000-tsc-vertical-element", AS3000_TSC_Vertical);
//# sourceMappingURL=AS3000_TSC_Vertical.js.map