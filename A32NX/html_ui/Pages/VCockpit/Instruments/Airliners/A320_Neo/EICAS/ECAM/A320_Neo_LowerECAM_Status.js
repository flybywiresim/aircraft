var A320_Neo_LowerECAM_Status;
(function (A320_Neo_LowerECAM_Status) {
    class Definitions {
    }
    A320_Neo_LowerECAM_Status.Definitions = Definitions;
    function createDiv(_id, _class = "", _text = "") {
        const div = document.createElement("div");
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
    A320_Neo_LowerECAM_Status.createDiv = createDiv;
    class Page extends Airliners.EICASTemplateElement {

        isInop(_system) {
            return SimVar.GetSimVarValue("L:A32NX_ECAM_INOP_SYS_" + _system, "Bool");
        }

        constructor() {
            super();
            this.frameCount = 0;
            this.isInitialised = false;
            this.statusMessages = {
                failures: [
                    {
                        name: "",
                        messages: [
                            {
                                message: "AVOID ICING CONDITIONS",
                                style: "blue",
                                isActive: () => {
                                    return this.isInop("WING_A_ICE");
                                },
                                actions: [
                                    {
                                        style: "remark",
                                        message: "IF SEVERE ICE ACCRETION"
                                    },
                                    {
                                        style: "blue",
                                        message: "MIN SPD.....VLS+10/G DOT"
                                    },
                                    {
                                        style: "blue",
                                        message: "MANUEVER WITH CARE"
                                    },
                                    {
                                        style: "blue",
                                        message: ""
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "",
                        messages: [
                            {
                                message: "LDG DIST PROC......APPLY",
                                style: "blue",
                                isActive: () => {
                                    return this.isInop("ENG_1") || this.isInop("ENG_2");
                                },
                                actions: [
                                    {
                                        style: "blue",
                                        message: ""
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "",
                        messages: [
                            {
                                message: "MAX BRK PR......1000PSI",
                                style: "blue",
                                isActive: () => this.isInop("ASKID_NWS"),
                                actions: [
                                    {
                                        message: "LDG DIST PROC.....APPLY",
                                        style: "blue"
                                    },
                                ]
                            }
                        ]
                    },
                    {
                        name: "",
                        messages: [
                            {
                                message: "CAT 3 SINGLE ONLY",
                                style: "InfoIndication",
                                isActive: () => {
                                    return this.isInop("CAT_3_DUAL");
                                },
                                actions: [
                                    {
                                        style: "blue",
                                        message: ""
                                    }
                                ]
                            }
                        ]
                    },
                ],
                normal: []
            };
            this.statusMessageArea = new A320_Neo_LowerECAM_Status.StatusMessagePanel(this, "status-messages", 15, this.statusMessages);
            this.inopMessages = {
                failures: [],
                normal: [
                    {
                        message: "G+Y HYD",
                        isActive: () => {
                            return this.isInop("G_HYD") && this.isInop("Y_HYD");
                        }
                    },
                    {
                        message: "R AIL",
                        isActive: () => {
                            return this.isInop("R_AIL");
                        }
                    },
                    {
                        message: "IR 2+3",
                        isActive: () => {
                            return this.isInop("IR_2") && this.isInop("IR_3");
                        }
                    },
                    {
                        message: "ELAC 2",
                        isActive: () => {
                            return this.isInop("ELAC_2");
                        }
                    },
                    {
                        message: "YAW DAMPER",
                        isActive: () => {
                            return this.isInop("YAW_DAMPER");
                        }
                    },
                    {
                        message: "A/THR",
                        isActive: () => {
                            return this.isInop("ATHR");
                        }
                    },
                    {
                        message: "L/G RETRACT",
                        isActive: () => {
                            return this.isInop("LG_RETRACT");
                        }
                    },
                    {
                        message: "F/CTL PROT",
                        isActive: () => {
                            return this.isInop("FCTL_PROT");
                        }
                    },
                    {
                        message: "REVERSER 1+2",
                        isActive: () => {
                            return this.isInop("REVERSER_1") && this.isInop("REVERSER_3");
                        }
                    },
                    {
                        message: "RA 1+2",
                        isActive: () => {
                            return this.isInop("RA_1") && this.isInop("RA_2");
                        }
                    },
                    {
                        message: "SEC 2+3",
                        isActive: () => {
                            return this.isInop("SEC_2") && this.isInop("SEC_3");
                        }
                    },
                    {
                        message: "A/CALL OUT",
                        isActive: () => {
                            return this.isInop("ACALL_OUT");
                        }
                    },
                    {
                        message: "FUEL PUMPS",
                        isActive: () => {
                            return this.isInop("FUEL_PUMPS");
                        }
                    },
                    {
                        message: "CAP PR 1+2",
                        isActive: () => {
                            return this.isInop("CAB_PR_1") && this.isInop("CAB_PR_2");
                        }
                    },
                    {
                        message: "STABILIZER",
                        isActive: () => {
                            return this.isInop("STABILIZER");
                        }
                    },
                    {
                        message: "ADR 2+3",
                        isActive: () => {
                            return this.isInop("ADR_2") && this.isInop("ADR_3");
                        }
                    },
                    {
                        message: "SPOILER 1+2+4+5",
                        isActive: () => {
                            return this.isInop("SPOILER_1245");
                        }
                    },
                    {
                        message: "FLAPS",
                        isActive: () => {
                            return this.isInop("FLAPS");
                        }
                    },
                    {
                        message: "AP 1+2",
                        isActive: () => {
                            return this.isInop("AP_1") && this.isInop("AP_2");
                        }
                    },
                    {
                        message: "WING A.ICE",
                        isActive: () => {
                            return this.isInop("WING_A_ICE");
                        }
                    },
                    {
                        message: "CAT 3",
                        isActive: () => this.isInop("CAT_3")
                    },
                    {
                        message: "CAT 3 DUAL",
                        isActive: () => {
                            return this.isInop("CAT_3_DUAL");
                        }
                    },
                    {
                        message: "ENG 1 BLEED",
                        isActive: () => {
                            return this.isInop("ENG_1_BLEED");
                        }
                    },
                    {
                        message: "ENG 2 BLEED",
                        isActive: () => {
                            return this.isInop("ENG_2_BLEED");
                        }
                    },
                    {
                        message: "PACK 1",
                        isActive: () => {
                            return this.isInop("PACK_1") && !this.isInop("PACK_2");
                        }
                    },
                    {
                        message: "PACK 2",
                        isActive: () => {
                            return this.isInop("PACK_2") && !this.isInop("PACK_1");
                        }
                    },
                    {
                        message: "PACK 1+2",
                        isActive: () => {
                            return this.isInop("PACK_1") && this.isInop("PACK_2");
                        }
                    },
                    {
                        message: "MAIN GALLEY",
                        isActive: () => {
                            return this.isInop("MAIN_GALLEY");
                        }
                    },
                    {
                        message: "GEN 1",
                        isActive: () => {
                            return this.isInop("GEN_1");
                        }
                    },
                    {
                        message: "GEN 2",
                        isActive: () => {
                            return this.isInop("GEN_2");
                        }
                    },
                    {
                        message: "Y ENGINE 2 PUMP",
                        isActive: () => {
                            return this.isInop("Y_ENGINE_2_PUMP");
                        }
                    },
                    {
                        message: "G ENGINE 1 PUMP",
                        isActive: () => {
                            return this.isInop("G_ENGINE_1_PUMP");
                        }
                    },
                    {
                        message: "TCAS",
                        isActive: () => {
                            return this.isInop("TCAS");
                        }
                    },
                    {
                        message: "ANTI SKID",
                        isActive: () => this.isInop("ANTI_SKID")
                    },
                    {
                        message: "N/W STRG",
                        isActive: () => this.isInop("NS_STEER")
                    },
                    {
                        message: "NORM BRK",
                        isActive: () => this.isInop("NORM_BRK")
                    },
                    {
                        message: "ALTN BRK",
                        isActive: () => this.isInop("ALTN_BRK")
                    },
                    {
                        message: "AUTO BRK",
                        isActive: () => {
                            return this.isInop("AUTO_BRK");
                        }
                    },
                ]
            };
            this.inopSystemsMessageArea = new A320_Neo_LowerECAM_Status.StatusMessagePanel(this, "inop-systems", 15, this.inopMessages);
        }
        get templateID() {
            return "LowerECAMStatusTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.statusNormal = this.querySelector("#status-normal");
            this.inopSysTitle = this.querySelector("#inop-sys-title");
            this.statusMessageArea.init();
            this.inopSystemsMessageArea.init();
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            this.frameCount++;
            if (this.frameCount % 8 == 0) {
                this.statusMessageArea.update();
                this.inopSystemsMessageArea.update();
                this.statusNormal.setAttribute("visibility", (this.statusMessageArea.hasActiveFailures || this.inopSystemsMessageArea.hasActiveMessages) ? "hidden" : "visible");
                this.inopSysTitle.setAttribute("visibility", (this.statusMessageArea.hasActiveFailures || this.inopSystemsMessageArea.hasActiveMessages) ? "visible" : "hidden");
            }
        }
    }
    A320_Neo_LowerECAM_Status.Page = Page;
})(A320_Neo_LowerECAM_Status || (A320_Neo_LowerECAM_Status = {}));
customElements.define("a320-neo-lower-ecam-status", A320_Neo_LowerECAM_Status.Page);

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
            this.divMain = A320_Neo_LowerECAM_Status.createDiv(this.divID);
            this.parent.appendChild(this.divMain);
        }
    }
}
A320_Neo_LowerECAM_Status.PanelBase = PanelBase;

/**
 * Represents an ECAM message panel that can display status information
 */
class StatusMessagePanel extends A320_Neo_LowerECAM_Status.PanelBase {
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
        this.hasActiveMessages = false;
        this.clearedMessages = [];
    }
    init() {
        super.init();
        for (let i = 0; i < this.maxLines; i++) {
            this.addDiv();
        }
    }
    update() {

        this.activeCategories = [];
        this.currentLine = 0;
        for (const div of this.allDivs) {
            div.innerHTML = "";
        }
        const activeFailures = this.getActiveFailures();
        for (const i in activeFailures) {
            const category = activeFailures[i];
            for (const failure of category.messages) {
                this.addLine(failure.style, category.name, failure.message, failure.action, failure.alwaysShowCategory);
                if (failure.actions != null) {
                    for (const action of failure.actions) {
                        if (action.isCompleted == null || !action.isCompleted()) {
                            this.addLine(action.style, null, action.message, action.action);
                        }
                    }
                }
            }
        }
        const activeMessages = this.getActiveMessages();
        for (const message of activeMessages) {
            this.addLine(message.style || "InfoCaution", null, message.message, null);
        }
    }
    addLine(_style, _category, _message, _action, _alwaysShowCategory = false) {
        if (this.currentLine < this.maxLines) {
            const div = this.allDivs[this.currentLine];
            div.innerHTML = "";
            div.className = _style;
            if (div != null) {

                //Category
                if (_category != null && (!this.activeCategories.includes(_category) || _alwaysShowCategory)) {
                    const category = document.createElement("span");
                    category.className = "Underline";
                    category.textContent = _category;
                    div.appendChild(category);
                }

                //Message
                const message = document.createElement("span");
                switch (_style) {
                    case "action":
                        var msgOutput = "-" + _message;
                        for (var i = 0; i < (23 - _message.length - _action.length); i++) {
                            msgOutput = msgOutput + ".";
                        }
                        msgOutput += _action;
                        break;
                    case "remark":
                        var msgOutput = "." + (_message + ":").substring(0,23);
                        break;
                    default:
                        var msgOutput = " " + _message;
                        if (!_category) {
                            break;
                        }
                        if (this.activeCategories.includes(_category)) {
                            for (var i = 0; i < _category.length; i++) {
                                msgOutput = "&nbsp;" + msgOutput;
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
        const output = {};
        this.hasActiveFailures = false;
        this.hasWarnings = false;
        this.hasCautions = false;
        for (let i = 0; i < this.messages.failures.length; i++) {
            const messages = this.messages.failures[i].messages;
            for (let n = 0; n < messages.length; n++) {
                const message = messages[n];
                if (message.id == null) {
                    message.id = `${i} ${n}`;
                }
                if (message.isActive() && !this.clearedMessages.includes(message.id)) {
                    this.hasActiveFailures = true;
                    if (message.level == 3) {
                        this.hasWarnings = true;
                    }
                    if (message.level == 2) {
                        this.hasCautions = true;
                    }
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

    getActiveMessages() {
        const output = [];
        this.hasActiveMessages = false;
        for (const message of this.messages.normal) {
            if (message.isActive()) {
                output.push(message);
                this.hasActiveMessages = true;
            }
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
A320_Neo_LowerECAM_Status.StatusMessagePanel = StatusMessagePanel;
//# sourceMappingURL=A320_Neo_LowerECAM_Status.js.map