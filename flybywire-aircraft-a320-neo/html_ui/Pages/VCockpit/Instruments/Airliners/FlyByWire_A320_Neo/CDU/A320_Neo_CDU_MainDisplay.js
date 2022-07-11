class A320_Neo_CDU_MainDisplay extends FMCMainDisplay {
    constructor() {
        super(...arguments);

        this.minPageUpdateThrottler = new UpdateThrottler(100);
        this.mcduServerConnectUpdateThrottler = new UpdateThrottler(5000);
        this.powerCheckUpdateThrottler = new UpdateThrottler(500);

        this._registered = false;
        this._title = undefined;
        this._titleLeft = '';
        this._pageCurrent = undefined;
        this._pageCount = undefined;
        this._labels = [];
        this._lines = [];
        this._keypad = new Keypad(this);
        this.scratchpad = null;
        this._arrows = [false, false, false, false];
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.activeSystem = 'FMGC';
        this.inFocus = false;
        this.lastInput = 0;
        this.clrStop = false;
        this.allSelected = false;
        this.updateRequest = false;
        this.initB = false;
        this.lastPowerState = 0;
        this.PageTimeout = {
            Fast: 500,
            Medium: 1000,
            Dyn: 1500,
            Default: 2000,
            Slow: 3000,
        };
        this.fmgcMesssagesListener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);
        this.setupFmgcTriggers();
        this.page = {
            SelfPtr: false,
            Current: 0,
            Clear: 0,
            AirportsMonitor: 1,
            AirwaysFromWaypointPage: 2,
            // AirwaysFromWaypointPageGetAllRows: 3,
            AvailableArrivalsPage: 4,
            AvailableArrivalsPageVias: 5,
            AvailableDeparturesPage: 6,
            AvailableFlightPlanPage: 7,
            DataIndexPage1: 8,
            DataIndexPage2: 9,
            DirectToPage: 10,
            FlightPlanPage: 11,
            FuelPredPage: 12,
            GPSMonitor: 13,
            HoldAtPage: 14,
            IdentPage: 15,
            InitPageA: 16,
            InitPageB: 17,
            IRSInit: 18,
            IRSMonitor: 19,
            IRSStatus: 20,
            IRSStatusFrozen: 21,
            LateralRevisionPage: 22,
            MenuPage: 23,
            NavaidPage: 24,
            NavRadioPage: 25,
            NewWaypoint: 26,
            PerformancePageTakeoff: 27,
            PerformancePageClb: 28,
            PerformancePageCrz: 29,
            PerformancePageDes: 30,
            PerformancePageAppr: 31,
            PerformancePageGoAround: 32,
            PilotsWaypoint: 33,
            PosFrozen: 34,
            PositionMonitorPage: 35,
            ProgressPage: 36,
            ProgressPageReport: 37,
            ProgressPagePredictiveGPS: 38,
            SelectedNavaids: 39,
            SelectWptPage: 40,
            VerticalRevisionPage: 41,
            WaypointPage: 42,
            AOCInit: 43,
            AOCInit2: 44,
            AOCOfpData: 45,
            AOCOfpData2: 46,
            AOCMenu: 47,
            AOCRequestWeather: 48,
            AOCRequestAtis: 49,
            AOCDepartRequest: 50,
            ATCMenu: 51,
            ATCModify: 52,
            ATCAtis: 53,
            ATCMessageRecord: 54,
            ATCMessageMonitoring: 55,
            ATCConnection: 56,
            ATCNotification: 57,
            ATCConnectionStatus: 58,
            ATCPositionReport1: 59,
            ATCPositionReport2: 60,
            ATCPositionReport3: 61,
            ATCFlightRequest: 62,
            ATCUsualRequest: 63,
            ATCGroundRequest: 64,
            ATCReports: 65,
            ATCEmergency: 66,
            ATCComLastId: 67, // This is needed for automatic page changes triggered by DCDU
            ATSUMenu: 68,
            ATSUDatalinkStatus: 69,
            ClimbWind: 70,
            CruiseWind: 71,
            DescentWind: 72,
            FixInfoPage: 73,
            AOCRcvdMsgs: 74,
            AOCSentMsgs: 75,
            AOCFreeText: 76,
        };

        // Handling of MCDU Sever connection attempts
        this.socket = undefined;
        this.socketConnectionAttempts = 0;
        this.maxConnectionAttempts = 60;
        this.mcduServerConnect = NXDataStore.get("CONFIG_EXTERNAL_MCDU_SERVER_ENABLED", 'AUTO ON');
        if (this.mcduServerConnect !== 'PERM OFF') {
            NXDataStore.set("CONFIG_EXTERNAL_MCDU_SERVER_ENABLED", 'AUTO ON');
            this.mcduServerConnect = 'AUTO ON';
        } else {
            console.log("MCDU server connection attempts permanently deactivated.");
        }
    }

    setupFmgcTriggers() {
        Coherent.on('A32NX_FMGC_SEND_MESSAGE_TO_MCDU', (message) => {
            this.addMessageToQueue(new TypeIIMessage(message.text, message.color === 'Amber'), () => false , () => {
                if (message.clearable) {
                    Fmgc.recallMessageById(message.id);
                }
            });
        });

        Coherent.on('A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID', (text) => {
            this.removeMessageFromQueue(text);
        });
    }

    get templateID() {
        return "A320_Neo_CDU";
    }
    get isInteractive() {
        return true;
    }
    connectedCallback() {
        super.connectedCallback();
        RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
            console.log("JS_LISTENER_KEYEVENT registered.");
            RegisterViewListener("JS_LISTENER_FACILITY", () => {
                console.log("JS_LISTENER_FACILITY registered.");
                this._registered = true;
            });
        });
    }

    initMcduVariables() {
        this.setScratchpadText("");
    }

    Init() {
        super.Init();
        try {
            Coherent.trigger('UNFOCUS_INPUT_FIELD');// note: without this, resetting mcdu kills camera
        } catch (e) {
            console.error(e);
        }

        this.generateHTMLLayout(this.getChildById("Mainframe") || this);
        this.initKeyboardScratchpad();
        this._titleLeftElement = this.getChildById("title-left");
        this._titleElement = this.getChildById("title");
        this._pageCurrentElement = this.getChildById("page-current");
        this._pageCountElement = this.getChildById("page-count");
        this._labelElements = [];
        this._lineElements = [];
        for (let i = 0; i < 6; i++) {
            this._labelElements[i] = [
                this.getChildById("label-" + i + "-left"),
                this.getChildById("label-" + i + "-right"),
                this.getChildById("label-" + i + "-center")
            ];
            this._lineElements[i] = [
                this.getChildById("line-" + i + "-left"),
                this.getChildById("line-" + i + "-right"),
                this.getChildById("line-" + i + "-center")
            ];
        }

        const display = new ScratchpadDisplay(this.getChildById("in-out"));
        this.scratchpad = new ScratchpadDataLink(this, display);

        this.setTimeout = (func) => {
            setTimeout(() => {
                func;
            }, this.getDelaySwitchPage());
        };

        /** The following events remain due to shared use by the keypad and keyboard type entry */
        this.onLetterInput = (l) => this.scratchpad.addChar(l);
        this.onSp = () => this.scratchpad.addChar(" ");
        this.onDiv = () => this.scratchpad.addChar("/");
        this.onDot = () => this.scratchpad.addChar(".");
        this.onClr = () => this.scratchpad.clear();
        this.onClrHeld = () => this.scratchpad.clearHeld();
        this.onPlusMinus = (defaultKey = "-") => this.scratchpad.plusMinus(defaultKey);
        this.onLeftFunction = (f) => this.onLsk(this.onLeftInput[f], this.leftInputDelay[f]);
        this.onRightFunction = (f) => this.onLsk(this.onRightInput[f], this.rightInputDelay[f]);
        this.onOvfy = () => this.scratchpad.addChar('Δ');
        this.onUnload = () => {};

        CDUMenuPage.ShowPage(this);

        // If the consent is not set, show telex page
        const onlineFeaturesStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "UNKNOWN");

        if (onlineFeaturesStatus === "UNKNOWN") {
            new NXPopUp().showPopUp(
                'TELEX CONFIGURATION',
                'You have not yet configured the telex option. Telex enables free text and live map. If enabled, aircraft position data is published for the duration of the flight. Messages are public and not moderated. USE AT YOUR OWN RISK. To learn more about telex and the features it enables, please go to https://docs.flybywiresim.com/telex. Would you like to enable telex?',
                'small',
                () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'ENABLED'),
                () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED'),
            );
        }

        SimVar.SetSimVarValue("L:A32NX_GPS_PRIMARY_LOST_MSG", "Bool", 0).then();

        NXDataStore.subscribe('*', () => {
            this.requestUpdate();
        });
    }

    requestUpdate() {
        this.updateRequest = true;
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        // every 100ms
        if (this.minPageUpdateThrottler.canUpdate(_deltaTime) !== -1 && this.updateRequest) {
            this.updateRequest = false;
            if (this.pageRedrawCallback) {
                this.pageRedrawCallback();
            }
        }

        // The MCDU is a client to the MCDU Server and tries to connect in regular intervals.
        // Due to an issue with the sim's Coherent engine we need to avoid trying
        // to connect the websocket continuously. The below solution based on an EFB setting
        // and a maximal number of attempts should mitigate the issue until
        // Asobo has fixed the core issue.
        if (this.mcduServerConnectUpdateThrottler.canUpdate(_deltaTime) !== -1
            && this.getGameState() === GameState.ingame) {

            // Try to connect websocket if enabled in EFB and no connection established
            this.mcduServerConnect = NXDataStore.get("CONFIG_EXTERNAL_MCDU_SERVER_ENABLED", 'AUTO ON');
            if (this.mcduServerConnect === 'AUTO ON' && (!this.socket || this.socket.readyState !== 1)) {
                // We try to connect for a fixed amount of attempts, then we deactivate the connection setting
                if (this.socketConnectionAttempts++ >= this.maxConnectionAttempts) {
                    console.log("Maximum number of connection attempts to MCDU Server exceeded. No more attempts.");
                    NXDataStore.set("CONFIG_EXTERNAL_MCDU_SERVER_ENABLED", 'AUTO OFF');
                    this.socketConnectionAttempts = 0;
                } else {
                    console.log(`Attempting MCDU Server connection ${this.socketConnectionAttempts} of ${this.maxConnectionAttempts} attempts.`);
                    this.connectWebsocket(NXDataStore.get("CONFIG_EXTERNAL_MCDU_PORT", "8380"));
                }
            } else if (this.mcduServerConnect !== 'AUTO ON') {
                if (this.socketConnectionAttempts > 0) {
                    console.log("MCDU server connection attempts deactivated. No more attempts.");
                    this.socketConnectionAttempts = 0;
                }
                if (this.socket) {
                    // If there is a connection established but the EFB setting has been changed
                    // then close connection
                    this.socket.close();
                    this.socket = undefined;
                }
            }
        }

        // There is no (known) event when power is turned on or off (e.g. Ext Pwr) and remote clients
        // would not be updated (cleared or updated). Therefore, monitoring power is necessary.
        // every 500ms
        if (this.powerCheckUpdateThrottler.canUpdate(_deltaTime) !== -1
            && this.socket && this.socket.readyState) {

            const isPoweredL = SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "Number");
            if (this.lastPowerState !== isPoweredL) {
                this.lastPowerState = isPoweredL;
                this.sendUpdate();
            }
        }

        // TODO these other mechanisms are replaced in the MCDU split PR
        if (this.pageUpdate) {
            this.pageUpdate();
        }
        this.checkAocTimes();
        this.updateMCDU();
    }

    /* MCDU UPDATE */

    /**
     * Checks whether INIT page B is open and an engine is being started, if so:
     * The INIT page B reverts to the FUEL PRED page 15 seconds after the first engine start and cannot be accessed after engine start.
     */
    updateMCDU() {
        if (this.isAnEngineOn()) {
            if (!this.initB) {
                this.initB = true;
                setTimeout(() => {
                    if (this.page.Current === this.page.InitPageB && this.isAnEngineOn()) {
                        CDUFuelPredPage.ShowPage(this);
                    }
                }, 15000);
            }
        } else {
            this.initB = false;
        }
    }

    checkAocTimes() {
        if (!this.aocTimes.off) {
            if (this.flightPhaseManager.phase === FmgcFlightPhases.TAKEOFF && !this.isOnGround()) {
                // Wheels off
                // Off: remains blank until Take off time
                this.aocTimes.off = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
            }
        }

        if (!this.aocTimes.out) {
            const currentPKGBrakeState = SimVar.GetSimVarValue("L:A32NX_PARK_BRAKE_LEVER_POS", "Bool");
            if (this.flightPhaseManager.phase === FmgcFlightPhases.PREFLIGHT && !currentPKGBrakeState) {
                // Out: is when you set the brakes to off
                this.aocTimes.out = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
            }
        }

        if (!this.aocTimes.on) {
            if (this.aocTimes.off && !this.isOnGround()) {
                // On: remains blank until Landing time
                this.aocTimes.on = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
            }
        }

        if (!this.aocTimes.in) {
            const currentPKGBrakeState = SimVar.GetSimVarValue("L:A32NX_PARK_BRAKE_LEVER_POS", "Bool");
            const cabinDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:0", "percent");
            if (this.aocTimes.on && currentPKGBrakeState && cabinDoorPctOpen > 20) {
                // In: remains blank until brakes set to park AND the first door opens
                this.aocTimes.in = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
            }
        }

        if (this.flightPhaseManager.phase === FmgcFlightPhases.PREFLIGHT) {
            const cabinDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:0", "percent");
            if (!this.aocTimes.doors && cabinDoorPctOpen < 20) {
                this.aocTimes.doors = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
            } else {
                if (cabinDoorPctOpen > 20) {
                    this.aocTimes.doors = "";
                }
            }
        }
    }

    /* END OF MCDU UPDATE */
    /* MCDU INTERFACE/LAYOUT */

    _formatCell(str) {
        return str
            .replace(/{big}/g, "<span class='b-text'>")
            .replace(/{small}/g, "<span class='s-text'>")
            .replace(/{big}/g, "<span class='b-text'>")
            .replace(/{amber}/g, "<span class='amber'>")
            .replace(/{red}/g, "<span class='red'>")
            .replace(/{green}/g, "<span class='green'>")
            .replace(/{cyan}/g, "<span class='cyan'>")
            .replace(/{white}/g, "<span class='white'>")
            .replace(/{magenta}/g, "<span class='magenta'>")
            .replace(/{yellow}/g, "<span class='yellow'>")
            .replace(/{inop}/g, "<span class='inop'>")
            .replace(/{sp}/g, "&nbsp;")
            .replace(/{left}/g, "<span class='left'>")
            .replace(/{right}/g, "<span class='right'>")
            .replace(/{end}/g, "</span>");
    }

    getTitle() {
        if (this._title === undefined) {
            this._title = this._titleElement.textContent;
        }
        return this._title;
    }

    setTitle(content) {
        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._title = content.split("[color]")[0];
        this._title = `{${color}}${this._title}{end}`;
        this._titleElement.textContent = this._title;
    }

    setTitleLeft(content) {
        if (!content) {
            this._titleLeft = "";
            this._titleLeftElement.textContent = "";
            return;
        }
        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._titleLeft = content.split("[color]")[0];
        this._titleLeft = `{${color}}${this._titleLeft}{end}`;
        this._titleLeftElement.textContent = this._titleLeft;
    }

    setPageCurrent(value) {
        if (typeof (value) === "number") {
            this._pageCurrent = value;
        } else if (typeof (value) === "string") {
            this._pageCurrent = parseInt(value);
        }
        this._pageCurrentElement.textContent = (this._pageCurrent > 0 ? this._pageCurrent : "") + "";
    }

    setPageCount(value) {
        if (typeof (value) === "number") {
            this._pageCount = value;
        } else if (typeof (value) === "string") {
            this._pageCount = parseInt(value);
        }
        this._pageCountElement.textContent = (this._pageCount > 0 ? this._pageCount : "") + "";
        if (this._pageCount === 0) {
            this.getChildById("page-slash").textContent = "";
        } else {
            this.getChildById("page-slash").textContent = "/";
        }
    }

    setLabel(label, row, col = -1, websocketDraw = true) {
        if (col >= this._labelElements[row].length) {
            return;
        }
        if (!this._labels[row]) {
            this._labels[row] = [];
        }
        if (!label) {
            label = "";
        }
        if (col === -1) {
            for (let i = 0; i < this._labelElements[row].length; i++) {
                this._labels[row][i] = "";
                this._labelElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (label === "__FMCSEPARATOR") {
            label = "------------------------";
        }
        if (label !== "") {
            if (label.indexOf("[b-text]") !== -1) {
                label = label.replace("[b-text]", "");
                this._lineElements[row][col].classList.remove("s-text");
                this._lineElements[row][col].classList.add("msg-text");
            } else {
                this._lineElements[row][col].classList.remove("msg-text");
            }

            let color = label.split("[color]")[1];
            if (!color) {
                color = "white";
            }
            const e = this._labelElements[row][col];
            label = label.split("[color]")[0];
            label = `{${color}}${label}{end}`;
        }
        this._labels[row][col] = label;
        this._labelElements[row][col].textContent = label;

        if (websocketDraw) {
            this.sendUpdate();
        }
    }

    /**
     * @param {string|CDU_Field} content
     * @param {number} row
     * @param {number} col
     * @param {boolean} websocketDraw
     */
    setLine(content, row, col = -1, websocketDraw = true) {

        if (content instanceof CDU_Field) {
            const field = content;
            ((col === 0 || col === -1) ? this.onLeftInput : this.onRightInput)[row] = (value) => {
                field.onSelect(value);
            };
            content = content.getValue();
        }

        if (col >= this._lineElements[row].length) {
            return;
        }
        if (!content) {
            content = "";
        }
        if (!this._lines[row]) {
            this._lines[row] = [];
        }
        if (col === -1) {
            for (let i = 0; i < this._lineElements[row].length; i++) {
                this._lines[row][i] = "";
                this._lineElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (content === "__FMCSEPARATOR") {
            content = "------------------------";
        }
        if (content !== "") {
            let color = content.split("[color]")[1];
            if (!color) {
                color = "white";
            }
            const e = this._lineElements[row][col];
            content = content.split("[color]")[0];
            content = `{${color}}${content}{end}`;
            if (content.indexOf("[s-text]") !== -1) {
                content = content.replace("[s-text]", "");
                content = `{small}${content}{end}`;
            }
        }
        this._lines[row][col] = content;
        this._lineElements[row][col].textContent = this._lines[row][col];

        if (websocketDraw) {
            this.sendUpdate();
        }
    }

    setTemplate(template, large = false) {
        if (template[0]) {
            this.setTitle(template[0][0]);
            this.setPageCurrent(template[0][1]);
            this.setPageCount(template[0][2]);
            this.setTitleLeft(template[0][3]);
        }
        for (let i = 0; i < 6; i++) {
            let tIndex = 2 * i + 1;
            if (template[tIndex]) {
                if (large) {
                    if (template[tIndex][1] !== undefined) {
                        this.setLine(template[tIndex][0], i, 0, false);
                        this.setLine(template[tIndex][1], i, 1, false);
                        this.setLine(template[tIndex][2], i, 2, false);
                        this.setLine(template[tIndex][3], i, 3, false);
                    } else {
                        this.setLine(template[tIndex][0], i, -1, false);
                    }
                } else {
                    if (template[tIndex][1] !== undefined) {
                        this.setLabel(template[tIndex][0], i, 0, false);
                        this.setLabel(template[tIndex][1], i, 1, false);
                        this.setLabel(template[tIndex][2], i, 2, false);
                        this.setLabel(template[tIndex][3], i, 3, false);
                    } else {
                        this.setLabel(template[tIndex][0], i, -1, false);
                    }
                }
            }
            tIndex = 2 * i + 2;
            if (template[tIndex]) {
                if (template[tIndex][1] !== undefined) {
                    this.setLine(template[tIndex][0], i, 0, false);
                    this.setLine(template[tIndex][1], i, 1, false);
                    this.setLine(template[tIndex][2], i, 2, false);
                    this.setLine(template[tIndex][3], i, 3, false);
                } else {
                    this.setLine(template[tIndex][0], i, -1, false);
                }
            }
        }
        if (template[13]) {
            this.setScratchpadText(template[13][0]);
        }
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", this.currentFlightPlanWaypointIndex).then();
        // Apply formatting helper to title page, lines and labels
        if (this._titleElement !== null) {
            this._titleElement.innerHTML = this._formatCell(this._titleElement.innerHTML);
        }
        if (this._titleLeftElement !== null) {
            this._titleLeftElement.innerHTML = this._formatCell(this._titleLeftElement.innerHTML);
        }
        this._lineElements.forEach((row) => {
            row.forEach((column) => {
                if (column !== null) {
                    column.innerHTML = this._formatCell(column.innerHTML);
                }
            });
        });
        this._labelElements.forEach((row) => {
            row.forEach((column) => {
                if (column !== null) {
                    column.innerHTML = this._formatCell(column.innerHTML);
                }
            });
        });
        this.sendUpdate();
    }

    /**
     * Sets what arrows will be displayed in the corner of the screen. Arrows are removed when clearDisplay() is called.
     * @param {boolean} up - whether the up arrow will be displayed
     * @param {boolean} down - whether the down arrow will be displayed
     * @param {boolean} left - whether the left arrow will be displayed
     * @param {boolean} right - whether the right arrow will be displayed
     */
    setArrows(up, down, left, right) {
        this._arrows = [up, down, left, right];
        this.arrowHorizontal.style.opacity = (left || right) ? "1" : "0";
        this.arrowVertical.style.opacity = (up || down) ? "1" : "0";
        if (up && down) {
            this.arrowVertical.innerHTML = "↓↑\xa0";
        } else if (up) {
            this.arrowVertical.innerHTML = "↑\xa0";
        } else {
            this.arrowVertical.innerHTML = "↓\xa0\xa0";
        }
        if (left && right) {
            this.arrowHorizontal.innerHTML = "←→\xa0";
        } else if (right) {
            this.arrowHorizontal.innerHTML = "→\xa0";
        } else {
            this.arrowHorizontal.innerHTML = "←\xa0\xa0";
        }
    }

    clearDisplay(webSocketDraw = false) {
        this.onUnload();
        this.onUnload = () => {};
        this.setTitle("");
        this.setTitleLeft("");
        this.setPageCurrent(0);
        this.setPageCount(0);
        for (let i = 0; i < 6; i++) {
            this.setLabel("", i, -1, webSocketDraw);
        }
        for (let i = 0; i < 6; i++) {
            this.setLine("", i, -1, webSocketDraw);
        }
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.onPrevPage = () => {};
        this.onNextPage = () => {};
        this.pageUpdate = () => {};
        this.pageRedrawCallback = null;
        this.refreshPageCallback = undefined;
        if (this.page.Current === this.page.MenuPage) {
            this.setScratchpadText("");
        }
        this.page.Current = this.page.Clear;
        this.setArrows(false, false, false, false);
        this.tryDeleteTimeout();
        this.onUp = () => {};
        this.onDown = () => {};
        this.updateRequest = false;
    }

    generateHTMLLayout(parent) {
        while (parent.children.length > 0) {
            parent.removeChild(parent.children[0]);
        }
        const header = document.createElement("div");
        header.id = "header";

        const titleLeft = document.createElement("div");
        titleLeft.classList.add("s-text");
        titleLeft.id = "title-left";
        parent.appendChild(titleLeft);

        const title = document.createElement("span");
        title.id = "title";
        header.appendChild(title);

        this.arrowHorizontal = document.createElement("span");
        this.arrowHorizontal.id = "arrow-horizontal";
        this.arrowHorizontal.innerHTML = "←→\xa0";
        header.appendChild(this.arrowHorizontal);

        parent.appendChild(header);

        const page = document.createElement("div");
        page.id = "page-info";
        page.classList.add("s-text");

        const pageCurrent = document.createElement("span");
        pageCurrent.id = "page-current";

        const pageSlash = document.createElement("span");
        pageSlash.id = "page-slash";
        pageSlash.textContent = "/";

        const pageCount = document.createElement("span");
        pageCount.id = "page-count";

        page.appendChild(pageCurrent);
        page.appendChild(pageSlash);
        page.appendChild(pageCount);
        parent.appendChild(page);

        for (let i = 0; i < 6; i++) {
            const label = document.createElement("div");
            label.classList.add("label", "s-text");
            const labelLeft = document.createElement("span");
            labelLeft.id = "label-" + i + "-left";
            labelLeft.classList.add("fmc-block", "label", "label-left");
            const labelRight = document.createElement("span");
            labelRight.id = "label-" + i + "-right";
            labelRight.classList.add("fmc-block", "label", "label-right");
            const labelCenter = document.createElement("span");
            labelCenter.id = "label-" + i + "-center";
            labelCenter.classList.add("fmc-block", "label", "label-center");
            label.appendChild(labelLeft);
            label.appendChild(labelRight);
            label.appendChild(labelCenter);
            parent.appendChild(label);
            const line = document.createElement("div");
            line.classList.add("line");
            const lineLeft = document.createElement("span");
            lineLeft.id = "line-" + i + "-left";
            lineLeft.classList.add("fmc-block", "line", "line-left");
            const lineRight = document.createElement("span");
            lineRight.id = "line-" + i + "-right";
            lineRight.classList.add("fmc-block", "line", "line-right");
            const lineCenter = document.createElement("span");
            lineCenter.id = "line-" + i + "-center";
            lineCenter.classList.add("fmc-block", "line", "line-center");
            line.appendChild(lineLeft);
            line.appendChild(lineRight);
            line.appendChild(lineCenter);
            parent.appendChild(line);
        }
        const footer = document.createElement("div");
        footer.classList.add("line");
        const inout = document.createElement("span");
        inout.id = "in-out";
        this.arrowVertical = document.createElement("span");
        this.arrowVertical.id = "arrow-vertical";
        this.arrowVertical.innerHTML = "↓↑\xa0";

        footer.appendChild(inout);
        footer.appendChild(this.arrowVertical);
        parent.appendChild(footer);
    }

    /* END OF MCDU INTERFACE/LAYOUT */
    /* MCDU SCRATCHPAD */

    setScratchpadUserData(value) {
        this.scratchpad.setUserData(value);
    }

    clearFocus() {
        this.inFocus = false;
        this.allSelected = false;
        try {
            Coherent.trigger('UNFOCUS_INPUT_FIELD');
        } catch (e) {
            console.error(e);
        }
        this.scratchpad.setDisplayStyle(null);
        this.getChildById("header").style = null;
        if (this.check_focus) {
            clearInterval(this.check_focus);
        }
    }

    initKeyboardScratchpad() {
        window.document.addEventListener('click', () => {

            const mcduInput = NXDataStore.get("MCDU_KB_INPUT", "DISABLED");
            const mcduTimeout = parseInt(NXDataStore.get("CONFIG_MCDU_KB_TIMEOUT", "60"));
            const isPoweredL = SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "Number");
            const isPoweredR = SimVar.GetSimVarValue("L:A32NX_ELEC_AC_2_BUS_IS_POWERED", "Number");

            // TODO: L/R MCDU
            if (mcduInput === "ENABLED") {
                this.inFocus = !this.inFocus;
                if (this.inFocus && (isPoweredL || isPoweredR)) {
                    this.getChildById("header").style = "background: linear-gradient(180deg, rgba(2,182,217,1.0) 65%, rgba(255,255,255,0.0) 65%);";
                    this.scratchpad.setDisplayStyle("display: inline-block; width:87%; background: rgba(255,255,255,0.2);");
                    try {
                        Coherent.trigger('FOCUS_INPUT_FIELD');
                    } catch (e) {
                        console.error(e);
                    }
                    this.lastInput = new Date();
                    if (mcduTimeout) {
                        this.check_focus = setInterval(() => {
                            if (Math.abs(new Date() - this.lastInput) / 1000 >= mcduTimeout) {
                                this.clearFocus();
                            }
                        }, Math.min(mcduTimeout * 1000 / 2, 1000));
                    }
                } else {
                    this.clearFocus();
                }
            } else {
                this.clearFocus();
            }
        });
        window.document.addEventListener('keydown', (e) => {
            // MCDU should not accept input while unpowered
            if (this.inFocus && SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "Number")) {
                let keycode = e.keyCode;
                this.lastInput = new Date();
                if (keycode >= KeyCode.KEY_NUMPAD0 && keycode <= KeyCode.KEY_NUMPAD9) {
                    keycode -= 48; // numpad support
                }
                // Note: tried using H-events, worse performance. Reverted to direct input.
                // Preventing repeated input also similarly felt awful and defeated the point.
                // Clr hold functionality pointless as scratchpad will be cleared (repeated input).

                if (e.altKey || (e.ctrlKey && keycode === KeyCode.KEY_Z)) {
                    this.clearFocus();
                } else if (e.ctrlKey && keycode === KeyCode.KEY_A) {
                    this.allSelected = !this.allSelected;
                    this.scratchpad.setDisplayStyle(`display: inline-block; width:87%; background: ${this.allSelected ? 'rgba(235,64,52,1.0)' : 'rgba(255,255,255,0.2)'};`);
                } else if (e.shiftKey && e.ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
                    this.setScratchpadText("");
                } else if (e.ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
                    const scratchpadTextContent = this.scratchpad.getText();
                    let wordFlag = !scratchpadTextContent.includes(' ');
                    for (let i = scratchpadTextContent.length; i > 0; i--) {
                        if (scratchpadTextContent.slice(-1) === ' ') {
                            if (!wordFlag) {
                                this.onClr();
                            } else {
                                wordFlag = true;
                                break;
                            }
                        }
                        if (scratchpadTextContent.slice(-1) !== ' ') {
                            if (!wordFlag) {
                                wordFlag = true;
                            } else {
                                this.onClr();
                            }
                        }
                    }
                } else if (e.shiftKey && keycode === KeyCode.KEY_BACK_SPACE) {
                    if (!this.check_clr) {
                        this.onClr();
                        this.check_clr = setTimeout(() => {
                            this.onClrHeld();
                        }, 2000);
                    }
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_CLR", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_CLR", "Number", 1);
                } else if (keycode >= KeyCode.KEY_0 && keycode <= KeyCode.KEY_9 || keycode >= KeyCode.KEY_A && keycode <= KeyCode.KEY_Z) {
                    const letter = String.fromCharCode(keycode);
                    this.onLetterInput(letter);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_" + letter.toUpperCase(), "Number", 1); // TODO: L/R [1/2] side MCDU Split
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_" + letter.toUpperCase(), "Number", 1);
                } else if (keycode === KeyCode.KEY_PERIOD || keycode === KeyCode.KEY_DECIMAL) {
                    this.onDot();
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_DOT", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_DOT", "Number", 1);
                } else if (keycode === KeyCode.KEY_SLASH || keycode === KeyCode.KEY_BACK_SLASH || keycode === KeyCode.KEY_DIVIDE || keycode === 226) {
                    this.onDiv();
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_SLASH", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_SLASH", "Number", 1);
                } else if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
                    if (this.allSelected) {
                        this.setScratchpadText("");
                    } else if (!this.clrStop) {
                        this.onClr();
                        SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_CLR", "Number", 1);
                        SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_CLR", "Number", 1);
                        this.clrStop = this.scratchpad.isClearStop();
                    }
                } else if (keycode === KeyCode.KEY_SPACE) {
                    this.onSp();
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_SP", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_SP", "Number", 1);
                } else if (keycode === 189 || keycode === KeyCode.KEY_SUBTRACT) {
                    this.onPlusMinus("-");
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_PLUSMINUS", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_PLUSMINUS", "Number", 1);
                } else if (keycode === 187 || keycode === KeyCode.KEY_ADD) {
                    this.onPlusMinus("+");
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_PLUSMINUS", "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_PLUSMINUS", "Number", 1);
                } else if (keycode >= KeyCode.KEY_F1 && keycode <= KeyCode.KEY_F6) {
                    const func_num = keycode - KeyCode.KEY_F1;
                    this.onLeftFunction(func_num);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_L" + (func_num + 1), "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_L" + (func_num + 1), "Number", 1);
                } else if (keycode >= KeyCode.KEY_F7 && keycode <= KeyCode.KEY_F12) {
                    const func_num = keycode - KeyCode.KEY_F7;
                    this.onRightFunction(func_num);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_1_R" + (func_num + 1), "Number", 1);
                    SimVar.SetSimVarValue("L:A32NX_MCDU_PUSH_ANIM_2_R" + (func_num + 1), "Number", 1);
                }
            }
        });
        window.document.addEventListener('keyup', (e) => {
            this.lastInput = new Date();
            const keycode = e.keyCode;
            if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
                this.clrStop = false;
            }
            if (this.check_clr) {
                clearTimeout(this.check_clr);
                this.check_clr = undefined;
            }
        });
    }

    /* END OF MCDU SCRATCHPAD */
    /* MCDU MESSAGE SYSTEM */

    /**
     * Display a type I message on the scratch pad
     * @param message {TypeIMessage}
     */
    setScratchpadMessage(message) {
        this.scratchpad.setMessage(message);
    }

    removeScratchpadMessage(value) {
        this.scratchpad.removeMessage(value);
    }

    setScratchpadText(value) {
        this.scratchpad.setText(value);
    }

    /**
     * Tries to show the MODIFY page if the MCDU is in the ATC COM system
     */
    tryToShowAtcModifyPage() {
        if (this.page.Current >= this.page.ATCMenu && this.page.Current < this.page.ATCComLastId) {
            CDUAtcMessageModify.ShowPage(this, this.atsu.modificationMessage);
        }
    }

    /**
     * General ATSU message handler which converts ATSU status codes to new MCDU messages
     * @param code ATSU status code
     */
    addNewAtsuMessage(code) {
        switch (code) {
            case Atsu.AtsuStatusCodes.CallsignInUse:
                this.setScratchpadMessage(NXFictionalMessages.fltNbrInUse);
                break;
            case Atsu.AtsuStatusCodes.NoHoppieConnection:
                this.setScratchpadMessage(NXFictionalMessages.noHoppieConnection);
                break;
            case Atsu.AtsuStatusCodes.ComFailed:
                this.setScratchpadMessage(NXSystemMessages.comUnavailable);
                break;
            case Atsu.AtsuStatusCodes.NoAtc:
                this.setScratchpadMessage(NXSystemMessages.noAtc);
                break;
            case Atsu.AtsuStatusCodes.DcduFull:
                this.setScratchpadMessage(NXSystemMessages.dcduFileFull);
                break;
            case Atsu.AtsuStatusCodes.UnknownMessage:
                this.setScratchpadMessage(NXFictionalMessages.unknownAtsuMessage);
                break;
            case Atsu.AtsuStatusCodes.ProxyError:
                this.setScratchpadMessage(NXFictionalMessages.reverseProxy);
                break;
            case Atsu.AtsuStatusCodes.NoTelexConnection:
                this.setScratchpadMessage(NXFictionalMessages.telexNotEnabled);
                break;
            case Atsu.AtsuStatusCodes.OwnCallsign:
                this.setScratchpadMessage(NXSystemMessages.noAtc);
                break;
            case Atsu.AtsuStatusCodes.SystemBusy:
                this.setScratchpadMessage(NXSystemMessages.systemBusy);
                break;
            case Atsu.AtsuStatusCodes.NewAtisReceived:
                this.setScratchpadMessage(NXSystemMessages.newAtisReceived);
                break;
            case Atsu.AtsuStatusCodes.NoAtisReceived:
                this.setScratchpadMessage(NXSystemMessages.noAtisReceived);
                break;
            case Atsu.AtsuStatusCodes.EntryOutOfRange:
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                break;
            case Atsu.AtsuStatusCodes.FormatError:
                this.setScratchpadMessage(NXSystemMessages.formatError);
                break;
            case Atsu.AtsuStatusCodes.NotInDatabase:
                this.setScratchpadMessage(NXSystemMessages.notInDatabase);
            default:
                break;
        }
    }

    /* END OF MCDU MESSAGE SYSTEM */
    /* MCDU EVENTS */

    onPowerOn() {
        super.onPowerOn();
    }

    onEvent(_event) {
        super.onEvent(_event);

        // MCDU should not accept input while unpowered
        if (!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "Number")) {
            return;
        }

        if (_event.indexOf("1_BTN_") !== -1 || _event.indexOf("2_BTN_") !== -1 || _event.indexOf("BTN_") !== -1) {
            const input = _event.replace("1_BTN_", "").replace("2_BTN_", "").replace("BTN_", "");
            if (this._keypad.onKeyPress(input)) {
                return;
            }

            if (input.length === 2 && input[0] === "L") {
                const v = parseInt(input[1]) - 1;
                if (isFinite(v)) {
                    this.onLeftFunction(v);
                }
            } else if (input.length === 2 && input[0] === "R") {
                const v = parseInt(input[1]) - 1;
                if (isFinite(v)) {
                    this.onRightFunction(v);
                }
            } else {
                console.log("'" + input + "'");
            }
        }
    }

    onLsk(fncAction, fncActionDelay = this.getDelayBasic) {
        if (!fncAction) {
            return;
        }

        // First timeout simulates delay for key press
        // Second delay simulates delay for input validation
        const cur = this.page.Current;
        setTimeout(() => {
            const value = this.scratchpad.removeUserContentFromScratchpadAndDisplayAndReturnTextContent();
            setTimeout(() => {
                if (this.page.Current === cur) {
                    fncAction(value, () => this.setScratchpadUserData(value));
                }
            }, fncActionDelay());
        }, 100);
    }

    /* END OF MCDU EVENTS */
    /* MCDU DELAY SIMULATION */

    /**
     * Used for switching pages
     * @returns {number} delay in ms between 150 and 200
     */
    getDelaySwitchPage() {
        return 150 + 50 * Math.random();
    }

    /**
     * Used for basic inputs e.g. alternate airport, ci, fl, temp, constraints, ...
     * @returns {number} delay in ms between 300 and 400
     */
    getDelayBasic() {
        return 300 + 100 * Math.random();
    }

    /**
     * Used for e.g. loading time fore pages
     * @returns {number} delay in ms between 600 and 800
     */
    getDelayMedium() {
        return 600 + 200 * Math.random();
    }

    /**
     * Used for intense calculation
     * @returns {number} delay in ms between 900 and 12000
     */
    getDelayHigh() {
        return 900 + 300 * Math.random();
    }

    /**
     * Used for changes to the flight plan
     * @returns {number} dynamic delay in ms between ~300 and up to +2000 (depending on additional conditions)
     */
    getDelayRouteChange() {
        if (this._zeroFuelWeightZFWCGEntered && this._blockFuelEntered) {
            return Math.pow(this.flightPlanManager.getWaypointsCount(), 2) + (this.flightPlanManager.getDestination().cumulativeDistanceInFP) / 10 + Math.random() * 300;
        } else {
            return 300 + this.flightPlanManager.getWaypointsCount() * Math.random() + this.flightPlanManager.getDestination().cumulativeDistanceInFP * Math.random();
        }
    }

    /**
     * Used for calculation time for fuel pred page
     * @returns {number} dynamic delay in ms between 2000ms and 4000ms
     */
    getDelayFuelPred() {
        return 225 * this.flightPlanManager.getWaypointsCount() + (this.flightPlanManager.getDestination().cumulativeDistanceInFP / 2);
    }

    /**
     * Used to load wind data into fms
     * @returns {number} dynamic delay in ms dependent on amount of waypoints
     */
    getDelayWindLoad() {
        return Math.pow(this.flightPlanManager.getWaypointsCount(), 2);
    }

    /**
     * Tries to delete a pages timeout
     */
    tryDeleteTimeout() {
        if (this.page.SelfPtr) {
            clearTimeout(this.page.SelfPtr);
            this.page.SelfPtr = false;
        }
    }

    /* END OF MCDU DELAY SIMULATION */
    /* MCDU AOC MESSAGE SYSTEM */

    printPage(lines) {
        if (this.printing) {
            return;
        }
        this.printing = true;

        const formattedValues = lines.map((l) => {
            return l.replace(/\[color]cyan/g, "<br/>")
                .replace(/{white}[-]{3,}{end}/g, "<br/>")
                .replace(/{end}/g, "<br/>")
                .replace(/(\[color][a-z]*)/g, "")
                .replace(/{[a-z]*}/g, "");
        });

        const websocketLines = formattedValues.map((l) => {
            return l.replace(/<br\/>[ ]*/g, '\n');
        });

        if (SimVar.GetSimVarValue("L:A32NX_PRINTER_PRINTING", "bool") === 1) {
            SimVar.SetSimVarValue("L:A32NX_PAGES_PRINTED", "number", SimVar.GetSimVarValue("L:A32NX_PAGES_PRINTED", "number") + 1);
            SimVar.SetSimVarValue("L:A32NX_PRINT_PAGE_OFFSET", "number", 0);
        }
        SimVar.SetSimVarValue("L:A32NX_PRINT_LINES", "number", lines.length);
        SimVar.SetSimVarValue("L:A32NX_PAGE_ID", "number", SimVar.GetSimVarValue("L:A32NX_PAGE_ID", "number") + 1);
        SimVar.SetSimVarValue("L:A32NX_PRINTER_PRINTING", "bool", 0).then(v => {
            this.fmgcMesssagesListener.triggerToAllSubscribers('A32NX_PRINT', formattedValues);
            this.sendToSocket(`print:${JSON.stringify({lines: websocketLines})}`);
            setTimeout(() => {
                SimVar.SetSimVarValue("L:A32NX_PRINTER_PRINTING", "bool", 1);
                this.printing = false;
            }, 2500);
        });
    }

    /* END OF MCDU AOC MESSAGE SYSTEM */
    /* WEBSOCKET */

    /**
     * Attempts to connect to a local websocket server
     */
    connectWebsocket(port) {

        const url = `ws://127.0.0.1:${port}`;

        if (this.socket) {
            // Trying to close a socket in readState == 0 leads to
            // an error message ('WebSocket is closed before the connection is established')
            // in the console.
            // Not closing sockets in readyState 0 leads to an accumulation of
            // unclosed sockets
            this.socket.close();
            this.socket = undefined;
        }

        this.socket = new WebSocket(url);

        this.socket.onerror = () => {
            // Check this to only log possible errors once connected.
            // Otherwise, it just spams the log when attempting to connect.
            if (this.socketConnectionAttempts > 0) {
                return;
            }
            console.log(`WebSocket connection error. Maybe MCDU Server disconnected? (${url})`);
        };

        this.socket.onclose = () => {
            // Check this to only log possible errors once connected.
            // Otherwise, it just spams the log when attempting to connect.
            if (this.socketConnectionAttempts > 0) {
                return;
            }
            console.log(`Websocket connection to MCDU Server closed. (${url})`);
        };

        this.socket.onopen = () => {
            console.log(`Websocket connection to MCDU Server established. (${url})`);
            (new NXNotifManager).showNotification({title: "MCDU CONNECTED", message: "Successfully connected to MCDU server.", timeout: 5000});
            this.sendToSocket("mcduConnected");
            this.sendUpdate();
            this.socketConnectionAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            const message = event.data;
            if (message.startsWith("event:")) {
                SimVar.SetSimVarValue(`H:A320_Neo_CDU_1_BTN_${message.substring(6)}`, "number", 0);
                SimVar.SetSimVarValue(`L:A32NX_MCDU_PUSH_ANIM_1_${message.substring(6)}`, "Number", 1);
            }
            if (message === "requestUpdate") {
                this.sendUpdate();
            }
        };
    }

    /**
     * Sends a message to the websocket server (if connected)
     * @param {string} message
     */
    sendToSocket(message) {
        if (this.socket && this.socket.readyState) {
            this.socket.send(message);
        }
    }

    /**
     * Sends an update to the websocket server (if connected) with the current state of the MCDU
     */
    sendUpdate() {
        // only calculate update when socket is established.
        if (!this.socket || !this.socket.readyState) {
            return;
        }
        let left = {
            lines: [
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
            ],
            scratchpad: '',
            title: '',
            titleLeft: '',
            page: '',
            arrows: [false, false, false, false]
        };
        let right = left;
        if (SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "bool")) {
            left = {
                lines: [
                    this._labels[0],
                    this._lines[0],
                    this._labels[1],
                    this._lines[1],
                    this._labels[2],
                    this._lines[2],
                    this._labels[3],
                    this._lines[3],
                    this._labels[4],
                    this._lines[4],
                    this._labels[5],
                    this._lines[5],
                ],
                scratchpad: `{${this.scratchpad.getColor()}}${this.scratchpad.getDisplayText()}{end}`,
                title: this._title,
                titleLeft: `{small}${this._titleLeft}{end}`,
                page: this._pageCount > 0 ? `{small}${this._pageCurrent}/${this._pageCount}{end}` : '',
                arrows: this._arrows
            };
        }

        if (SimVar.GetSimVarValue("L:A32NX_ELEC_AC_2_BUS_IS_POWERED", "bool")) {
            right = left;
        }
        const content = {right, left};
        this.sendToSocket(`update:${JSON.stringify(content)}`);
    }
    /* END OF WEBSOCKET */

    goToFuelPredPage() {
        if (this.isAnEngineOn()) {
            CDUFuelPredPage.ShowPage(this);
        } else {
            CDUInitPage.ShowPage2(this);
        }
    }
}
registerInstrument("a320-neo-cdu-main-display", A320_Neo_CDU_MainDisplay);
