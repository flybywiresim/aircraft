class A320_Neo_EICAS extends Airliners.BaseEICAS {
    get templateID() { return "A320_Neo_EICAS"; }
    // This js file has 2 intances at runtime, 1 upper screen and 1 lower
    get isTopScreen() { return this.urlConfig.index === 1; }
    get isBottomScreen() { return this.urlConfig.index === 2; }
    changePage(_pageName) {
        let pageName = _pageName.toUpperCase();
        for (var i = 0; i < this.lowerScreenPages.length; i++) {
            if (this.lowerScreenPages[i].name == pageName) {
                let pageIndex = i;
                if (pageIndex == this.currentPage) {
                    pageName = "CRZ";
                    pageIndex = -1;
                }
                this.currentPage = pageIndex;
                SimVar.SetSimVarValue("L:XMLVAR_ECAM_CURRENT_PAGE", "number", pageIndex);
                break;
            }
        }
        this.SwitchToPageName(this.LOWER_SCREEN_GROUP_NAME, pageName);
    }
    createUpperScreenPage() {
        this.upperTopScreen = new Airliners.EICASScreen("TopScreen", "TopScreen", "a320-neo-upper-ecam");
        this.annunciations = new Cabin_Annunciations();
        this.annunciations.offStart = true;
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
        this.createLowerScreenPage("CRZ", "BottomScreen", "a320-neo-lower-ecam-crz"); // MODIFIED
    }
    getLowerScreenChangeEventNamePrefix() {
        return "ECAM_CHANGE_PAGE_";
    }
    Init() {
        super.Init();

        this.currentPage = -1;

        this.changePage("FUEL"); // MODIFIED
        if (this.isTopScreen) {
            this.A32NXCore = new A32NX_Core();
            this.A32NXCore.init();
        }

        this.lastAPUMasterState = 0; // MODIFIED
        this.externalPowerWhenApuMasterOnTimer = -1; // MODIFIED

        this.topSelfTestDiv = this.querySelector("#TopSelfTest");
        this.topSelfTestTimer = -1;
        this.topSelfTestTimerStarted = false;
        this.topSelfTestLastKnobValue = 1;
        
        this.bottomSelfTestDiv = this.querySelector("#BottomSelfTest");
        this.bottomSelfTestTimer = -1;
        this.bottomSelfTestTimerStarted = false;
        this.bottomSelfTestLastKnobValue = 1;
        
        // Using ternary in case the LVar is undefined
        this.ACPowerLastState = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool') ? 0 : 1;

        this.doorPageActivated = false;
        this.EngineStarter = 0;
        this.EngineStart == 0
        this.electricity = this.querySelector("#Electricity");
        this.changePage("DOOR"); // MODIFIED
        this.localVarUpdater = new LocalVarUpdater();
        
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:7","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:14","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:15","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:16","FLOAT64",0);        
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:17","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:18","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:19","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:20","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:21","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:22","FLOAT64",0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:23","FLOAT64",0);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.isTopScreen) {
            this.A32NXCore.update(_deltaTime);
            this.localVarUpdater.update();
        }
        this.updateAnnunciations();
        this.updateScreenState();
        
        const engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
        const externalPower = SimVar.GetSimVarValue("EXTERNAL POWER ON", "bool");
        const apuOn = SimVar.GetSimVarValue("L:APU_GEN_ONLINE", "bool");
        const isACPowerAvailable = engineOn || apuOn || externalPower;
        var DCBus = false;

        const ACPowerStateChange = (isACPowerAvailable != this.ACPowerLastState);
        SimVar.SetSimVarValue("L:ACPowerStateChange","Bool",ACPowerStateChange);

        if(SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE","Volts")>=20){
            DCBus = true;
        }
        var isDCPowerAvailable = isACPowerAvailable || DCBus;
        if(isDCPowerAvailable){
            SimVar.SetSimVarValue("L:DCPowerAvailable","bool",1);   //True if any AC|DC bus is online
        }
        else{
            SimVar.SetSimVarValue("L:DCPowerAvailable","bool",0);
        }
        if(isACPowerAvailable){
            SimVar.SetSimVarValue("L:ACPowerAvailable","bool",1);   //True if any AC bus is online
        }
        else{
            SimVar.SetSimVarValue("L:ACPowerAvailable","bool",0);
        }

        /**
         * Self test on top ECAM screen
         **/
        
        let topSelfTestCurrentKnobValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:22", "number");
        
        if(((topSelfTestCurrentKnobValue >= 0.1 && this.topSelfTestLastKnobValue < 0.1) || ACPowerStateChange) && isACPowerAvailable && !this.topSelfTestTimerStarted) {
            this.topSelfTestDiv.style.display = "block";
            this.topSelfTestTimer = 14.25;
            this.topSelfTestTimerStarted = true;
        }
        
        if (this.topSelfTestTimer >= 0) {
            this.topSelfTestTimer -= _deltaTime / 1000;
            if (this.topSelfTestTimer <= 0) {
                this.topSelfTestDiv.style.display = "none";
                this.topSelfTestTimerStarted = false;
            }
        }
        
        this.topSelfTestLastKnobValue = topSelfTestCurrentKnobValue;

        /**
         * Self test on bottom ECAM screen
         **/
        
        let bottomSelfTestCurrentKnobValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:23", "number");
        
        if(((bottomSelfTestCurrentKnobValue >= 0.1 && this.bottomSelfTestLastKnobValue < 0.1) || ACPowerStateChange) && isACPowerAvailable && !this.bottomSelfTestTimerStarted) {
            this.bottomSelfTestDiv.style.display = "block";
            this.bottomSelfTestTimer = 14.25;
            this.bottomSelfTestTimerStarted = true;
        }
        
        if (this.bottomSelfTestTimer >= 0) {
            this.bottomSelfTestTimer -= _deltaTime / 1000;
            if (this.bottomSelfTestTimer <= 0) {
                this.bottomSelfTestDiv.style.display = "none";
                this.bottomSelfTestTimerStarted = false;
            }
        }
        
        this.bottomSelfTestLastKnobValue = bottomSelfTestCurrentKnobValue;

        this.ACPowerLastState = isACPowerAvailable;

        // modification start here
        var currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");  
        // automaticaly switch to the APU page when apu master switch is on
        if (this.lastAPUMasterState != currentAPUMasterState && currentAPUMasterState === 1) {  
            this.lastAPUMasterState = currentAPUMasterState;  
            this.changePage("APU");

            //if external power is off when turning on apu, only show the apu page for 10 seconds, then the DOOR page
            if (externalPower === 0) {  
                this.externalPowerWhenApuMasterOnTimer = 85;
            }

        }
        //fixed ecam page not switching to engine 2 if starter is set to off
        if(this.EngineStart == 0 && this.EngineStarter < 2 && SimVar.GetSimVarValue("GENERAL ENG STARTER:1", "Bool")){
            this.changePage("Engine");
            this.EngineStarter += 1;
        }
        if(this.EngineStarter == 2){
            this.EngineStarter = 0;
            this.EngineStart = 1;
        }
        if(SimVar.GetSimVarValue("GENERAL ENG STARTER:1","Bool") == false){
            this.EngineStart = 0;
            this.EngineStarter = 0;
        }

        if (this.externalPowerWhenApuMasterOnTimer >= 0) {  
            this.externalPowerWhenApuMasterOnTimer -= _deltaTime/1000
            if (this.externalPowerWhenApuMasterOnTimer <= 0) {  
                this.changePage("DOOR");
            }  
        }  


        //automatic DOOR page switch
        var cabinDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:0", "percent");
        var cateringDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:3", "percent");
        var fwdCargoPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:5", "percent");
        if ((cabinDoorPctOpen >= 20 || cateringDoorPctOpen >= 20 || fwdCargoPctOpen >= 20) && !this.doorPageActivated) {
            this.changePage("DOOR")
            this.doorPageActivated = true
        }
        if (!(cabinDoorPctOpen >= 20 || cateringDoorPctOpen >= 20 || fwdCargoPctOpen >= 20) && this.doorPageActivated) {
            this.doorPageActivated = false
        }
        // modification ends here
    }

    updateScreenState() {
        if (SimVar.GetSimVarValue("L:ACPowerAvailable","bool")) {
            this.electricity.style.display = "block";
        } else {
            this.electricity.style.display = "none";
        }
    }

    updateAnnunciations() {
        let infoPanelManager = this.upperTopScreen.getInfoPanelManager();
        if (infoPanelManager) {

            // ----------- MODIFIED --------------------//
            let autoBrkValue = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");
            let starterOne = SimVar.GetSimVarValue("GENERAL ENG STARTER:1", "Bool");
            let starterTwo = SimVar.GetSimVarValue("GENERAL ENG STARTER:2", "Bool");
            let splrsArmed = SimVar.GetSimVarValue("SPOILERS ARMED", "Bool");
            let flapsPosition = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
            // ----------- MODIFIED END --------------------//

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

            // ----------- MODIFIED --------------------//
            if (this.beforeTakeoffPhase && starterOne && starterTwo) {
                if (autoBrkValue == 3) {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "T.O AUTO BRK MAX", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                } else {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "T.O AUTO BRK......MAX[color]blue", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                }
                infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0SIGNS ON", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                if (splrsArmed) {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0SPLRS ARM", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                } else {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0SPLRS.........ARM", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                }
                if (flapsPosition > 0) {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0FLAPS T.O", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                } else {
                    infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0FLAPS.........T.O", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                }
                infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, "\xa0\xa0\xa0\xa0T.O CONFIG", Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
            }
            // ----------- MODIFIED END --------------------//


            else if (this.annunciations) {
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
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayAdvisory[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                }
            }
        }
    }
}
registerInstrument("a320-neo-eicas-element", A320_Neo_EICAS);
//# sourceMappingURL=A320_Neo_EICAS.js.map
