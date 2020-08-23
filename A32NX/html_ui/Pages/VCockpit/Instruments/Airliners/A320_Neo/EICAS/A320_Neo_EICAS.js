class A320_Neo_EICAS extends Airliners.BaseEICAS {
    get templateID() { return "A320_Neo_EICAS"; }
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
        this.createLowerScreenPage("ENG", "BottomScreen", "a320-neo-lower-ecam-engine");
        this.createLowerScreenPage("BLEED", "BottomScreen", "a320-neo-lower-ecam-bleed"); // MODIFIED
        this.createLowerScreenPage("PRESS", "BottomScreen", "a320-neo-lower-ecam-press"); // MODIFIED
        this.createLowerScreenPage("ELEC", "BottomScreen", "a320-neo-lower-ecam-elec"); // MODIFIED
        this.createLowerScreenPage("HYD", "BottomScreen", "a320-neo-lower-ecam-hyd"); // MODIFIED
        this.createLowerScreenPage("FUEL", "BottomScreen", "a320-neo-lower-ecam-fuel");
        this.createLowerScreenPage("APU", "BottomScreen", "a320-neo-lower-ecam-apu");
        this.createLowerScreenPage("COND", "BottomScreen", "a320-neo-lower-ecam-cond"); // MODIFIED
        this.createLowerScreenPage("DOOR", "BottomScreen", "a320-neo-lower-ecam-door"); // MODIFIED
        this.createLowerScreenPage("WHEEL", "BottomScreen", "a320-neo-lower-ecam-wheel"); // MODIFIED
        this.createLowerScreenPage("FTCL", "BottomScreen", "a320-neo-lower-ecam-ftcl"); // MODIFIED
    }
    getLowerScreenChangeEventNamePrefix() {
        return "ECAM_CHANGE_PAGE_";
    }
    Init() {
        super.Init();
        this.changePage("DOOR");

        this.lastAPUMasterState = 0 // MODIFIED
        this.externalPowerWhenApuMasterOnTimer = -1 // MODIFIED
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.updateAnnunciations();


        // modification start here
        var currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");  
        // automaticaly switch to the APU page when apu master switch is on
        if (this.lastAPUMasterState != currentAPUMasterState) {  
            //if external power is off when turning on apu, only show the apu page for 10 seconds, then the DOOR page
            var externalPower = SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool")  
            if (externalPower === 1) {  
                this.externalPowerWhenApuMasterOnTimer = 10
                this.lastAPUMasterState = currentAPUMasterState;  
                this.changePage("APU")
            } else {  
                this.lastAPUMasterState = currentAPUMasterState;  
                this.changePage("APU");  
            }  

        }

        if (this.externalPowerWhenApuMasterOnTimer >= 0) {  
            this.externalPowerWhenApuMasterOnTimer -= _deltaTime/1000
            if (this.externalPowerWhenApuMasterOnTimer <= 0) {  
                this.changePage("DOOR")  
            }  
        }  

        // modification ends here
    }
    updateAnnunciations() {
        let infoPanelManager = this.upperTopScreen.getInfoPanelManager();
        if (infoPanelManager) {
            infoPanelManager.clearScreen(Airliners.EICAS_INFO_PANEL_ID.PRIMARY);
            if (this.warnings) {
                let text = this.warnings.getCurrentWarningText();
                if (text && text != "") {
                    let level = this.warnings.getCurrentWarningLevel();
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
                let onGround = Simplane.getIsGrounded();
                for (let i = this.annunciations.displayWarning.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayWarning[i].Acknowledged)
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayWarning[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.WARNING);
                }
                for (let i = this.annunciations.displayCaution.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayCaution[i].Acknowledged)
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayCaution[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION);
                }
                for (let i = this.annunciations.displayAdvisory.length - 1; i >= 0; i--) {
                    if (!this.annunciations.displayAdvisory[i].Acknowledged)
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayAdvisory[i].Text, (onGround) ? Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION : Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.CAUTION);
                }
            }
        }
    }
}
registerInstrument("a320-neo-eicas-element", A320_Neo_EICAS);
//# sourceMappingURL=A320_Neo_EICAS.js.map