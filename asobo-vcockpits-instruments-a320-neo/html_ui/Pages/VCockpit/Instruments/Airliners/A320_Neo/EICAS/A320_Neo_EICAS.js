class A320_Neo_EICAS extends Airliners.BaseEICAS {
    get templateID() {
        return "A320_Neo_EICAS";
    }
    createUpperScreenPage() {
        this.upperTopScreen = new Airliners.EICASScreen("TopScreen", "TopScreen", "a320-neo-upper-ecam");
        this.annunciations = new Cabin_Annunciations();
        this.upperTopScreen.addIndependentElement(this.annunciations);
        this.warnings = new Cabin_Warnings();
        this.upperTopScreen.addIndependentElement(this.warnings);
        this.addIndependentElementContainer(this.upperTopScreen);
        this.addIndependentElementContainer(new Airliners.EICASScreen("BottomScreenCommon", "BottomScreen", "eicas-common-display"));
    }
    createLowerScreenPages() {
        this.createLowerScreenPage("FUEL", "BottomScreen", "a320-neo-lower-ecam-fuel");
        this.createLowerScreenPage("ENG", "BottomScreen", "a320-neo-lower-ecam-engine");
        this.createLowerScreenPage("APU", "BottomScreen", "a320-neo-lower-ecam-apu");
    }
    getLowerScreenChangeEventNamePrefix() {
        return "ECAM_CHANGE_PAGE_";
    }
    Init() {
        super.Init();
        this.changePage("FUEL");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.updateAnnunciations();
    }
    updateAnnunciations() {
        const infoPanelManager = this.upperTopScreen.getInfoPanelManager();
        if (infoPanelManager) {
            infoPanelManager.clearScreen(Airliners.EICAS_INFO_PANEL_ID.PRIMARY);
            if (this.warnings) {
                const text = this.warnings.getCurrentWarningText();
                if (text && text != "") {
                    const level = this.warnings.getCurrentWarningLevel();
                    switch (level) {
                        case 0:
                            infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                            break;
                        case 1:
                            infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION);
                            break;
                        case 2:
                            infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.WARNING);
                            break;
                    }
                }
            }
            if (this.annunciations) {
                const onGround = Simplane.getIsGrounded();
                for (let i = this.annunciations.displayWarning.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayWarning[i].Acknowledged) {
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayWarning[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.WARNING);
                    }
                }
                for (let i = this.annunciations.displayCaution.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayCaution[i].Acknowledged) {
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayCaution[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION);
                    }
                }
                for (let i = this.annunciations.displayAdvisory.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayAdvisory[i].Acknowledged) {
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayAdvisory[i].Text, (onGround) ? Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION : Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION);
                    }
                }
            }
        }
    }
}
registerInstrument("a320-neo-eicas-element", A320_Neo_EICAS);
//# sourceMappingURL=A320_Neo_EICAS.js.map