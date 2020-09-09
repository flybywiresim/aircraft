var A320_Neo_UpperECAM;
(function (A320_Neo_UpperECAM) {
    class Definitions {
    }
    Definitions.MIN_GAUGE_EGT = 0;
    Definitions.MAX_GAUGE_EGT = 1200;
    Definitions.MIN_GAUGE_EGT_RED = 850;
    Definitions.MAX_GAUGE_EGT_RED = 1200;
    Definitions.MIN_GAUGE_N1 = 0;
    Definitions.MAX_GAUGE_N1 = 110;
    Definitions.THROTTLE_TO_N1_GAUGE = 100 / Definitions.MAX_GAUGE_N1;
    Definitions.MIN_GAUGE_N1_RED = 100;
    Definitions.MAX_GAUGE_N1_RED = 110;
    Definitions.MAX_FF = 9900;
    A320_Neo_UpperECAM.Definitions = Definitions;
    function createDiv(_id, _class = "", _text = "") {
        var div = document.createElement("div");
        if (_id.length > 0) {
            div.id = _id;
        }
        if (_class.length > 0) {
            div.className = _class;
        }
        if (_text.length > 0) {
            div.textContent = _text;
        }
        return div;
    }
    A320_Neo_UpperECAM.createDiv = createDiv;
    function createSVGText(_text, _class, _x, _y, _alignmentBaseline = "center") {
        var textElement = document.createElementNS(Avionics.SVG.NS, "text");
        textElement.textContent = _text;
        textElement.setAttribute("class", _class);
        textElement.setAttribute("x", _x);
        textElement.setAttribute("y", _y);
        textElement.setAttribute("alignment-baseline", _alignmentBaseline);
        return textElement;
    }
    A320_Neo_UpperECAM.createSVGText = createSVGText;
    function createSVGCircle(_class, _radius, _x, _y) {
        var circleElement = document.createElementNS(Avionics.SVG.NS, "circle");
        circleElement.setAttribute("class", _class);
        circleElement.setAttribute("r", _radius);
        circleElement.setAttribute("cx", _x);
        circleElement.setAttribute("cy", _y);
        return circleElement;
    }
    A320_Neo_UpperECAM.createSVGCircle = createSVGCircle;
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            this.allPanels = [];
        }
        get templateID() { return "UpperECAMTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        getADIRSMins() {
            const secs = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_TIME", "seconds");
            const mins = Math.floor(secs/60);
            if (secs > 0) return mins;
            else return -1;
        }
        getEngineFireGroundActions(_engine) {
            return [
                {
                    style: "remark",
                    message: "WHEN A/C IS STOPPED"
                },
                {
                    style: "action",
                    message: "PARKING BRK",
                    action: "ON",
                    isCompleted: () => {
                        return SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool") == 1;
                    }
                },
                {
                    style: "action",
                    message: "ATC",
                    action: "NOTIFY",
                },
                {
                    style: "action",
                    message: "CABIN CREW",
                    action: "ALERT"
                },
                {
                    style: "action",
                    message: `ENG ${_engine} FIRE P/B`,
                    action: "PUSH"
                },
                {
                    style: "action",
                    message: "AGENT 1",
                    action: "DISCH"
                },
                {
                    style: "action",
                    message: "AGENT 2",
                    action: "DISCH"
                }
            ];
        }
        init() {
            this.enginePanel = new A320_Neo_UpperECAM.EnginePanel(this, "EnginesPanel");
            this.infoTopPanel = new A320_Neo_UpperECAM.InfoTopPanel(this, "InfoTopPanel");
            this.flapsPanel = new A320_Neo_UpperECAM.FlapsPanel(this, "FlapsPanel");
            this.activeTakeoffConfigWarnings = [];
            this.ecamMessages = {
                failures: [
                    {
                        name: "ENG 1 FIRE",
                        messages: [
                            {
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("L:FIRE_TEST_ENG1", "Bool") && Simplane.getIsGrounded();
                                },
                                actions: this.getEngineFireGroundActions(1)
                            },
                        ]
                    },
                    {
                        name: "ENG 2 FIRE",
                        messages: [
                            {
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("L:FIRE_TEST_ENG2", "Bool") && Simplane.getIsGrounded();
                                },
                                actions: this.getEngineFireGroundActions(2)
                            },
                        ]
                    },
                    {
                        name: "APU FIRE",
                        messages: [
                            {
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("L:FIRE_TEST_APU", "Bool")
                                },
                                actions: [
                                    {
                                        style: "remark",
                                        message: "WHEN A/C IS STOPPED"
                                    },
                                    {
                                        style: "action",
                                        message: "PARKING BRK",
                                        action: "ON",
                                        isCompleted: () => {
                                            return SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool") == 1;
                                        }
                                    },
                                    {
                                        style: "action",
                                        message: "ATC",
                                        action: "NOTIFY",
                                    },
                                    {
                                        style: "action",
                                        message: "CABIN CREW",
                                        action: "ALERT"
                                    },
                                    {
                                        style: "action",
                                        message: "APU FIRE P/B",
                                        action: "PUSH"
                                    },
                                    {
                                        style: "action",
                                        message: "AGENT",
                                        action: "DISCH"
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        name: "CONFIG",
                        messages: [
                            {
                                id: "config_flaps",
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return this.activeTakeoffConfigWarnings.includes("flaps") && Simplane.getIsGrounded();
                                },
                                alwaysShowCategory: true,
                                actions: [
                                    {
                                        style: "fail-3",
                                        message: "FLAPS NOT IN T.O CONFIG"
                                    }
                                ]
                            },
                            {
                                id: "config_spd_brk",
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return this.activeTakeoffConfigWarnings.includes("spd_brk") && Simplane.getIsGrounded();
                                },
                                alwaysShowCategory: true,
                                actions: [
                                    {
                                        style: "fail-3",
                                        message: "SPD BRK NOT RETRACTED"
                                    }
                                ]
                            },
                            {
                                id: "config_park_brake",
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return this.activeTakeoffConfigWarnings.includes("park_brake") && Simplane.getIsGrounded();
                                },
                                alwaysShowCategory: true,
                                actions: [
                                    {
                                        style: "fail-3",
                                        message: "PARK BRAKE ON"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "CAB PR",
                        messages: [
                            {
                                message: "EXCESS CAB ALT",
                                level: 3,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet") > 10000;
                                },
                                actions: [
                                    {
                                        style: "action",
                                        message: "CREW OXY MASK",
                                        action: "ON"
                                    },
                                    {
                                        style: "action",
                                        message: "DESCENT",
                                        action: "INITIATE",
                                        isCompleted: () => {
                                            return SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute") < -100;
                                        }
                                    },
                                    {
                                        style: "remark",
                                        message: "IF RAPID DECOMPRESSION"
                                    },
                                    {
                                        style: "action-underline",
                                        message: "EMER DESCENT FL 100/MEA",
                                    },
                                    {
                                        style: "action",
                                        message: "SPEED BRK",
                                        action: "FULL",
                                        isCompleted: () => {
                                            return SimVar.GetSimVarValue("SPOILERS HANDLE POSITION", "Position") > 0.95;
                                        }
                                    },
                                    {
                                        style: "action",
                                        message: "SPD",
                                        action: "MAX/APPROPRIATE"
                                    },
                                    {
                                        style: "remark",
                                        message: "IF CAB ALT>14000FT"
                                    },
                                    {
                                        style: "action",
                                        message: "PAX OXY MASKS",
                                        action: "MAN ON"
                                    },
                                ]
                            }
                        ]
                    },
                    {
                        name: "NAV",
                        messages: [
                            {
                                message: "TCAS FAULT",
                                level: 2,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum") != 2;
                                },
                            }
                        ]
                    },
                    {
                        name: "Cargo Smoke",
                        messages: [
                            {
                                message: "",
                                level: 3,
                                isActive: () => {
                                    return SimVar.GetSimVarValue("L:FIRE_TEST_SMOKE", "Bool")
                                },
                                actions: [
                                    {
                                        style: "remark",
                                        message: "WHEN A/C IS STOPPED"
                                    },
                                    {
                                        style: "action",
                                        message: "PARKING BRK",
                                        action: "ON",
                                        isCompleted: () => {
                                            return SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool") == 1;
                                        }
                                    },
                                    {
                                        style: "action",
                                        message: "ATC",
                                        action: "NOTIFY",
                                    },
                                    {
                                        style: "action",
                                        message: "CABIN CREW",
                                        action: "ALERT"
                                    },
                                    {
                                        style: "action",
                                        message: "AGENT 1",
                                        action: "DISCH"
                                    },
                                    {
                                        style: "action",
                                        message: "AGENT 2",
                                        action: "DISCH"
                                    },
                                ]
                            },
                        ]
                    },
                ],
                normal: [
                    {
                        message: "IR IN ALIGN 0 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 0;
                        }
                    },
                    {
                        message: "IR IN ALIGN 1 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 1;
                        }
                    },
                    {
                        message: "IR IN ALIGN 2 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 2;
                        }
                    },
                    {
                        message: "IR IN ALIGN 3 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 3;
                        }
                    },
                    {
                        message: "IR IN ALIGN 4 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 4;
                        }
                    },
                    {
                        message: "IR IN ALIGN 5 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 5;
                        }
                    },
                    {
                        message: "IR IN ALIGN 6 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 6;
                        }
                    },
                    {
                        message: "IR IN ALIGN 7 MN",
                        isActive: () => {
                            return this.getADIRSMins() == 7;
                        }
                    },
                    {
                        message: "IR IN ALIGN >7 MN",
                        isActive: () => {
                            return this.getADIRSMins() > 7;
                        }
                    },
                    {
                        message: "GND SPLRS ARMED",
                        isActive: () => {
                            return SimVar.GetSimVarValue("SPOILERS ARMED", "Bool") == 1;
                        }
                    },
                    {
                        message: "SEAT BELTS",
                        isActive: () => {
                            return SimVar.GetSimVarValue("L:XMLVAR_SWITCH_OVHD_INTLT_SEATBELT_Position", "Bool") == 1;
                        }
                    },
                    {
                        message: "NO SMOKING",
                        isActive: () => {
                            return SimVar.GetSimVarValue("L:A32NX_NO_SMOKING_MEMO", "Bool") == 1;
                        }
                    }
                ]
            }
            this.secondaryEcamMessage = {
                failures: [],
                normal: [
                    {
                        message: "T.O. INHIBIT",
                        style: "InfoSpecial",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum") <= 2) && (SimVar.GetSimVarValue("L:A32NX_Preflight_Complete", "Bool") == 1);
                        }
                    },
                    {
                        message: "LDG INHIBIT",
                        style: "InfoSpecial",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum") == 6) && (SimVar.GetSimVarValue("RADIO HEIGHT", "feet") < 800);
                        }
                    },
                    {
                        message: "SPEED BRK",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("SPOILERS HANDLE POSITION", "position") > 0);
                        }
                    },
                    {
                        message: "PARK BRK",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool") == 1);
                        }
                    },
                    {
                        message: "HYD PTU",
                        isActive: () => {
                            // Rough approximation until hydraulic system fully implemented
                            // Needs the last 2 conditions because PTU_ON is (incorrectly) permanently set to true during first engine start
                            return (SimVar.GetSimVarValue("L:XMLVAR_PTU_ON", "Bool") == 1) && (SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent") < 1 || SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent") < 1);
                        }
                    },
                    {
                        message: "ENG A.ICE",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("ENG ANTI ICE:1", "Bool") == 1) || (SimVar.GetSimVarValue("ENG ANTI ICE:2", "Bool") == 1);
                        }
                    },
                    {
                        message: "WING A.ICE",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("STRUCTURAL DEICE SWITCH", "Bool") == 1);
                        }
                    },

                    {
                        message: "APU BLEED",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("BLEED AIR APU", "Bool") == 1) && (SimVar.GetSimVarValue("APU PCT RPM", "Percent") >= 95);
                        }
                    },
                    {
                        message: "APU AVAIL",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("BLEED AIR APU", "Bool") == 0) && (SimVar.GetSimVarValue("APU PCT RPM", "Percent") >= 95);
                        }
                    },
                    {
                        message: "LDG LT",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("LIGHT LANDING ON", "Bool") == 1);
                        }
                    },
                    {
                        message: "AUTO BRK LO",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") == 1);
                        }
                    },
                    {
                        message: "AUTO BRK MED",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") == 2);
                        }
                    },
                    {
                        message: "AUTO BRK MAX",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") == 3);
                        }
                    },
                    {
                        message: "GPWS FLAP 3",
                        isActive: () => {
                            return (SimVar.GetSimVarValue("L:PUSH_OVHD_GPWS_LDG", "Bool") == 1);
                        }
                    }
                ]
            }
            this.leftEcamMessagePanel = new A320_Neo_UpperECAM.EcamMessagePanel(this, "left-msg", 7, this.ecamMessages);
            this.rightEcamMessagePanel = new A320_Neo_UpperECAM.EcamMessagePanel(this, "right-msg", 7, this.secondaryEcamMessage);
            this.takeoffMemo = new A320_Neo_UpperECAM.Memo(this, "to-memo", "T.O", [
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-autobrk",
                                                    "AUTO BRK",
                                                    "MAX",
                                                    "MAX",
                                                    function() {
                                                        return (SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") == 3);
                                                    }),
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-signs",
                                                    "SIGNS",
                                                    "ON",
                                                    "ON",
                                                    function() {
                                                        return (SimVar.GetSimVarValue("L:XMLVAR_SWITCH_OVHD_INTLT_SEATBELT_Position", "Bool") > 0);
                                                    }),
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-cabin",
                                                    "CABIN",
                                                    "CHECK",
                                                    "READY",
                                                    function() {
                                                        return (SimVar.GetSimVarValue("L:A32NX_CABIN_READY", "Bool") == 1);
                                                    }),
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-splrs",
                                                    "SPLRS",
                                                    "ARM",
                                                    "ARM",
                                                    function() {
                                                        return (SimVar.GetSimVarValue("SPOILERS ARMED", "Bool") == 1);
                                                    }),
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-flaps",
                                                    "FLAPS",
                                                    "T.O",
                                                    "T.O",
                                                    function() {
                                                        return (SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Enum") >= 1);
                                                    }),
                                                new A320_Neo_UpperECAM.MemoItem(
                                                    "to-memo-config",
                                                    "T.O CONFIG",
                                                    "TEST",
                                                    "NORMAL",
                                                    function() {
                                                        return SimVar.GetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool") == 1;
                                                    })
                                                 ],);
            
            this.landingMemo = new A320_Neo_UpperECAM.Memo(this, "ldg-memo", "LDG", [
                                                    new A320_Neo_UpperECAM.MemoItem(
                                                        "ldg-memo-gear",
                                                        "LDG GEAR",
                                                        "DN",
                                                        "DN",
                                                        function() {
                                                            return (SimVar.GetSimVarValue("GEAR HANDLE POSITION", "Bool") == 1);
                                                        }),
                                                    new A320_Neo_UpperECAM.MemoItem(
                                                        "ldg-memo-signs",
                                                        "SIGNS",
                                                        "ON",
                                                        "ON",
                                                        function() {
                                                            return (SimVar.GetSimVarValue("L:XMLVAR_SWITCH_OVHD_INTLT_SEATBELT_Position", "Bool") > 0);
                                                        }),
                                                    new A320_Neo_UpperECAM.MemoItem(
                                                        "ldg-memo-cabin",
                                                        "CABIN",
                                                        "CHECK",
                                                        "READY",
                                                        function() {
                                                            return (SimVar.GetSimVarValue("L:A32NX_CABIN_READY", "Bool") == 1);
                                                        }),
                                                    new A320_Neo_UpperECAM.MemoItem(
                                                        "ldg-memo-splrs",
                                                        "SPLRS",
                                                        "ARM",
                                                        "ARM",
                                                        function() {
                                                            return (SimVar.GetSimVarValue("SPOILERS ARMED", "Bool") == 1);
                                                        }),
                                                    new A320_Neo_UpperECAM.MemoItem(
                                                        "ldg-memo-flaps",
                                                        "FLAPS",
                                                        "FULL",
                                                        "FULL",
                                                        function() {
                                                            return (SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Enum") == 4);
                                                        })
                                                     ],);
            this.allPanels.push(this.enginePanel);
            this.allPanels.push(this.infoTopPanel);
            this.allPanels.push(this.flapsPanel);
            this.allPanels.push(this.takeoffMemo);
            this.allPanels.push(this.landingMemo);
            this.allPanels.push(this.leftEcamMessagePanel);
            this.allPanels.push(this.rightEcamMessagePanel);
            for (var i = 0; i < this.allPanels.length; ++i) {
                if (this.allPanels[i] != null) {
                    this.allPanels[i].init();
                }
            }
            if (this.infoPanelsManager != null) {
                this.infoPanelsManager.init(this.infoBottomLeftPanel, this.infoBottomRightPanel);
            }
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            for (var i = 0; i < this.allPanels.length; ++i) {
                if (this.allPanels[i] != null) {
                    this.allPanels[i].update(_deltaTime);
                }
            }
            
            //Show takeoff memo 2 mins after second engine start
            //Hides after takeoff thurst application
            if (SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent") > 15 && SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent") > 15 && SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number") <= 2 && SimVar.GetSimVarValue("L:A32NX_Preflight_Complete", "Bool") == 0 && this.leftEcamMessagePanel.hasActiveFailures == false) {
                if (this.takeoffMemoTimer == null) this.takeoffMemoTimer = 120;
                if (this.takeoffMemoTimer > 0) {
                    this.takeoffMemoTimer -= _deltaTime/1000;
                } else {
                    this.showTakeoffMemo = true;
                }
                
            } else {
                this.takeoffMemoTimer = null;
                this.showTakeoffMemo = false;
            }

            //Show landing memo at 2000ft
            //Hides after slowing down to 80kts
            if (SimVar.GetSimVarValue("RADIO HEIGHT", "Feet") < 2000 && SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number") == 6 && SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots") > 80 && !this.leftEcamMessagePanel.hasActiveFailures) {
                this.showLandingMemo = true;
            } else {
                this.showLandingMemo = false;
            }

            if (this.takeoffMemo != null) this.takeoffMemo.divMain.style.display = this.showTakeoffMemo ? "block" : "none";
            if (this.landingMemo != null) this.landingMemo.divMain.style.display = this.showLandingMemo ? "block" : "none";
            //Hide left message panel when memo is diplayed
            if (this.leftEcamMessagePanel != null) this.leftEcamMessagePanel.divMain.style.display = (this.showTakeoffMemo || this.showLandingMemo) ? "none" : "block";

            if (SimVar.GetSimVarValue("L:A32NX_BTN_TOCONFIG", "Bool") == 1) {
                SimVar.SetSimVarValue("L:A32NX_BTN_TOCONFIG", "Bool", 0);
                this.updateTakeoffConfigWarnings(true);
            }

            if (SimVar.GetSimVarValue("L:A32NX_BTN_CLR", "Bool") == 1 || SimVar.GetSimVarValue("L:A32NX_BTN_CLR2", "Bool") == 1) {
                SimVar.SetSimVarValue("L:A32NX_BTN_CLR", "Bool", 0);
                SimVar.SetSimVarValue("L:A32NX_BTN_CLR2", "Bool", 0);
                this.leftEcamMessagePanel.clearHighestCategory();
            }

            if (SimVar.GetSimVarValue("L:A32NX_BTN_RCL", "Bool") == 1) {
                SimVar.SetSimVarValue("L:A32NX_BTN_RCL", "Bool", 0);
                this.leftEcamMessagePanel.recall();
            }
            const leftThrottleDetent = Simplane.getEngineThrottleMode(0);
            const rightThrottleDetent = Simplane.getEngineThrottleMode(1);
            const highestThrottleDetent = (leftThrottleDetent >= rightThrottleDetent) ? leftThrottleDetent : rightThrottleDetent;
            if (highestThrottleDetent == ThrottleMode.TOGA || highestThrottleDetent == ThrottleMode.FLEX_MCT) {
                this.updateTakeoffConfigWarnings(false);
            }

            if (Simplane.getCurrentFlightPhase() > 2) {
                this.activeTakeoffConfigWarnings = [];
            }
      
            if (!(this.leftEcamMessagePanel.hasCautions)) SimVar.SetSimVarValue("L:A32NX_MASTER_CAUTION", "Bool", 0);
            if (!(this.leftEcamMessagePanel.hasWarnings)) SimVar.SetSimVarValue("L:A32NX_MASTER_WARNING", "Bool", 0);

            if ((SimVar.GetSimVarValue("L:PUSH_OVHD_CALLS_ALL", "Bool") == 1) || (SimVar.GetSimVarValue("L:PUSH_OVHD_CALLS_FWD", "Bool") == 1) || (SimVar.GetSimVarValue("L:PUSH_OVHD_CALLS_AFT", "Bool") == 1)) {
                SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 1);
            }
        }
        updateTakeoffConfigWarnings(_test) {
            const flaps = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Enum");
            const speedBrake = SimVar.GetSimVarValue("SPOILERS HANDLE POSITION", "Position");
            const parkBrake = SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool");
            this.activeTakeoffConfigWarnings = [];
            if (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum") > 2) return;
            if (!(flaps >= 1 && flaps <= 2)) this.activeTakeoffConfigWarnings.push("flaps");
            if (speedBrake > 0) this.activeTakeoffConfigWarnings.push("spd_brk");
            if (parkBrake == 1 && !_test) this.activeTakeoffConfigWarnings.push("park_brake");
            if (_test && this.activeTakeoffConfigWarnings.length == 0) {
                SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 1);
                this.takeoffMemoTimer = 0;
            } else {
                SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
                this.leftEcamMessagePanel.recall("config_flaps");
                this.leftEcamMessagePanel.recall("config_spd_brk");
                this.leftEcamMessagePanel.recall("config_park_brake");
            }
        }
        getInfoPanelManager() {
            return this.infoPanelsManager;
        }
        ;
    }
    A320_Neo_UpperECAM.Display = Display;
    class PanelBase {
        constructor(_parent, _divID) {
            this.parent = _parent;
            this.divID = _divID;
        }
        init() {
            this.create();
        }
        update(_deltaTime) {
        }
        create() {
            if (this.parent != null) {
                this.divMain = A320_Neo_UpperECAM.createDiv(this.divID);
                this.parent.appendChild(this.divMain);
            }
        }
    }
    A320_Neo_UpperECAM.PanelBase = PanelBase;
    class EnginePanel extends A320_Neo_UpperECAM.PanelBase {
        constructor() {
            super(...arguments);
            this.engines = [];
            this.linesStyleInfo = [];
        }
        update(_deltaTime) {
            super.update(_deltaTime);
            for (var i = 0; i < this.engines.length; ++i) {
                this.engines[i].update(_deltaTime);
            }
            for (var i = 0; i < this.linesStyleInfo.length; ++i) {
                this.linesStyleInfo[i].update(_deltaTime);
            }
        }
        create() {
            super.create();
            for (var i = 0; i < 2; i++) {
                this.engines.push(new A320_Neo_UpperECAM.Engine(this.divMain, i));
                this.engines[i].init();
            }
            var gaugeInfoDiv = A320_Neo_UpperECAM.createDiv("GaugeInfo");
            this.statusDiv = A320_Neo_UpperECAM.createDiv("", "STATUS", "");
            gaugeInfoDiv.appendChild(this.statusDiv);
            gaugeInfoDiv.appendChild(A320_Neo_UpperECAM.createDiv("", "SLOT1_TITLE", "N1"));
            gaugeInfoDiv.appendChild(A320_Neo_UpperECAM.createDiv("", "SLOT1_UNIT", "%"));
            gaugeInfoDiv.appendChild(A320_Neo_UpperECAM.createDiv("", "SLOT2_TITLE", "EGT"));
            gaugeInfoDiv.appendChild(A320_Neo_UpperECAM.createDiv("", "SLOT2_UNIT", String.fromCharCode(176) + "C"));
            this.linesStyleInfo.push(new A320_Neo_UpperECAM.LinesStyleInfo_N2(this.divMain, "20%"));
            this.linesStyleInfo.push(new A320_Neo_UpperECAM.LinesStyleInfo_FF(this.divMain, "3%"));
            this.divMain.appendChild(gaugeInfoDiv);
        }
    }
    A320_Neo_UpperECAM.EnginePanel = EnginePanel;
    class Engine {
        constructor(_parent, _index) {
            this.allGauges = [];
            this.parent = _parent;
            this.index = _index;
        }
        init() {
            this.divMain = A320_Neo_UpperECAM.createDiv("Engine" + this.index, "engine");
            this.createN1Gauge();
            this.createEGTGauge();
            this.parent.appendChild(this.divMain);
            this.timerTOGA = -1;
            this.throttleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
        }
        update(_deltaTime) {
            if (this.allGauges != null) {
                var active = A320_Neo_ECAM_Common.isEngineDisplayActive(this.index + 1);
                for (var i = 0; i < this.allGauges.length; ++i) {
                    if (this.allGauges[i] != null) {
                        this.allGauges[i].active = active;
                        this.allGauges[i].update(_deltaTime);
                    }
                }
            }
            var currentThrottleState = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
            if(this.throttleMode != currentThrottleState){
                this.throttleMode = currentThrottleState;
            }
            if(this.throttleMode == ThrottleMode.TOGA){
                if(this.timerTOGA == -1){
                    this.timerTOGA = 300;
                }
                if(this.timerTOGA >= 0){
                    this.timerTOGA -= _deltaTime/1000;
                }
            }
            else{
                this.timerTOGA = -1;
            }
        }
        createEGTGauge() {
            var gaugeDef = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef.startAngle = -180;
            gaugeDef.arcSize = 180;
            gaugeDef.minValue = A320_Neo_UpperECAM.Definitions.MIN_GAUGE_EGT;
            gaugeDef.maxValue = A320_Neo_UpperECAM.Definitions.MAX_GAUGE_EGT;
            gaugeDef.minRedValue = A320_Neo_UpperECAM.Definitions.MIN_GAUGE_EGT_RED;
            gaugeDef.maxRedValue = A320_Neo_UpperECAM.Definitions.MAX_GAUGE_EGT_RED;
            gaugeDef.cursorLength = 0.4;
            gaugeDef.currentValuePos.x = 0.75;
            gaugeDef.currentValuePos.y = 0.5;
            gaugeDef.currentValueBorderWidth = 0.5;
            gaugeDef.dangerRange[0] = gaugeDef.minRedValue;
            gaugeDef.dangerRange[1] = gaugeDef.maxRedValue;
            gaugeDef.dangerMinDynamicFunction = this.getModeEGTMax.bind(this);
            gaugeDef.currentValueFunction = this.getEGTGaugeValue.bind(this);
            gaugeDef.currentValuePrecision = 0;
            this.gaugeEGT = window.document.createElement("a320-neo-ecam-gauge");
            this.gaugeEGT.id = "EGT_Gauge";
            this.gaugeEGT.init(gaugeDef);
            this.gaugeEGT.addGraduation(0, true);
            this.gaugeEGT.addGraduation(500, true);
            this.gaugeEGT.addGraduation(1000, false);
            this.divMain.appendChild(this.gaugeEGT);
            this.allGauges.push(this.gaugeEGT);
        }
        createN1Gauge() {
            var gaugeDef = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef.minValue = A320_Neo_UpperECAM.Definitions.MIN_GAUGE_N1;
            gaugeDef.maxValue = A320_Neo_UpperECAM.Definitions.MAX_GAUGE_N1;
            gaugeDef.arcSize = 200;
            gaugeDef.minRedValue = A320_Neo_UpperECAM.Definitions.MIN_GAUGE_N1_RED;
            gaugeDef.currentValuePos.x = 1.0;
            gaugeDef.currentValuePos.y = 0.75;
            gaugeDef.currentValueBorderWidth = 0.55;
            gaugeDef.outerIndicatorFunction = this.getN1GaugeThrottleValue.bind(this);
            gaugeDef.outerDynamicArcFunction = this.getN1GaugeAutopilotThrottleValues.bind(this);
            gaugeDef.extraMessageFunction = this.getN1GaugeExtraMessage.bind(this);
            gaugeDef.maxRedValue = A320_Neo_UpperECAM.Definitions.MAX_GAUGE_N1_RED;
            gaugeDef.dangerRange[0] = gaugeDef.minRedValue;
            gaugeDef.dangerRange[1] = gaugeDef.maxRedValue;
            gaugeDef.dangerMinDynamicFunction = this.getModeN1Max.bind(this);
            gaugeDef.currentValueFunction = this.getN1GaugeValue.bind(this);
            gaugeDef.currentValuePrecision = 1;
            this.gaugeN1 = window.document.createElement("a320-neo-ecam-gauge");
            this.gaugeN1.id = "N1_Gauge";
            this.gaugeN1.init(gaugeDef);
            this.gaugeN1.addGraduation(0, true);
            this.gaugeN1.addGraduation(50, true, "5");
            this.gaugeN1.addGraduation(60, true);
            this.gaugeN1.addGraduation(70, true);
            this.gaugeN1.addGraduation(80, true);
            this.gaugeN1.addGraduation(90, true);
            this.gaugeN1.addGraduation(100, true, "10", true);
            this.divMain.appendChild(this.gaugeN1);
            this.allGauges.push(this.gaugeN1);
        }
        getModeEGTMax(){
            if(this.throttleMode == ThrottleMode.TOGA && this.timerTOGA > 0){
                return 1060;
            }
            else if(this.throttleMode == ThrottleMode.TOGA && this.timerTOGA <0){
                return 1025;
            }
            if(this.throttleMode == ThrottleMode.FLEX_MCT){
                return 1025;
            }
            if(this.throttleMode == ThrottleMode.CLIMB){
                return 875;
            }
            if(this.ThrottleMode == ThrottleMode.AUTO){
                return 850;
            }
            else{
                return 750;
            }
        }
        getModeN1Max(){
            if(this.throttleMode == ThrottleMode.TOGA && this.timerTOGA > 0){
                return 101.5;
            }
            else{
                return 100;
            }
        }
        getEGTGaugeValue() {
            var engineId = this.index + 1;
            var value = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:" + engineId, "celsius");
            return value;
        }
        getN1GaugeValue() {
            var engineId = (this.index + 1);
            var value = SimVar.GetSimVarValue("ENG N1 RPM:" + engineId, "percent");
            return value;
        }
        getN1GaugeThrottleValue() {
            var throttle = Math.abs(Simplane.getEngineThrottleCommandedN1(this.index));
            var value = throttle * A320_Neo_UpperECAM.Definitions.THROTTLE_TO_N1_GAUGE;
            return value;
        }
        getN1GaugeAutopilotThrottleValues(_values) {
            if ((_values != null) && (_values.length == 2)) {
                if (Simplane.getAutoPilotThrottleActive()) {
                    var engineThrottle = this.getN1GaugeValue();
                    var autopilotThrottle = Simplane.getAutopilotCommandedN1(this.index);
                    if (engineThrottle < autopilotThrottle) {
                        _values[0] = engineThrottle;
                        _values[1] = autopilotThrottle;
                    }
                    else {
                        _values[0] = autopilotThrottle;
                        _values[1] = engineThrottle;
                    }
                }
                else {
                    _values[0] = 0;
                    _values[1] = 0;
                }
            }
        }
        getN1GaugeExtraMessage() {
            if (Simplane.getEngineThrottle(this.index) < 0) {
                return "REV";
            }
            else {
                return "";
            }
        }
    }
    A320_Neo_UpperECAM.Engine = Engine;
    class LinesStyleComponent_Base {
        constructor(_svgRoot) {
            if (_svgRoot != null) {
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", this.getLineX1());
                line.setAttribute("x2", this.getLineX2());
                line.setAttribute("y1", "85%");
                line.setAttribute("y2", "70%");
                line.style.stroke = "rgb(60, 60, 60)";
                line.style.strokeWidth = "2";
                _svgRoot.appendChild(line);
                this.valueText = A320_Neo_UpperECAM.createSVGText("--.-", "Value", this.getValueTextX(), "100%", "bottom");
                _svgRoot.appendChild(this.valueText);
            }
            this.refresh(false, 0, 0, true);
        }
        refresh(_active, _value, _valueDisplayPrecision, _force = false) {
            if ((this.isActive != _active) || (this.currentValue != _value) || _force) {
                this.isActive = _active;
                this.currentValue = _value;
                if (this.valueText != null) {
                    var valueClass = this.isActive ? "Value" : "Inactive";
                    this.valueText.setAttribute("class", valueClass);
                    if (this.isActive) {
                        this.valueText.textContent = this.currentValue.toFixed(_valueDisplayPrecision);
                    }
                    else {
                        this.valueText.textContent = "XX";
                    }
                }
            }
        }
    }
    A320_Neo_UpperECAM.LinesStyleComponent_Base = LinesStyleComponent_Base;
    class LinesStyleComponent_Left extends LinesStyleComponent_Base {
        getLineX1() { return "37%"; }
        getLineX2() { return "43%"; }
        getValueTextX() { return "25%"; }
    }
    A320_Neo_UpperECAM.LinesStyleComponent_Left = LinesStyleComponent_Left;
    class LinesStyleComponent_Right extends LinesStyleComponent_Base {
        getLineX1() { return "63%"; }
        getLineX2() { return "57%"; }
        getValueTextX() { return "75%"; }
    }
    A320_Neo_UpperECAM.LinesStyleComponent_Right = LinesStyleComponent_Right;
    class LinesStyleInfo {
        constructor(_divMain, _bottomValue) {
            var svgRoot = document.createElementNS(Avionics.SVG.NS, "svg");
            svgRoot.appendChild(A320_Neo_UpperECAM.createSVGText(this.getTitle(), "Title", "50%", "75%", "bottom"));
            svgRoot.appendChild(A320_Neo_UpperECAM.createSVGText(this.getUnit(), "Unit", "50%", "100%", "bottom"));
            this.leftComponent = new LinesStyleComponent_Left(svgRoot);
            this.rightComponent = new LinesStyleComponent_Right(svgRoot);
            var div = A320_Neo_UpperECAM.createDiv("LineStyleInfos");
            div.style.bottom = _bottomValue;
            div.appendChild(svgRoot);
            _divMain.appendChild(div);
        }
        update(_deltaTime) {
            if (this.leftComponent != null) {
                this.leftComponent.refresh(A320_Neo_ECAM_Common.isEngineDisplayActive(1), this.getValue(1), this.getValueStringPrecision());
            }
            if (this.rightComponent != null) {
                this.rightComponent.refresh(A320_Neo_ECAM_Common.isEngineDisplayActive(2), this.getValue(2), this.getValueStringPrecision());
            }
        }
        getValueStringPrecision() { return 0; }
    }
    A320_Neo_UpperECAM.LinesStyleInfo = LinesStyleInfo;
    class LinesStyleInfo_N2 extends LinesStyleInfo {
        getTitle() {
            return "N2";
        }
        getUnit() {
            return "%";
        }
        getValue(_engine) {
            var name = "ENG N2 RPM:" + _engine;
            var percent = SimVar.GetSimVarValue(name, "percent");
            percent = Math.max(0, Math.min(100, percent));
            return percent;
        }
        getValueStringPrecision() { return 1; }
    }
    A320_Neo_UpperECAM.LinesStyleInfo_N2 = LinesStyleInfo_N2;
    class LinesStyleInfo_FF extends LinesStyleInfo {
        constructor(_divMain, _bottomValue) {
            super(_divMain, _bottomValue);
            this.gallonToKG = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram");
        }
        getTitle() {
            return "FF";
        }
        getUnit() {
            return "KG/H";
        }
        getValue(_engine) {
            var value = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + _engine, "gallons per hour") * this.gallonToKG;
            return value;
        }
    }
    A320_Neo_UpperECAM.LinesStyleInfo_FF = LinesStyleInfo_FF;
    class InfoTopPanel extends A320_Neo_UpperECAM.PanelBase {
        create() {
            super.create();
            if (this.divMain != null) {
                var statusDiv = A320_Neo_UpperECAM.createDiv("Status");
                this.throttleState = A320_Neo_UpperECAM.createDiv("ThrottleState");
                statusDiv.appendChild(this.throttleState);
                this.throttleValue = A320_Neo_UpperECAM.createDiv("ThrottleValue");
                statusDiv.appendChild(this.throttleValue);
                this.flexTemperature = A320_Neo_UpperECAM.createDiv("FlexTemperature");
                statusDiv.appendChild(this.flexTemperature);
                this.divMain.appendChild(statusDiv);
                var fuelOnBoardDiv = A320_Neo_UpperECAM.createDiv("FuelOnBoard");
                fuelOnBoardDiv.appendChild(A320_Neo_UpperECAM.createDiv("Title", "", "FOB :"));
                this.fobValue = A320_Neo_UpperECAM.createDiv("Value");
                fuelOnBoardDiv.appendChild(this.fobValue);
                fuelOnBoardDiv.appendChild(A320_Neo_UpperECAM.createDiv("Unit", "", "KG"));
                this.divMain.appendChild(fuelOnBoardDiv);
            }
            this.setThrottle(false, 0, ThrottleMode.UNKNOWN, true);
            this.setFlexTemperature(false, 0, true);
            this.setFuelOnBoard(0, true);
        }
        update(_deltaTime) {
            super.update(_deltaTime);
            if (Simplane.getEngineActive(0) || Simplane.getEngineActive(1)) {
                var throttleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
                if (Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    var throttleValue = Math.max(Simplane.getEngineThrottle(0), Simplane.getEngineThrottle(1));
                    if (throttleMode == ThrottleMode.FLEX_MCT) {
                        this.setThrottle(true, throttleValue, throttleMode, true);
                        var flexTemp = Simplane.getFlexTemperature();
                        this.setFlexTemperature((flexTemp > 0), flexTemp);
                    }
                    else {
                        this.setThrottle(true, throttleValue, throttleMode);
                        this.setFlexTemperature(false);
                    }
                }
                else {
                    this.setThrottle(true, Math.max(Simplane.getEngineCommandedN1(0), Simplane.getEngineCommandedN1(1)), throttleMode);
                    this.setFlexTemperature(false);
                }
            }
            else {
                this.setThrottle(false);
                this.setFlexTemperature(false);
            }
            this.setFuelOnBoard(SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "kg"));
        }
        setThrottle(_active, _value = 0, _mode = ThrottleMode.UNKNOWN, _force = false) {
            if ((_active != this.throttleIsActive) || (_value != this.currentThrottleValue) || (_mode != this.currentThrottleMode) || _force) {
                this.throttleIsActive = _active;
                this.currentThrottleValue = _value;
                this.currentThrottleMode = _mode;
                if (this.throttleState != null) {
                    if (_active && (this.currentThrottleMode != ThrottleMode.UNKNOWN)) {
                        this.throttleState.className = "active";
                        switch (this.currentThrottleMode) {
                            case ThrottleMode.TOGA:
                                {
                                    this.throttleState.textContent = "TO/GA";
                                    break;
                                }
                            case ThrottleMode.FLEX_MCT:
                                {
                                    if ((Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) && (Simplane.getFlexTemperature() > 0)) {
                                        this.throttleState.textContent = "FLX";
                                    }
                                    else {
                                        this.throttleState.textContent = "MCT";
                                    }
                                    break;
                                }
                            case ThrottleMode.CLIMB:
                                {
                                    this.throttleState.textContent = "CL";
                                    break;
                                }
                            case ThrottleMode.AUTO:
                                {
                                    this.throttleState.textContent = "AUTO";
                                    break;
                                }
                            case ThrottleMode.IDLE:
                                {
                                    this.throttleState.textContent = "IDLE";
                                    break;
                                }
                            case ThrottleMode.REVERSE:
                                {
                                    this.throttleState.textContent = "REV";
                                    break;
                                }
                        }
                    }
                    else {
                        this.throttleState.className = "inactive";
                        this.throttleState.textContent = "XX";
                    }
                }
                if (this.throttleValue != null) {
                    this.throttleValue.className = _active ? "active" : "inactive";
                    if (_active) {
                        this.throttleValue.textContent = _value.toFixed(1);
                    }
                    else {
                        this.throttleValue.textContent = "XX";
                    }
                }
            }
        }
        setFlexTemperature(_active, _value = 0, _force = false) {
            if ((_active != this.flexTemperatureIsActive) || (_value != this.currentFlexTemperature) || _force) {
                this.currentFlexTemperature = _value;
                this.flexTemperatureIsActive = _active;
                if (this.flexTemperature != null) {
                    this.flexTemperature.textContent = fastToFixed(this.currentFlexTemperature, 0);
                    this.flexTemperature.className = this.flexTemperatureIsActive ? "active" : "inactive";
                }
            }
        }
        setFuelOnBoard(_value, _force = false) {
            if ((this.currentFOBValue != _value) || _force) {
                this.currentFOBValue = _value;
                if (this.fobValue != null) {
                    this.fobValue.textContent = fastToFixed(this.currentFOBValue, 0);
                }
            }
        }
    }
    A320_Neo_UpperECAM.InfoTopPanel = InfoTopPanel;
    class FlapsPanel extends A320_Neo_UpperECAM.PanelBase {
        constructor() {
            super(...arguments);
            this.viewBoxSize = new Vec2(500, 125);
            this.dotSize = 4;
            this.slatArrowPathD = "m20,-12 l-31,6 l0,17, l23,-5 l10,-20";
            this.slatDotPositions = [
                new Vec2(160, 37),
                new Vec2(110, 52),
                new Vec2(68, 68),
                new Vec2(25, 81)
            ];
            this.flapArrowPathD = "m-20,-12 l31,6 l0,17, l-23,-5 l-10,-20";
            this.flapDotPositions = [
                new Vec2(220, 37),
                new Vec2(280, 50),
                new Vec2(327, 61),
                new Vec2(375, 72),
                new Vec2(423, 83)
            ];
            this.sTextPos = new Vec2(66, 32);
            this.fTextPos = new Vec2(330, 32);
            this.currentStateTextPos = new Vec2(190, 87);
            this.mainShapeCorners = [
                new Vec2(180, 25),
                new Vec2(200, 25),
                new Vec2(210, 45),
                new Vec2(170, 45)
            ];
        }
        create() {
            super.create();
            var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            rootSVG.setAttribute("id", "DiagramSVG");
            rootSVG.setAttribute("viewBox", "0 0 " + this.viewBoxSize.x + " " + this.viewBoxSize.y);
            this.divMain.appendChild(rootSVG);
            this.hideOnInactiveGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.hideOnInactiveGroup.setAttribute("id", "HideOnInactive");
            rootSVG.appendChild(this.hideOnInactiveGroup);
            var shape = document.createElementNS(Avionics.SVG.NS, "path");
            shape.setAttribute("class", "shape");
            {
                var d = [
                    "M", this.mainShapeCorners[0].x, ",", this.mainShapeCorners[0].y,
                    " L", this.mainShapeCorners[1].x, ",", this.mainShapeCorners[1].y,
                    " L", this.mainShapeCorners[2].x, ",", this.mainShapeCorners[2].y,
                    " L", this.mainShapeCorners[3].x, ",", this.mainShapeCorners[3].y,
                    " Z"
                ].join("");
                shape.setAttribute("d", d);
            }
            rootSVG.appendChild(shape);
            this.currentSlatsArrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.currentSlatsArrow.setAttribute("class", "currentArrow");
            rootSVG.appendChild(this.currentSlatsArrow);
            this.currentFlapsArrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.currentFlapsArrow.setAttribute("class", "currentArrow");
            rootSVG.appendChild(this.currentFlapsArrow);
            this.targetSlatsArrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.targetSlatsArrow.setAttribute("class", "targetArrow");
            rootSVG.appendChild(this.targetSlatsArrow);
            this.targetFlapsArrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.targetFlapsArrow.setAttribute("class", "targetArrow");
            rootSVG.appendChild(this.targetFlapsArrow);
            this.targetSlatsArrowsStrings = new Array();
            this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[0], this.slatDotPositions[1], 0));
            this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[0], this.slatDotPositions[1], 1));
            this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[1], this.slatDotPositions[2], 1));
            this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[1], this.slatDotPositions[2], 1));
            this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[2], this.slatDotPositions[3], 1));
            this.targetFlapsArrowsStrings = new Array();
            this.targetFlapsArrowsStrings.push(this.generateArrowPathD(this.flapArrowPathD, null, this.flapDotPositions[0], this.flapDotPositions[1], 0));
            this.targetFlapsArrowsStrings.push(this.generateArrowPathD(this.flapArrowPathD, null, this.flapDotPositions[0], this.flapDotPositions[1], 1));
            this.targetFlapsArrowsStrings.push(this.generateArrowPathD(this.flapArrowPathD, null, this.flapDotPositions[1], this.flapDotPositions[2], 1));
            this.targetFlapsArrowsStrings.push(this.generateArrowPathD(this.flapArrowPathD, null, this.flapDotPositions[2], this.flapDotPositions[3], 1));
            this.targetFlapsArrowsStrings.push(this.generateArrowPathD(this.flapArrowPathD, null, this.flapDotPositions[3], this.flapDotPositions[4], 1));
            this.hideOnInactiveGroup.appendChild(A320_Neo_UpperECAM.createSVGText("S", "sfText", this.sTextPos.x.toString(), this.sTextPos.y.toString()));
            this.hideOnInactiveGroup.appendChild(A320_Neo_UpperECAM.createSVGText("F", "sfText", this.fTextPos.x.toString(), this.fTextPos.y.toString()));
            this.currentStateText = A320_Neo_UpperECAM.createSVGText("", "state", this.currentStateTextPos.x.toString(), this.currentStateTextPos.y.toString());
            this.hideOnInactiveGroup.appendChild(this.currentStateText);
            var dotSizeStr = this.dotSize.toString();
            for (var i = 1; i < this.slatDotPositions.length; ++i) {
                this.hideOnInactiveGroup.appendChild(A320_Neo_UpperECAM.createSVGCircle("dot", dotSizeStr, this.slatDotPositions[i].x.toString(), this.slatDotPositions[i].y.toString()));
            }
            for (var i = 1; i < this.flapDotPositions.length; ++i) {
                this.hideOnInactiveGroup.appendChild(A320_Neo_UpperECAM.createSVGCircle("dot", dotSizeStr, this.flapDotPositions[i].x.toString(), this.flapDotPositions[i].y.toString()));
            }
            this.deactivate();
            this.cockpitSettings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        }
        activate() {
            this.isActive = true;
            if (this.hideOnInactiveGroup != null) {
                this.hideOnInactiveGroup.style.display = "block";
            }
        }
        deactivate() {
            this.isActive = false;
            this.currentSlatsAngle = 0;
            this.currentFlapsAngle = 0;
            if (this.hideOnInactiveGroup != null) {
                this.hideOnInactiveGroup.style.display = "none";
            }
            if (this.currentSlatsArrow != null) {
                this.currentSlatsArrow.setAttribute("d", this.targetSlatsArrowsStrings[0]);
            }
            if (this.currentFlapsArrow != null) {
                this.currentFlapsArrow.setAttribute("d", this.targetFlapsArrowsStrings[0]);
            }
            if (this.targetSlatsArrow != null) {
                this.targetSlatsArrow.style.display = "none";
            }
            if (this.targetFlapsArrow != null) {
                this.targetFlapsArrow.style.display = "none";
            }
        }
        update(_deltaTime) {
            super.update(_deltaTime);
            var slatsAngle = (SimVar.GetSimVarValue("LEADING EDGE FLAPS LEFT ANGLE", "degrees") + SimVar.GetSimVarValue("LEADING EDGE FLAPS RIGHT ANGLE", "degrees")) * 0.5;
            var flapsAngle = (SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "degrees") + SimVar.GetSimVarValue("TRAILING EDGE FLAPS RIGHT ANGLE", "degrees")) * 0.5;
            var handleIndex = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "number");
            let slatsTargetIndex = handleIndex;
            let flapsTargetIndex = handleIndex;
            var slatsAngleChanged = (this.currentSlatsAngle != slatsAngle);
            var flapsAngleChanged = (this.currentFlapsAngle != flapsAngle);
            if ((slatsAngleChanged || flapsAngleChanged) && ((this.cockpitSettings != null) && (this.cockpitSettings.FlapsLevels != null) && this.cockpitSettings.FlapsLevels.initialised)) {
                if (slatsAngleChanged) {
                    this.currentSlatsAngle = slatsAngle;
                    var dSlatsArrow = "";
                    if (this.currentSlatsAngle <= 0) {
                        dSlatsArrow = this.targetSlatsArrowsStrings[0];
                    }
                    else if (this.currentSlatsAngle <= this.cockpitSettings.FlapsLevels.slatsAngle[0]) {
                        var lerp = Utils.Clamp(this.currentSlatsAngle / 18, 0, 1);
                        dSlatsArrow = this.generateArrowPathD(this.slatArrowPathD, this.mainShapeCorners[0], this.slatDotPositions[0], this.slatDotPositions[1], lerp);
                    }
                    else if (this.currentSlatsAngle <= this.cockpitSettings.FlapsLevels.slatsAngle[2]) {
                        var lerp = Utils.Clamp((this.currentSlatsAngle - 18) / 4, 0, 1);
                        dSlatsArrow = this.generateArrowPathD(this.slatArrowPathD, this.mainShapeCorners[0], this.slatDotPositions[1], this.slatDotPositions[2], lerp);
                    }
                    else if (this.currentSlatsAngle <= this.cockpitSettings.FlapsLevels.slatsAngle[3]) {
                        var lerp = Utils.Clamp((this.currentSlatsAngle - 22) / 5, 0, 1);
                        dSlatsArrow = this.generateArrowPathD(this.slatArrowPathD, this.mainShapeCorners[0], this.slatDotPositions[2], this.slatDotPositions[3], lerp);
                    }
                    if (this.currentSlatsArrow != null) {
                        this.currentSlatsArrow.setAttribute("d", dSlatsArrow);
                    }
                }
                if (flapsAngleChanged) {
                    this.currentFlapsAngle = flapsAngle;
                    var dFlapsArrow = "";
                    if (this.currentFlapsAngle <= 0) {
                        dFlapsArrow = this.targetFlapsArrowsStrings[0];
                    }
                    else if (this.currentFlapsAngle <= this.cockpitSettings.FlapsLevels.flapsAngle[0]) {
                        var lerp = Utils.Clamp(this.currentFlapsAngle / 10, 0, 1);
                        dFlapsArrow = this.generateArrowPathD(this.flapArrowPathD, this.mainShapeCorners[1], this.flapDotPositions[0], this.flapDotPositions[1], lerp);
                    }
                    else if (this.currentFlapsAngle <= this.cockpitSettings.FlapsLevels.flapsAngle[1]) {
                        var lerp = Utils.Clamp((this.currentFlapsAngle - 10) / 5, 0, 1);
                        dFlapsArrow = this.generateArrowPathD(this.flapArrowPathD, this.mainShapeCorners[1], this.flapDotPositions[1], this.flapDotPositions[2], lerp);
                    }
                    else if (this.currentFlapsAngle <= this.cockpitSettings.FlapsLevels.flapsAngle[2]) {
                        var lerp = Utils.Clamp((this.currentFlapsAngle - 15) / 5, 0, 1);
                        dFlapsArrow = this.generateArrowPathD(this.flapArrowPathD, this.mainShapeCorners[1], this.flapDotPositions[2], this.flapDotPositions[3], lerp);
                    }
                    else if (this.currentFlapsAngle <= this.cockpitSettings.FlapsLevels.flapsAngle[3]) {
                        var lerp = Utils.Clamp((this.currentFlapsAngle - 20) / 15, 0, 1);
                        dFlapsArrow = this.generateArrowPathD(this.flapArrowPathD, this.mainShapeCorners[1], this.flapDotPositions[3], this.flapDotPositions[4], lerp);
                    }
                    if (this.currentFlapsArrow != null) {
                        this.currentFlapsArrow.setAttribute("d", dFlapsArrow);
                    }
                }
                if (this.currentStateText != null) {
                    switch (handleIndex) {
                        case 1:
                            {
                                let flapsOut = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT INDEX", "Number");
                                if (flapsOut > 0) {
                                    this.currentStateText.textContent = "1+F";
                                }
                                else {
                                    this.currentStateText.textContent = "1";
                                    flapsTargetIndex = 0;
                                }
                                break;
                            }
                        case 2:
                            {
                                this.currentStateText.textContent = "2";
                                break;
                            }
                        case 3:
                            {
                                this.currentStateText.textContent = "3";
                                break;
                            }
                        case 4:
                            {
                                this.currentStateText.textContent = "F";
                                break;
                            }
                        default:
                            {
                                this.currentStateText.textContent = "";
                                break;
                            }
                    }
                }
                var active = ((this.currentSlatsAngle > 0) || (this.currentFlapsAngle > 0));
                if (this.isActive != active) {
                    if (active) {
                        this.activate();
                    }
                    else {
                        this.deactivate();
                    }
                }
            }
            if (this.targetSlatsArrow != null) {
                if (slatsAngleChanged && (this.targetSlatsArrowsStrings != null) && (slatsTargetIndex >= 0) && (slatsTargetIndex < this.targetSlatsArrowsStrings.length)) {
                    this.targetSlatsArrow.setAttribute("d", this.targetSlatsArrowsStrings[slatsTargetIndex]);
                    this.targetSlatsArrow.style.display = "block";
                }
                else {
                    this.targetSlatsArrow.style.display = "none";
                }
            }
            if (this.targetFlapsArrow != null) {
                if (flapsAngleChanged && (this.targetFlapsArrowsStrings != null) && (flapsTargetIndex >= 0) && (flapsTargetIndex < this.targetFlapsArrowsStrings.length)) {
                    this.targetFlapsArrow.setAttribute("d", this.targetFlapsArrowsStrings[flapsTargetIndex]);
                    this.targetFlapsArrow.style.display = "block";
                }
                else {
                    this.targetFlapsArrow.style.display = "none";
                }
            }
        }
        generateArrowPathD(_baseString, _origin, _start, _end, _currentLineProgress) {
            var dir = new Vec2(_end.x - _start.x, _end.y - _start.y);
            var finalPos = new Vec2();
            if (_currentLineProgress >= 1) {
                finalPos.x = _end.x;
                finalPos.y = _end.y;
            }
            else if (_currentLineProgress > 0) {
                finalPos.x = (_start.x + (dir.x * _currentLineProgress));
                finalPos.y = (_start.y + (dir.y * _currentLineProgress));
            }
            else {
                finalPos.x = _start.x;
                finalPos.y = _start.y;
            }
            var d = "M" + finalPos.x + "," + finalPos.y;
            d += _baseString;
            if (_origin != null) {
                d += " L" + _origin.x + "," + _origin.y;
            }
            return d;
        }
    }
    A320_Neo_UpperECAM.FlapsPanel = FlapsPanel;

    /**
     * Represents an ECAM message panel that can display a list of messages and failures
     */
    class EcamMessagePanel extends A320_Neo_UpperECAM.PanelBase {
        /**
         * @param {*} _parent 
         * @param {string} _id 
         * @param {number} _max The maximum number of lines this panel can display
         * @param {*} _messages Object containing all posible messages this panel can display
         */
        constructor(_parent, _id, _max, _messages) {
            super(_parent, _id);
            this.allDivs = [];
            this.maxLines = _max;
            this.messages = _messages;
            this.currentLine = 0;
            this.activeCategories = [];
            this.hasActiveFailures = false;
            this.lastWarningsCount = {
                2: 0,
                3: 0
            }
            this.clearedMessages = [];
        }
        init() {
            super.init();
            for (var i = 0; i < this.maxLines; i++) {
                this.addDiv();
            }
        }
        update() {
            this.activeCategories = [];
            this.currentLine = 0;
            var warningsCount = {
                2: 0,
                3: 0
            };
            for (let div of this.allDivs) {
                div.innerHTML = "";
            }
            const activeFailures = this.getActiveFailures();
            for (const i in activeFailures) {
                const category = activeFailures[i];
                for (const failure of category.messages) {
                    this.addLine("fail-"+failure.level, category.name, failure.message, failure.action, failure.alwaysShowCategory);
                    warningsCount[failure.level] = warningsCount[failure.level] + 1;
                    if (failure.actions != null) {
                        for (const action of failure.actions) {
                            if (action.isCompleted == null || !action.isCompleted()) this.addLine(action.style, null, action.message, action.action);
                        }
                    }
                }
            }
            const activeMessages = this.getActiveMessages();
            for (const message of activeMessages) {
                this.addLine(message.style || "InfoIndication", null, message.message, null);
            }

            if (warningsCount[3] > this.lastWarningsCount[3]) {
                console.warn(warningsCount[3]);
                SimVar.SetSimVarValue("L:A32NX_MASTER_WARNING", "Bool", 1);
            }
            if (warningsCount[2] > this.lastWarningsCount[2]) {
                SimVar.SetSimVarValue("L:A32NX_MASTER_CAUTION", "Bool", 1);
            }
            this.lastWarningsCount[2] = parseInt(warningsCount[2]);
            this.lastWarningsCount[3] = parseInt(warningsCount[3]);
        }
        addLine(_style, _category, _message, _action, _alwaysShowCategory = false) {
            if (this.currentLine < this.maxLines) {
                var div = this.allDivs[this.currentLine];
                div.innerHTML = "";
                div.className = _style;
                if (div != null) {

                    //Category
                    if (_category != null && (!this.activeCategories.includes(_category) || _alwaysShowCategory)) {
                        var category = document.createElement("span");
                        category.className = "Underline";
                        category.textContent = _category;
                        div.appendChild(category);
                    }
                    
                    //Message
                    var message = document.createElement("span");
                    switch(_style) {
                        case "action":
                            var msgOutput = "-"+_message;
                            for (var i = 0; i < (22 - _message.length - _action.length); i++) {
                                msgOutput = msgOutput+".";
                            }
                            msgOutput += _action;
                            break;
                        case "remark":
                            var msgOutput = "."+(_message+":").substring(0,22);
                            break;
                        default:
                            var msgOutput = " "+_message;
                            if (!_category) break;
                            if (this.activeCategories.includes(_category)) {
                                for (var i = 0; i < _category.length; i++) {
                                    msgOutput = "&nbsp;"+msgOutput;
                                }
                            }
                            break;
                    }
                    message.innerHTML = msgOutput;
                    div.appendChild(message);

                    if (!this.activeCategories.includes(_category)) {
                        this.activeCategories.push(_category);
                    }
                }
            }
            this.currentLine++;
        }
  
        getActiveFailures() {
            let output = {};
            this.hasActiveFailures = false;
            this.hasWarnings = false;
            this.hasCautions = false;
            for (var i = 0; i < this.messages.failures.length; i++) {
                const messages = this.messages.failures[i].messages;
                for (var n = 0; n < messages.length; n++) {
                    const message = messages[n];
                    if (message.id == null) message.id = `${i} ${n}`;
                    if (message.isActive() && !this.clearedMessages.includes(message.id)) {
                        this.hasActiveFailures = true;
                        if (message.level == 3) this.hasWarnings = true;
                        if (message.level == 2) this.hasCautions = true;
                        if (output[i] == null) {
                            output[i] = this.messages.failures[i];
                            output[i].messages = [];
                        }
                        
                        output[i].messages.push(message);
                    }
                }
            }
            return output;
        }
            
        clearHighestCategory() {
            const activeFailures = this.getActiveFailures();
            for (const category in activeFailures) {
                for (const failure of activeFailures[category].messages) {
                    this.clearedMessages.push(failure.id);
                }
                return;
            }
        }

        recall(_failure) {
            if (_failure != null) {
                const index = this.clearedMessages.indexOf(_failure);
                if (index > -1) {
                    this.clearedMessages.splice(index, 1);
                }
            } 
            else {
                this.clearedMessages = [];
            }
        }    

        getActiveMessages() {
            const output = [];
            for (const message of this.messages.normal) {
                if (message.isActive()) output.push(message);
            }
            return output;
        }

        addDiv() {
            if (this.divMain != null) {
                const newDiv = document.createElement("div");
                this.allDivs.push(newDiv);
                this.divMain.appendChild(newDiv);
                return newDiv;
            }
            return null;
        }
    }
    A320_Neo_UpperECAM.EcamMessagePanel = EcamMessagePanel;
    
    /**
     * Represents an ECAM Memo Item
     */
    class MemoItem {
        constructor(_id, _name, _action, _completed, _condition) {
            /** The unique ID of the item */
            this.id = _id;

            /** The name of the item */
            this.name = _name;

            /** The action text that is displayed after the dots */
            this.action = _action;

            /** The text that displays after the action is completed */
            this.completed = _completed;

            /** Function that returns true if the item is completed */
            this.isCompleted = _condition;
        }
    }
    A320_Neo_UpperECAM.MemoItem = MemoItem;

    /**
     * Represents an ECAM Memo
     */
    class Memo extends A320_Neo_UpperECAM.PanelBase {
        constructor(_parent, _id, _title, _items) {
            super(_parent, _id);
            this.allDivs = [];
            this.title =_title;
            this.items = _items;
        }
        init() {
            super.init();
            for (var i = 0; i < this.items.length; i++) {
                this.addItem(this.items[i], i === 0);
            }
        }
        update() {
            for (const item of this.items) {
                this.setCompleted(item, item.isCompleted());
            }
        }
        getNextAvailableDiv() {
            for (const div of this.allDivs) {
                if (div.textContent.length == 0) {
                    return div;
                }
            }
            if (this.divMain != null) {
                const newDiv = document.createElement("div");
                this.allDivs.push(newDiv);
                this.divMain.appendChild(newDiv);
                return newDiv;
            }
            return null;
        }
        
        /**
         * Adds an item to the memo
         * @param {MemoItem} _item The item to add to the memo
         * @param {boolean} _first Whether this is the first item
         */
        addItem(_item, _first) {
            const div = this.getNextAvailableDiv();
            if (div != null) {
                if (_first) {
                    const title = document.createElement("span");
                    title.className = "Underline";
                    title.textContent = this.title;
                    div.appendChild(title);
                }
                
                //Item name
                const itemName = document.createElement("span");
                itemName.innerHTML = _first ? " "+_item.name : "&nbsp;&nbsp;&nbsp;&nbsp;"+_item.name;
                div.appendChild(itemName);

                //Action
                const action = document.createElement("span");
                action.className = "Action";
                var actionText = _item.action;
                for (var i = 0; i < (19 - _item.name.length - _item.action.length); i++) {
                    actionText = "."+actionText;
                }
                action.textContent = actionText;
                div.appendChild(action);

                //Completed
                const completed = document.createElement("span");
                completed.className = "Completed";
                completed.textContent = " "+_item.completed;
                div.appendChild(completed);
                
                div.className = "InfoIndication";
                div.setAttribute("id", _item.id);
            }
        }

        /**
         * @param {MemoItem} _item 
         * @param {boolean} _completed 
         */
        setCompleted(_item, _completed) {
            for (const div of this.allDivs) {
                if (div.id == _item.id) {
                    for (const child of div.children) {
                        if (child.className == "Action") child.style.display = _completed ? "none" : "inline";
                        if (child.className == "Completed") child.style.display = _completed ? "inline" : "none";
                    }
                    return;
                }
            }
        }

        update() {
            for (const item of this.items) {
                this.setCompleted(item, item.isCompleted());
            }
        }
        
        
    }
    A320_Neo_UpperECAM.Memo = Memo;

})(A320_Neo_UpperECAM || (A320_Neo_UpperECAM = {}));
customElements.define("a320-neo-upper-ecam", A320_Neo_UpperECAM.Display);
//# sourceMappingURL=A320_Neo_UpperECAM.js.map
