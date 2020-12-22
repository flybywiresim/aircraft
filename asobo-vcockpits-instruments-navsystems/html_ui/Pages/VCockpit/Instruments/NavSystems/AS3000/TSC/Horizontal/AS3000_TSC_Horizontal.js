class AS3000_TSC_Horizontal extends AS3000_TSC {
    get templateID() {
        return "AS3000_TSC_Horizontal";
    }
    connectedCallback() {
        super.connectedCallback();
        this.topKnobText = this.getChildById("SoftKey_1");
        this.bottomKnobText = this.getChildById("SoftKey_5");
    }
}
registerInstrument("as3000-tsc-horizontal-element", AS3000_TSC_Horizontal);
//# sourceMappingURL=AS3000_TSC_Horizontal.js.map