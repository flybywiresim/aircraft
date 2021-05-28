class A320_Neo_EICAS extends Airliners.BaseEICAS {
    get templateID() {
        return "A320_Neo_EICAS";
    }

    // This js file has 2 intances at runtime, 1 upper screen and 1 lower
    get isTopScreen() {
        return this.urlConfig.index === 1;
    }

    get isBottomScreen() {
        return this.urlConfig.index === 2;
    }

    // The following two functions can be called from anywhere on the EICAS
    static isOnTopScreen() {
        const eicas = document.getElementsByTagName("a320-neo-eicas-element");
        if (!eicas.length) {
            return false;
        }
        return eicas[0].isTopScreen;
    }

    static isOnBottomScreen() {
        const eicas = document.getElementsByTagName("a320-neo-eicas-element");
        if (!eicas.length) {
            return false;
        }
        return eicas[0].isBottomScreen;
    }

    changePage(_pageName) {
        let pageName = _pageName.toUpperCase();
        for (let i = 0; i < this.lowerScreenPages.length; i++) {
            if (this.lowerScreenPages[i].name == pageName) {
                let pageIndex = i;
                if (pageIndex == this.currentPage) {
                    pageName = this.pageNameWhenUnselected;
                    pageIndex = -1;
                }

                this.currentPage = pageIndex;
                break;
            }
        }
        this.SwitchToPageName(this.LOWER_SCREEN_GROUP_NAME, pageName);
        SimVar.SetSimVarValue("L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX", "number", this.currentPage);
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
        this.createLowerScreenPage("ELEC", "BottomScreen", "a32nx-elec-page-element");
        this.createLowerScreenPage("HYD", "BottomScreen", "a32nx-hyd-page-element");
        this.createLowerScreenPage("FUEL", "BottomScreen", "a320-neo-lower-ecam-fuel");
        this.createLowerScreenPage("APU", "BottomScreen", "a320-neo-lower-ecam-apu");
        this.createLowerScreenPage("COND", "BottomScreen", "a32nx-cond-page-element"); // MODIFIED
        this.createLowerScreenPage("DOOR", "BottomScreen", "a32nx-door-page-element"); // MODIFIED
        this.createLowerScreenPage("WHEEL", "BottomScreen", "a320-neo-lower-ecam-wheel"); // MODIFIED
        this.createLowerScreenPage("FTCL", "BottomScreen", "a32nx-fctl-page-element"); // MODIFIED
        this.createLowerScreenPage("STS", "BottomScreen", "a320-neo-lower-ecam-status"); // MODIFIED
        this.createLowerScreenPage("CRZ", "BottomScreen", "a320-neo-lower-ecam-crz"); // MODIFIED
    }

    getLowerScreenChangeEventNamePrefix() {
        return "ECAM_CHANGE_PAGE_";
    }

    Init() {
        super.Init();
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(this._lastTime);
        this.currentPage = -1;
        this.ecamAllButtonTimer = 1000;
        this.ecamAllButtonTimerStarted = false;

        this.pageNameWhenUnselected = "DOOR";
        //this prevents switching back to previous pages
        this.minPageIndexWhenUnselected = 0;

        this.ecamFCTLTimer = -1;

        this.changePage("FUEL"); // MODIFIED

        this.lastAPUMasterState = 0; // MODIFIED
        this.ApuAboveThresholdTimer = -1; // MODIFIED
        this.MainEngineStarterOffTimer = -1;
        this.CrzCondTimer = 60;
        this.PrevFailPage = -1;

        this.doorVideoWrapper = this.querySelector("#door-video-wrapper");

        this.upperEngTestDiv = this.querySelector("#Eicas1EngTest");
        this.lowerEngTestDiv = this.querySelector("#Eicas2EngTest");
        this.upperEngMaintDiv = this.querySelector("#Eicas1MaintMode");
        this.lowerEngMaintDiv = this.querySelector("#Eicas2MaintMode");

        this.doorVideoPressed = false;

        // Using ternary in case the LVar is undefined
        this.poweredDuringPreviousUpdate = SimVar.GetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "Bool") ? 0 : 1;

        this.changePage("DOOR"); // MODIFIED
        this.changePage("DOOR"); // This should get the ECAM into the "unselected" state

        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:7", "number", 0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:84", "number", 0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:85", "number", 0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:86", "number", 0);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:87", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:88", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:89", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:90", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:91", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:92", "number", 0.1);
        SimVar.SetSimVarValue("LIGHT POTENTIOMETER:93", "number", 0.1);

        this.ecamAllButtonPrevState = false;
        this.updateThrottler = new UpdateThrottler(500);

        this.displayUnit = new DisplayUnit(
            this.querySelector("#Electricity"),
            () => {
                return SimVar.GetSimVarValue(`L:A32NX_ELEC_${this.isTopScreen ? "AC_ESS" : "AC_2"}_BUS_IS_POWERED`, "Bool");
            },
            () => parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15")),
            this.isTopScreen ? 92 : 93,
            this.querySelector(`#${this.isTopScreen ? "Top" : "Bottom"}SelfTest`)
        );
    }

    onUpdate() {
        let deltaTime = this.getDeltaTime();
        super.onUpdate(deltaTime);

        const ecamAllButtonBeingPushed = SimVar.GetSimVarValue("L:A32NX_ECAM_ALL_Push_IsDown", "Bool");

        deltaTime = this.updateThrottler.canUpdate(deltaTime, this.displayUnit.isJustNowTurnedOn() || ecamAllButtonBeingPushed);
        if (deltaTime === -1) {
            return;
        }

        this.displayUnit.update(deltaTime);

        this.updateDoorVideoState();

        this.updateAnnunciations();

        // TODO Move anything dependent on ac power change to A32NX_Core
        const engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);

        // Engineering self-tests
        updateDisplayDMC("EICAS1", this.upperEngTestDiv, this.upperEngMaintDiv);
        updateDisplayDMC("EICAS2", this.lowerEngTestDiv, this.lowerEngMaintDiv);

        // modification start here
        const currentAPUMasterState = SimVar.GetSimVarValue("L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON", "Bool");

        //Determine displayed page when no button is selected
        const prevPage = this.pageNameWhenUnselected;

        const altitude = Simplane.getAltitude();
        const isGearExtended = SimVar.GetSimVarValue("GEAR TOTAL PCT EXTENDED", "percent") > 0.95;
        const currFlightPhase = SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number");
        const ToPowerSet = Math.max(SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number"), SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "number")) >= 35 && SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent") > 15 && SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent") > 15;
        const apuAvailable = SimVar.GetSimVarValue("L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE", "Bool");
        const EngModeSel = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "number");
        const spoilerOrFlapsDeployed = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "number") != 0 || SimVar.GetSimVarValue("L:A32NX_SPOILERS_HANDLE_POSITION", "percent") != 0;

        const crzCond = ((spoilerOrFlapsDeployed || ToPowerSet) && (currFlightPhase == FmgcFlightPhases.CLIMB || currFlightPhase == FmgcFlightPhases.CRUISE) && this.CrzCondTimer <= 0) || (currFlightPhase == FmgcFlightPhases.CLIMB && !spoilerOrFlapsDeployed && !ToPowerSet);

        if ((currFlightPhase != FmgcFlightPhases.CLIMB || currFlightPhase == FmgcFlightPhases.CRUISE) || (!spoilerOrFlapsDeployed && !ToPowerSet) && this.CrzCondTimer >= 0) {
            this.CrzCondTimer = 60;
        } else if ((spoilerOrFlapsDeployed || ToPowerSet) && (currFlightPhase == FmgcFlightPhases.CLIMB || currFlightPhase == FmgcFlightPhases.CRUISE) && this.CrzCondTimer >= 0) {
            this.CrzCondTimer -= deltaTime / 1000;
        }

        if (EngModeSel == 2 || EngModeSel == 0 || this.MainEngineStarterOffTimer >= 0) {
            if (EngModeSel == 0 || EngModeSel == 2) {
                this.MainEngineStarterOffTimer = 10;
            } else if (this.MainEngineStarterOffTimer >= 0) {
                this.MainEngineStarterOffTimer -= deltaTime / 1000;
            }
            this.pageNameWhenUnselected = "ENG";
        } else if (currentAPUMasterState && (!apuAvailable || this.ApuAboveThresholdTimer >= 0)) {
            // Show APU on Lower ECAM until 10s after it became available.
            if (this.ApuAboveThresholdTimer <= 0 && !apuAvailable) {
                this.ApuAboveThresholdTimer = 10;
            } else if (apuAvailable) {
                this.ApuAboveThresholdTimer -= deltaTime / 1000;
            }

            this.pageNameWhenUnselected = "APU";
        } else if (!engineOn && Simplane.getIsGrounded()) {
            // reset minIndex and cruise timer after shutdown
            this.minPageIndexWhenUnselected = 0;
            this.CrzCondTimer = 60;
            this.pageNameWhenUnselected = "DOOR";
        } else if (engineOn && !ToPowerSet && Simplane.getIsGrounded() && this.minPageIndexWhenUnselected <= 1) {
            const sidestickPosX = SimVar.GetSimVarValue("L:A32NX_SIDESTICK_POSITION_X", "Number");
            const sidestickPosY = SimVar.GetSimVarValue("L:A32NX_SIDESTICK_POSITION_Y", "Number");
            const rudderPos = SimVar.GetSimVarValue("RUDDER PEDAL POSITION", "Position");
            const controlsMoved = Math.abs(sidestickPosX) > 0.05 || Math.abs(sidestickPosY) > 0.05 || Math.abs(rudderPos) > 0.2;

            this.pageNameWhenUnselected = "WHEEL";
            // When controls are moved, show FCTL page for 20s
            if (controlsMoved) {
                this.pageNameWhenUnselected = "FTCL";
                this.ecamFCTLTimer = 20;
            } else if (this.ecamFCTLTimer >= 0) {
                this.pageNameWhenUnselected = "FTCL";
                this.ecamFCTLTimer -= deltaTime / 1000;
            }
        } else if ((ToPowerSet || !Simplane.getIsGrounded()) && !crzCond && this.minPageIndexWhenUnselected <= 2) {
            this.pageNameWhenUnselected = "ENG";
        } else if (crzCond && !(isGearExtended && altitude < 16000)) {
            this.pageNameWhenUnselected = "CRZ";
            this.minPageIndexWhenUnselected = 3;
        } else if (isGearExtended && (altitude < 16000)) {
            this.pageNameWhenUnselected = "WHEEL";
            this.minPageIndexWhenUnselected = 4;
        }

        const sFailPage = SimVar.GetSimVarValue("L:A32NX_ECAM_SFAIL", "Enum");

        if (sFailPage != -1) {
            this.pageNameWhenUnselected = this.lowerScreenPages[sFailPage].name;

            // Disable user selected page when new failure detected
            if (this.PrevFailPage !== sFailPage) {
                this.currentPage = -1;
                SimVar.SetSimVarValue("L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX", "number", -1);
            }
        }

        // switch page when desired page was changed, or new Failure detected
        if ((this.pageNameWhenUnselected != prevPage && this.currentPage == -1) || (this.PrevFailPage !== sFailPage)) {
            this.SwitchToPageName(this.LOWER_SCREEN_GROUP_NAME, this.pageNameWhenUnselected);
        }

        if (ecamAllButtonBeingPushed && !this.ecamAllButtonPrevState) { // button press
            this.changePage(this.lowerScreenPages[(this.currentPage + 1) % this.lowerScreenPages.length].name);
            this.ecamCycleInterval = setInterval(() => {
                this.changePage(this.lowerScreenPages[(this.currentPage + 1) % this.lowerScreenPages.length].name);
            }, 1000);
        } else if (!ecamAllButtonBeingPushed && this.ecamAllButtonPrevState) { // button release
            clearInterval(this.ecamCycleInterval);
        }

        this.ecamAllButtonPrevState = ecamAllButtonBeingPushed;
        this.PrevFailPage = sFailPage;
    }

    updateDoorVideoState() {
        const doorVideoPressedNow = SimVar.GetSimVarValue("L:PUSH_DOORPANEL_VIDEO", "Bool") === 1;
        const doorVideoEnabledNow = SimVar.GetSimVarValue("L:A32NX_OVHD_COCKPITDOORVIDEO_TOGGLE", "Bool") === 1;

        if (doorVideoEnabledNow && this.doorVideoPressed !== doorVideoPressedNow) {
            this.doorVideoPressed = doorVideoPressedNow;

            this.setDoorVideo();
        }
    }

    setDoorVideo() {
        this.doorVideoWrapper.style.visibility = this.doorVideoPressed ? "visible" : "hidden";
    }

    updateAnnunciations() {
        const infoPanelManager = this.upperTopScreen.getInfoPanelManager();
        if (infoPanelManager) {

            // ----------- MODIFIED --------------------//
            const autoBrkValue = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");
            const starterOne = SimVar.GetSimVarValue("GENERAL ENG STARTER:1", "Bool");
            const starterTwo = SimVar.GetSimVarValue("GENERAL ENG STARTER:2", "Bool");
            const splrsArmed = SimVar.GetSimVarValue("L:A32NX_SPOILERS_ARMED", "Bool");
            const flapsPosition = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number");
            // ----------- MODIFIED END --------------------//

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
                        infoPanelManager.addMessage(Airliners.EICAS_INFO_PANEL_ID.PRIMARY, this.annunciations.displayAdvisory[i].Text, Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE.INDICATION);
                    }
                }
            }
        }
    }
}

registerInstrument("a320-neo-eicas-element", A320_Neo_EICAS);
