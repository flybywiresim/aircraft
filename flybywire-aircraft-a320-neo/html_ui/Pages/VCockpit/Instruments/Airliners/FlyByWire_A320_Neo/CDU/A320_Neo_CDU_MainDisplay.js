class A320_Neo_CDU_Display {
    constructor(fmc, side, elecBus) {
        this.fmc = fmc;
        this.side = side;
        this.elecBus = elecBus;

        this._title = undefined;
        this._pageCurrent = undefined;
        this._pageCount = undefined;
        this.pageRedrawCallback = null;
        this.pageCleanupCallback = null;
        this.updateRequest = false;
        this.minPageUpdateThrottler = new UpdateThrottler(100);
        this.pageRefreshThrottler = new UpdateThrottler(1000);
        this._delayedPageSwitch = null;
        this._labels = [];
        this._lines = [];
        this._inOut = undefined;
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.lastUserInput = "";
        this.isDisplayingErrorMessage = false;
        this.isDisplayingTypeTwoMessage = false;
        this.activeSystem = 'FMGC';
        this.messageQueue = [];
        this.hasKeyboardFocus = false;
        this.lastInput = 0;
        this.clrStop = false;
        this.allSelected = false;

        this.root = document.createElement("div");
        this.root.id = "mcdu-" + this.side.toLowerCase();
        this.root.className = "mcdu-display";
    }

    get isPowered() {
        return SimVar.GetSimVarValue(`L:A32NX_ELEC_${this.elecBus}_BUS_IS_POWERED`, "Number") > 0;
    }

    Init() {
        this._titleLeftElement = this.root.querySelector("#title-left");
        this._titleElement = this.root.querySelector("#title");
        this._pageCurrentElement = this.root.querySelector("#page-current");
        this._pageCountElement = this.root.querySelector("#page-count");
        this._labelElements = [];
        this._lineElements = [];
        for (let i = 0; i < 6; i++) {
            this._labelElements[i] = [
                this.root.querySelector("#label-" + i + "-left"),
                this.root.querySelector("#label-" + i + "-right"),
                this.root.querySelector("#label-" + i + "-center")
            ];
            this._lineElements[i] = [
                this.root.querySelector("#line-" + i + "-left"),
                this.root.querySelector("#line-" + i + "-right"),
                this.root.querySelector("#line-" + i + "-center")
            ];
        }
        this._inOutElement = this.root.querySelector("#in-out");
        this._inOutElement.style.removeProperty("color");
        this._inOutElement.className = "white";

        this.setTimeout = (func) => {
            setTimeout(() => {
                func;
            }, this.getDelaySwitchPage());
        };
        this.onMenu = () => {
            this.forceClearScratchpad();
            FMCMainDisplayPages.MenuPage(this);
        };
        this.onLetterInput = (l) => {
            this.handlePreviousInputState();
            this.inOut += l;
        };
        this.onSp = () => {
            this.handlePreviousInputState();
            this.inOut += " ";
        };
        this.onDel = () => {
            this.handlePreviousInputState();
            if (this.inOut.length > 0) {
                this.inOut = this.inOut.slice(0, -1);
            }
        };
        this.onDiv = () => {
            this.handlePreviousInputState();
            this.inOut += "/";
        };
        this.onDot = () => {
            this.handlePreviousInputState();
            this.inOut += ".";
        };
        this.onClr = () => {
            if (this.inOut === "") {
                this.inOut = FMCMainDisplay.clrValue;
            } else if (this.inOut === FMCMainDisplay.clrValue) {
                this.inOut = "";
            } else if (this.isDisplayingErrorMessage || this.isDisplayingTypeTwoMessage) {
                this.tryRemoveMessage();
                this.lastUserInputToScratchpad();
                this._inOutElement.className = "white";
                this.isDisplayingErrorMessage = false;
                this.isDisplayingTypeTwoMessage = false;
            } else {
                this.inOut = this.inOut.slice(0, -1);
            }
            this.tryShowMessage();
        };
        this.onClrHeld = () => {
            if (this.inOut === FMCMainDisplay.clrValue || (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage)) {
                this.inOut = "";
            }
            this.tryShowMessage();
        };
        this.onPlusMinus = (defaultKey = "-") => {
            this.handlePreviousInputState();
            const val = this.inOut;
            if (val === "") {
                this.inOut = defaultKey;
            } else if (val !== FMCMainDisplay.clrValue && (!this.isDisplayingErrorMessage || !this.isDisplayingTypeTwoMessage)) {
                if (val.slice(-1) === "-") {
                    this.inOut = this.inOut.slice(0, -1) + "+";
                } else {
                    this.inOut += defaultKey;
                }
            }
        };
        this.onLeftFunction = (f) => {
            if (isFinite(f)) {
                if (this.onLeftInput[f]) {
                    const value = this.clearUserInput();
                    this.setDelayedPageSwitch(this.leftInputDelay[f] ? this.leftInputDelay[f](value) : this.getDelayBasic(), () => {
                        this.onLeftInput[f](value);
                        this.tryClearOldUserInput();
                    });
                }
            }
        };
        this.onRightFunction = (f) => {
            if (isFinite(f)) {
                if (this.onRightInput[f]) {
                    const value = this.clearUserInput();
                    this.setDelayedPageSwitch(this.rightInputDelay[f] ? this.rightInputDelay[f]() : this.getDelayBasic(), () => {
                        this.onRightInput[f](value);
                        this.tryClearOldUserInput();
                    });
                }
            }
        };
        this.onDir = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUDirectToPage.ShowPage);
        };
        this.onProg = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUProgressPage.ShowPage);
        };
        this.onPerf = () => {
            if (this.fmc.currentFlightPhase === FmgcFlightPhases.DONE) {
                this.fmc.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.PREFLIGHT);
            }
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUPerformancePage.ShowPage);
        };
        this.onInit = () => {
            if (this.fmc.currentFlightPhase === FmgcFlightPhases.DONE) {
                this.fmc.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.PREFLIGHT);
            }
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUInitPage.ShowPage1);
        };
        this.onData = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUDataIndexPage.ShowPage1);
        };
        this.onFpln = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUFlightPlanPage.ShowPage);
        };
        this.onSec = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUSecFplnMain.ShowPage);
        };
        this.onRad = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUNavRadioPage.ShowPage);
        };
        this.onFuel = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUFuelPredPage.ShowPage);
        };
        this.onAtc = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUAtcMenu.ShowPage1);
        };
        this.onMenu = () => {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), CDUMenuPage.ShowPage);
        };

        CDUMenuPage.ShowPage(this.fmc, this);
    }

    clearMessageQueue() {
        this.messageQueue = [];
    }

    onUpdate(_deltaTime) {
        if (this._delayedPageSwitch) {
            this._delayedPageSwitch.timeRemaining -= _deltaTime;
            if (this._delayedPageSwitch.timeRemaining <= 0) {
                this.updateRequest = false;
                this._delayedPageSwitch.callback(this.fmc, this, ...this._delayedPageSwitch.args);
                this._delayedPageSwitch = null;
            }
        }

        // the MCDUs are refreshed at a regular interval
        if (this.pageRefreshThrottler.canUpdate(_deltaTime) !== -1) {
            this.requestOnsideUpdate();
        }

        // and also on request (e.g. data changed), with a minimum time between updates
        if (this.minPageUpdateThrottler.canUpdate(_deltaTime) !== -1 && this.updateRequest) {
            this.updateRequest = false;
            if (this.pageRedrawCallback) {
                this.pageRedrawCallback();
            }
        }
    }

    setDelayedPageSwitch(time, callback, ...args) {
        this._delayedPageSwitch = {
            timeRemaining: time,
            callback: callback,
            args: args,
        };
    }

    /**
     * Updates both MCDU displays
     */
    requestUpdate() {
        this.fmc.requestUpdate();
    }

    requestOnsideUpdate() {
        this.updateRequest = true;
    }

    requestOffsideUpdate() {
        this.fmc.requestUpdate(this);
    }

    /**
     *
     * @param {(): void} redrawCallback function to be called to refresh the display (usually redraw the current page)
     * @param {string} activeSystem
     * @param {(): void} cleanupCallback function to do any cleanup before the next redraw (could be a different page, or the same page refreshed)
     */
    setCurrentPage(redrawCallback, activeSystem, cleanupCallback = null) {
        if (activeSystem) {
            this.activeSystem = activeSystem;
        }
        this.clearDisplay();
        this.pageRedrawCallback = redrawCallback;
        this.pageCleanupCallback = cleanupCallback;
    }

    generateHTMLLayout() {
        while (this.root.children.length > 0) {
            this.root.removeChild(this.root.children[0]);
        }
        const header = document.createElement("div");
        header.id = "header";

        const titleLeft = document.createElement("div");
        titleLeft.classList.add("s-text");
        titleLeft.id = "title-left";
        this.root.appendChild(titleLeft);

        const title = document.createElement("span");
        title.id = "title";
        header.appendChild(title);

        this.arrowHorizontal = document.createElement("span");
        this.arrowHorizontal.id = "arrow-horizontal";
        this.arrowHorizontal.innerHTML = "←→\xa0";
        header.appendChild(this.arrowHorizontal);

        this.root.appendChild(header);

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
        this.root.appendChild(page);

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
            this.root.appendChild(label);
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
            this.root.appendChild(line);
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
        this.root.appendChild(footer);
    }

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
        this._titleElement.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
        this._titleElement.classList.add(color);
        this._titleElement.textContent = this._title;
    }

    setTitleLeft(content) {
        if (!content) {
            this._titleLeftElement.textContent = "";
            return;
        }
        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._titleLeft = content.split("[color]")[0];
        this._titleLeftElement.classList.remove("white", "blue", "yellow", "green", "red", "magenta", "inop");
        this._titleLeftElement.classList.add(color);
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
            this.root.querySelector("#page-slash").textContent = "";
        } else {
            this.root.querySelector("#page-slash").textContent = "/";
        }
    }

    setLabel(label, row, col = -1) {
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
            e.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
            e.classList.add(color);
            label = label.split("[color]")[0];
        }
        this._labels[row][col] = label;
        this._labelElements[row][col].textContent = label;
    }

    /**
     * @param {string|CDU_Field} content
     * @param {number} row
     * @param {number} col
     */
    setLine(content, row, col = -1) {

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
            if (content.indexOf("[s-text]") !== -1) {
                content = content.replace("[s-text]", "");
                this._lineElements[row][col].classList.add("s-text");
            } else {
                this._lineElements[row][col].classList.remove("s-text");
            }
            let color = content.split("[color]")[1];
            if (!color) {
                color = "white";
            }
            const e = this._lineElements[row][col];
            e.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
            e.classList.add(color);
            content = content.split("[color]")[0];
        }
        this._lines[row][col] = content;
        this._lineElements[row][col].textContent = this._lines[row][col];
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
                        this.setLine(template[tIndex][0], i, 0);
                        this.setLine(template[tIndex][1], i, 1);
                        this.setLine(template[tIndex][2], i, 2);
                        this.setLine(template[tIndex][3], i, 3);
                    } else {
                        this.setLine(template[tIndex][0], i, -1);
                    }
                } else {
                    if (template[tIndex][1] !== undefined) {
                        this.setLabel(template[tIndex][0], i, 0);
                        this.setLabel(template[tIndex][1], i, 1);
                        this.setLabel(template[tIndex][2], i, 2);
                        this.setLabel(template[tIndex][3], i, 3);
                    } else {
                        this.setLabel(template[tIndex][0], i, -1);
                    }
                }
            }
            tIndex = 2 * i + 2;
            if (template[tIndex]) {
                if (template[tIndex][1] !== undefined) {
                    this.setLine(template[tIndex][0], i, 0);
                    this.setLine(template[tIndex][1], i, 1);
                    this.setLine(template[tIndex][2], i, 2);
                    this.setLine(template[tIndex][3], i, 3);
                } else {
                    this.setLine(template[tIndex][0], i, -1);
                }
            }
        }
        if (template[13]) {
            this.setInOut(template[13][0]);
        }
        // Apply formatting helper to title page, lines and labels
        if (this._titleElement !== null) {
            this._titleElement.innerHTML = this._formatCell(this._titleElement.innerHTML);
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
    }

    /**
     * Sets what arrows will be displayed in the corner of the screen. Arrows are removed when clearDisplay() is called.
     * @param {boolean} up - whether the up arrow will be displayed
     * @param {boolean} down - whether the down arrow will be displayed
     * @param {boolean} left - whether the left arrow will be displayed
     * @param {boolean} right - whether the right arrow will be displayed
     */
    setArrows(up, down, left, right) {
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

    clearDisplay() {
        this.setTitle("UNTITLED");
        this.setPageCurrent(0);
        this.setPageCount(0);
        this.pageRedrawCallback = null;
        if (this.pageCleanupCallback) {
            this.pageCleanupCallback();
        }
        this.pageCleanupCallback = null;
        for (let i = 0; i < 6; i++) {
            this.setLabel("", i, -1);
        }
        for (let i = 0; i < 6; i++) {
            this.setLine("", i, -1);
        }
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.onPrevPage = () => {};
        this.onNextPage = () => {};
        this.pageUpdate = () => {};
        this.setArrows(false, false);
        this.onUp = undefined;
        this.onDown = undefined;
        this.onLeft = undefined;
        this.onRight = undefined;
        this.updateRequest = false;
    }

    /* END OF MCDU INTERFACE/LAYOUT */
    /* MCDU SCRATCHPAD */

    get inOut() {
        return this.getInOut();
    }

    getInOut() {
        if (this._inOut === undefined) {
            this._inOut = this._inOutElement.textContent;
        }
        return this._inOut;
    }

    set inOut(v) {
        if (v.length < 23) {
            this.setInOut(v);
        }
    }

    setInOut(content) {
        this._inOut = content;
        this._inOutElement.textContent = this._inOut;
    }

    forceClearScratchpad() {
        this.inOut = "";
        this.lastUserInput = "";
        this.isDisplayingErrorMessage = false;
        this.isDisplayingTypeTwoMessage = false;
        this.tryShowMessage();
    }

    lastUserInputToScratchpad() {
        this.inOut = this.lastUserInput;
        this.lastUserInput = "";
    }

    handlePreviousInputState() {
        if (this.inOut === FMCMainDisplay.clrValue) {
            this.inOut = "";
        }
        if (this.isDisplayingErrorMessage || this.isDisplayingTypeTwoMessage) {
            this.lastUserInputToScratchpad();
            this._inOutElement.className = "white";
            this.isDisplayingErrorMessage = false;
            this.isDisplayingTypeTwoMessage = false;
        }
    }

    clearUserInput() {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage) {
            this.lastUserInput = this.inOut;
            this.inOut = "";
            this._inOutElement.className = "white";
        }
        return this.lastUserInput;
    }

    tryClearOldUserInput() {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage) {
            this.lastUserInput = "";
        }
        this.tryShowMessage();
    }

    /**
     * This handler will write data to the scratchpad
     * @param data {string}
     */
    sendDataToScratchpad(data) {
        this.isDisplayingErrorMessage = false;
        this.isDisplayingTypeTwoMessage = false;
        this._inOutElement.className = "white";
        this.inOut = data;
    }

    setKeyboardFocus(timeout) {
        if (this.hasKeyboardFocus) {
            return;
        }
        this.hasKeyboardFocus = true;
        this.root.querySelector("#header").style = "background: linear-gradient(180deg, rgba(2,182,217,1.0) 65%, rgba(255,255,255,0.0) 65%);";
        this._inOutElement.style = "display: inline-block; width:87%; background: rgba(255,255,255,0.2);";
        Coherent.trigger('FOCUS_INPUT_FIELD');
        this.lastInput = new Date();
        if (timeout) {
            this.checkFocus = setInterval(() => {
                if (Math.abs(new Date() - this.lastInput) / 1000 >= timeout) {
                    this.clearKeyboardFocus();
                }
            }, Math.min(timeout * 1000 / 2, 1000));
        }
    }

    clearKeyboardFocus() {
        if (!this.hasKeyboardFocus) {
            return;
        }
        this.hasKeyboardFocus = false;
        this.allSelected = false;
        Coherent.trigger('UNFOCUS_INPUT_FIELD');
        this._inOutElement.style = null;
        this.root.querySelector("#header").style = null;
        if (this.checkFocus) {
            clearInterval(this.checkFocus);
        }
    }

    /* END OF MCDU SCRATCHPAD */
    /* MCDU MESSAGE SYSTEM */

    /**
     * General message handler
     * @param message {{text, isAmber, isTypeTwo}} Message Object
     * @param isResolved {function} Function that determines if the error is resolved at this moment (type II only).
     * @param onClear {function} Function that executes when the error is actively cleared by the pilot (type II only).
     * @param propagate {boolean} Whether to propagate type II messages to the other MCDU
     */
    addNewMessage(message, isResolved = () => false, onClear = () => {}, propagate = true) {
        if (message.isTypeTwo) {
            if (!isResolved()) {
                this._addTypeTwoMessage(message.text, message.isAmber, isResolved, onClear);
                if (propagate) {
                    this.fmc.addNewOffsideMessage(this, message, isResolved, onClear);
                }
            }
        } else {
            this._showTypeOneMessage(message.text, message.isAmber);
        }
    }

    _showTypeOneMessage(message, color = false) {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage && !this.lastUserInput) {
            this.lastUserInput = this.inOut;
        }
        this.isDisplayingErrorMessage = true;
        this.inOut = message;
        this._inOutElement.className = color ? "amber" : "white";
    }

    /**
     * Add Type II Message
     * @param message {string} Message to be displayed
     * @param isAmber {boolean} Is color amber
     * @param isResolved {function} Function that determines if the error is resolved at this moment (type II only).
     * @param onClear {function} Function that executes when the error is actively cleared by the pilot (type II only).
     */
    _addTypeTwoMessage(message, isAmber, isResolved, onClear) {
        if (this.checkForMessage(message)) {
            // Before adding message to queue, check other messages in queue for validity
            for (let i = 0; i < this.messageQueue.length; i++) {
                if (this.messageQueue[i][2](this)) {
                    this.messageQueue.splice(i, 1);
                }
            }
            this.messageQueue.unshift([message, isAmber, isResolved, onClear]);
            if (this.messageQueue.length > 5) {
                this.messageQueue.splice(5, 1);
            }
            this.tryShowMessage();
        }
    }

    tryShowMessage() {
        if (!this.isDisplayingErrorMessage && (!this.inOut || this.isDisplayingTypeTwoMessage) && this.messageQueue.length > 0) {
            if (this.messageQueue[0][2](this)) {
                this.messageQueue.splice(0, 1);
                this._inOutElement.className = "white";
                this.lastUserInputToScratchpad();
                return this.tryShowMessage();
            }
            if (!this.isDisplayingErrorMessage) {
                if (!this.isDisplayingTypeTwoMessage) {
                    this.isDisplayingTypeTwoMessage = true;
                    this.lastUserInput = this.inOut;
                }
                this.inOut = this.messageQueue[0][0];
                this._inOutElement.className = this.messageQueue[0][1] ? "amber" : "white";
            }
        }
    }

    /**
     * Removes Type II Message
     * @param message {string} Message to be removed
     */
    tryRemoveMessage(message) {
        if (message === undefined) {
            message = this.inOut;
        }
        for (let i = 0; i < this.messageQueue.length; i++) {
            if (this.messageQueue[i][0] === message) {
                this.messageQueue[i][3](this);
                this.messageQueue.splice(i, 1);
                if (i === 0 && this.isDisplayingTypeTwoMessage) {
                    this._inOutElement.className = "white";
                    this.lastUserInputToScratchpad();
                }
                break;
            }
        }
        this.tryShowMessage();
    }

    checkForMessage(message) {
        if (!message) {
            return false;
        }
        for (let i = 0; i < this.messageQueue.length; i++) {
            if (this.messageQueue[i][0] === message) {
                if (i !== 0) {
                    this.messageQueue.unshift(this.messageQueue[i]);
                    this.messageQueue.splice(i + 1, 1);
                    this.tryShowMessage();
                }
                return false;
            }
        }
        return true;
    }

    /* END OF MCDU MESSAGE SYSTEM */
    /* MCDU EVENTS */

    onEvent(input) {
        if (this.onInputAircraftSpecific(input)) {
            return;
        }
        if (input === "INIT") {
            this.onInit();
        } else if (input === "DEPARR") {
            this.onDepArr();
        } else if (input === "ATC") {
            this.onAtc();
        } else if (input === "FIX") {
            this.onFix();
        } else if (input === "HOLD") {
            this.onHold();
        } else if (input === "FMCCOMM") {
            this.onFmcComm();
        } else if (input === "PROG") {
            this.onProg();
        } else if (input === "MENU") {
            this.onMenu();
        } else if (input === "NAVRAD") {
            this.onRad();
        } else if (input === "PREVPAGE") {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), this.onPrevPage);
        } else if (input === "NEXTPAGE") {
            this.setDelayedPageSwitch(this.getDelaySwitchPage(), this.onNextPage);
        } else if (input === "SP") {
            setTimeout(() => {
                this.onSp();
            }, this.getDelaySwitchPage());
        } else if (input === "DEL") {
            setTimeout(() => {
                this.onDel();
            }, this.getDelaySwitchPage());
        } else if (input === "CLR") {
            setTimeout(() => {
                this.onClr();
            }, this.getDelaySwitchPage());
        } else if (input === "CLR_Held") {
            this.onClrHeld();
        } else if (input === "DIV") {
            setTimeout(() => {
                this.onDiv();
            }, this.getDelaySwitchPage());
        } else if (input === "DOT") {
            setTimeout(() => {
                this.onDot();
            }, this.getDelaySwitchPage());
        } else if (input === "PLUSMINUS") {
            setTimeout(() => {
                this.onPlusMinus("-");
            }, this.getDelaySwitchPage());
        } else if (input === "Localizer") {
            this._apLocalizerOn = !this._apLocalizerOn;
        } else if (input.length === 2 && input[0] === "L") {
            const v = parseInt(input[1]);
            this.onLeftFunction(v - 1);
        } else if (input.length === 2 && input[0] === "R") {
            const v = parseInt(input[1]);
            this.onRightFunction(v - 1);
        } else if (input.length === 1 && FMCMainDisplay._AvailableKeys.indexOf(input) !== -1) {
            setTimeout(() => {
                this.onLetterInput(input);
            }, this.getDelaySwitchPage());
        } else {
            console.log("'" + input + "'");
        }
    }

    onInputAircraftSpecific(input) {
        if (input === "DIR") {
            if (this.onDir) {
                this.onDir();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "PROG") {
            if (this.onProg) {
                this.onProg();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "PERF") {
            if (this.onPerf) {
                this.onPerf();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "INIT") {
            if (this.onInit) {
                this.onInit();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "DATA") {
            if (this.onData) {
                this.onData();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "FPLN") {
            if (this.onFpln) {
                this.onFpln();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "RAD") {
            if (this.onRad) {
                this.onRad();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "FUEL") {
            if (this.onFuel) {
                this.onFuel();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "SEC") {
            if (this.onSec) {
                this.onSec();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "ATC") {
            if (this.onAtc) {
                this.onAtc();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "MENU") {
            if (this.onMenu) {
                this.onMenu();
            }
            return true;
        } else if (input === "AIRPORT") {
            if (this.onAirport) {
                this.onAirport();
                this.activeSystem = 'FMGC';
            }
            return true;
        } else if (input === "UP") {
            if (this.onUp) {
                this.onUp();
            }
            return true;
        } else if (input === "DOWN") {
            if (this.onDown) {
                this.onDown();
            }
            return true;
        } else if (input === "LEFT") {
            if (this.onLeft) {
                this.onLeft();
            }
            return true;
        } else if (input === "RIGHT") {
            if (this.onRight) {
                this.onRight();
            }
        } else if (input === "OVFY") {
            if (this.onOvfy) {
                this.onOvfy();
            }
            return true;
        }
        return false;
    }

    onKeyboardKeyDown(keycode, altKey, ctrlKey, shiftKey) {
        this.lastInput = new Date();
        let setAnimation;
        if (altKey || (ctrlKey && keycode === KeyCode.KEY_Z)) {
            this.clearKeyboardFocus();
        } else if (ctrlKey && keycode === KeyCode.KEY_A) {
            this.allSelected = !this.allSelected;
            this._inOutElement.style = `display: inline-block; width:87%; background: ${this.allSelected ? 'rgba(235,64,52,1.0)' : 'rgba(255,255,255,0.2)'};`;
        } else if (shiftKey && ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
            this.forceClearScratchpad();
        } else if (ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
            let wordFlag = this.inOut.includes(' ') ? false : true;
            for (let i = this.inOut.length; i > 0; i--) {
                if (this.inOut.slice(-1) === ' ') {
                    if (!wordFlag) {
                        this.onClr();
                    } else {
                        wordFlag = true;
                        break;
                    }
                }
                if (this.inOut.slice(-1) !== ' ') {
                    if (!wordFlag) {
                        wordFlag = true;
                    } else {
                        this.onClr();
                    }
                }
            }
        } else if (shiftKey && keycode === KeyCode.KEY_BACK_SPACE) {
            if (!this.checkClr) {
                this.onClr();
                this.checkClr = setTimeout(() => {
                    this.onClrHeld();
                }, 2000);
            }
            setAnimation = "CLR";
        } else if (keycode >= KeyCode.KEY_0 && keycode <= KeyCode.KEY_9 || keycode >= KeyCode.KEY_A && keycode <= KeyCode.KEY_Z) {
            const letter = String.fromCharCode(keycode);
            this.onLetterInput(letter);
            setAnimation = letter.toUpperCase();
        } else if (keycode === KeyCode.KEY_PERIOD || keycode === KeyCode.KEY_DECIMAL) {
            this.onDot();
            setAnimation = "DOT";
        } else if (keycode === KeyCode.KEY_SLASH || keycode === KeyCode.KEY_BACK_SLASH || keycode === KeyCode.KEY_DIVIDE || keycode === 226) {
            this.onDiv();
            setAnimation = "SLASH";
        } else if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
            if (this.allSelected) {
                this.forceClearScratchpad();
            } else if (!this.clrStop) {
                this.onClr();
                setAnimation = "CLR";
                if (this.inOut === "" || this.inOut === FMCMainDisplay.clrValue || this.isDisplayingErrorMessage || this.isDisplayingTypeTwoMessage) {
                    this.clrStop = true;
                }
            }
        } else if (keycode === KeyCode.KEY_SPACE) {
            this.onSp();
            setAnimation = "SP";
        } else if (keycode === 189 || keycode === KeyCode.KEY_SUBTRACT) {
            this.onPlusMinus("-");
            setAnimation = "PLUSMINUS";
        } else if (keycode === 187 || keycode === KeyCode.KEY_ADD) {
            this.onPlusMinus("+");
            setAnimation = "PLUSMINUS";
        } else if (keycode >= KeyCode.KEY_F1 && keycode <= KeyCode.KEY_F6) {
            const func_num = keycode - KeyCode.KEY_F1;
            this.onLeftFunction(func_num);
            setAnimation = "L" + (func_num + 1);
        } else if (keycode >= KeyCode.KEY_F7 && keycode <= KeyCode.KEY_F12) {
            const func_num = keycode - KeyCode.KEY_F7;
            this.onRightFunction(func_num);
            setAnimation = "R" + (func_num + 1);
        }
        return setAnimation;
    }

    onKeyboardKeyUp(keycode) {
        this.lastInput = new Date();
        if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
            this.clrStop = false;
        }
        if (this.checkClr) {
            clearTimeout(this.checkClr);
            this.checkClr = undefined;
        }
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
        if (this.fmc._zeroFuelWeightZFWCGEntered && this.fmc._blockFuelEntered) {
            return Math.pow(this.fmc.flightPlanManager.getWaypointsCount(), 2) + (this.fmc.flightPlanManager.getDestination().cumulativeDistanceInFP) / 10 + Math.random() * 300;
        } else {
            return 300 + this.fmc.flightPlanManager.getWaypointsCount() * Math.random() + this.fmc.flightPlanManager.getDestination().cumulativeDistanceInFP * Math.random();
        }
    }

    /**
     * Used for calculation time for fuel pred page
     * @returns {number} dynamic delay in ms between 2000ms and 4000ms
     */
    getDelayFuelPred() {
        return 225 * this.fmc.flightPlanManager.getWaypointsCount() + (this.fmc.flightPlanManager.getDestination().cumulativeDistanceInFP / 2);
    }

    /**
     * Used to load wind data into fms
     * @returns {number} dynamic delay in ms dependent on amount of waypoints
     */
    getDelayWindLoad() {
        return Math.pow(this.fmc.flightPlanManager.getWaypointsCount(), 2);
    }

    /* END OF MCDU DELAY SIMULATION */
    /* MCDU AOC MESSAGE SYSTEM */
}

class A320_Neo_CDU_MainDisplay extends FMCMainDisplay {
    constructor() {
        super(...arguments);
        this._registered = false;
        this.mcdus = [];
    }
    get templateID() {
        return "A320_Neo_CDU";
    }
    get isInteractive() {
        return NXDataStore.get("MCDU_KB_INPUT", "DISABLED") === "ENABLED";
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

    Init() {
        super.Init();
        Coherent.trigger('UNFOCUS_INPUT_FIELD');// note: without this, resetting mcdu kills camera

        this.lcdOverlay = document.querySelector("#LcdOverlay");

        const mainframe = this.getChildById("Mainframe");

        const mcduConfigs = [
            {
                side: 'L',
                elecBus: 'AC_ESS_SHED',
            },
            {
                side: 'R',
                elecBus: 'AC_2',
            },
        ];

        mcduConfigs.forEach((config) => {
            const mcdu = new A320_Neo_CDU_Display(this, config.side, config.elecBus);
            mcdu.generateHTMLLayout();
            mainframe.appendChild(mcdu.root);
            this.mcdus.push(mcdu);
            mcdu.Init();
        });

        this.aocAirportList = new CDUAocAirportList; // TODO kill this ugliness

        // If the consent is not set, show telex page
        const onlineFeaturesStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "UNKNOWN");
        if (onlineFeaturesStatus === "UNKNOWN") {
            CDU_OPTIONS_TELEX.ShowPage(this.fmc, this);
        }

        this.initKeyboardScratchpad();
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        this.mcdus.forEach((mcdu) => mcdu.onUpdate(_deltaTime));

        this.lcdOverlay.style.opacity = SimVar.GetSimVarValue("L:A32NX_MFD_MASK_OPACITY", "number");
    }

    initMcduVariables() {
        this.mcdus.forEach((mcdu) => mcdu.clearMessageQueue());
        this.aocAirportList.init();
    }

    /**
     * Updates all MCDU displays, with optional exclude
     */
    requestUpdate(excludeMcdu) {
        this.mcdus.forEach((mcdu) => {
            if (mcdu !== excludeMcdu) {
                mcdu.requestOnsideUpdate();
            }
        });
    }

    onEvent(_event) {
        super.onEvent(_event);
        const match = _event.match(/^([0-9])_BTN_(.+)$/);
        if (match !== null) {
            const mcduIndex = parseInt(match[1]) - 1;
            const event = match[2];
            if (mcduIndex >= 0 && mcduIndex < this.mcdus.length) {
                this.mcdus[mcduIndex].onEvent(event);
            }
        }
    }

    onPowerOn() {
        super.onPowerOn();
    }

    /**
     * Add a new scratchpad message to all MCDUs (should be type II)
     * @param message {{text, isAmber, isTypeTwo}} Message Object
     * @param isResolved {function} Function that determines if the error is resolved at this moment (type II only).
     * @param onClear {function} Function that executes when the error is actively cleared by the pilot (type II only).
     */
    addNewMessage(message, isResolved = () => false, onClear = () => {}) {
        this.mcdus.forEach((mcdu) => mcdu.addNewMessage(message, isResolved, onClear, false));
    }

    /**
     * Add a new scratchpad message to other MCDUs (should be type II, and should only be called by the MCDUs!)
     * @param message {{text, isAmber, isTypeTwo}} Message Object
     * @param isResolved {function} Function that determines if the error is resolved at this moment (type II only).
     * @param onClear {function} Function that executes when the error is actively cleared by the pilot (type II only).
     */
    addNewOffsideMessage(onsideMcdu, message, isResolved = () => false, onClear = () => {}) {
        this.mcdus.forEach((mcdu) => {
            if (mcdu !== onsideMcdu) {
                mcdu.addNewMessage(message, isResolved, onClear, false);
            }
        });
    }

    /**
     * Tries to remove a message from both sides
     * @param {string} msg
     */
    tryRemoveMessage(msg) {
        this.mcdus.forEach((mcdu) => mcdu.tryRemoveMessage(msg));
    }

    clearKeyboardFocus(excludeMcdu) {
        this.mcdus.forEach((mcdu) => {
            if (mcdu !== excludeMcdu) {
                mcdu.clearKeyboardFocus();
            }
        });
    }

    initKeyboardScratchpad() {
        window.document.addEventListener('click', (ev) => {
            // the MCDU "texture" is split in a split * split grid, indexed from left to right, top to bottom
            const split = Math.ceil(Math.sqrt(this.mcdus.length));
            const splitPx = window.document.body.clientWidth / split;
            const splitPy = window.document.body.clientHeight / split;
            const clickIndexX = Math.floor(ev.clientX / splitPx);
            const clickIndexY = Math.floor(ev.clientY / splitPy);
            const mcduIndex = clickIndexY * split + clickIndexX;

            if (mcduIndex >= 0 && mcduIndex < this.mcdus.length) {
                const mcdu = this.mcdus[mcduIndex];
                const kbInputEnabled = NXDataStore.get("MCDU_KB_INPUT", "DISABLED") === "ENABLED";
                const mcduTimeout = parseInt(NXDataStore.get("CONFIG_MCDU_KB_TIMEOUT", "60"));

                if (kbInputEnabled) {
                    if (mcdu.isPowered && !mcdu.hasKeyboardFocus) {
                        this.clearKeyboardFocus(mcdu);
                        mcdu.setKeyboardFocus(mcduTimeout);
                    } else {
                        mcdu.clearKeyboardFocus();
                    }
                } else {
                    this.clearKeyboardFocus();
                }
            }
        });
        window.document.addEventListener('keydown', (e) => {
            const mcduIndex = this.mcdus.findIndex((mcdu) => mcdu.hasKeyboardFocus);

            if (mcduIndex >= 0) {
                const mcdu = this.mcdus[mcduIndex];

                let keycode = e.keyCode;

                if (keycode >= KeyCode.KEY_NUMPAD0 && keycode <= KeyCode.KEY_NUMPAD9) {
                    keycode -= 48; // numpad support
                }
                // Note: tried using H-events, worse performance. Reverted to direct input.
                // Preventing repeated input also similarly felt awful and defeated the point.
                // Clr hold functionality pointless as scratchpad will be cleared (repeated input).

                const setAnimation = mcdu.onKeyboardKeyDown(keycode, e.altKey, e.ctrlKey, e.shiftKey);

                if (setAnimation) {
                    SimVar.SetSimVarValue(`L:A32NX_MCDU_PUSH_ANIM_${mcduIndex + 1}_${setAnimation}`, "Number", 1);
                }
            }
        });
        window.document.addEventListener('keyup', (e) => {
            const mcdu = this.mcdus.find((mcdu) => mcdu.hasKeyboardFocus);
            if (mcdu !== undefined) {
                mcdu.onKeyboardKeyUp(e.keyCode);
            }
        });
    }
}
registerInstrument("a320-neo-cdu-main-display", A320_Neo_CDU_MainDisplay);
