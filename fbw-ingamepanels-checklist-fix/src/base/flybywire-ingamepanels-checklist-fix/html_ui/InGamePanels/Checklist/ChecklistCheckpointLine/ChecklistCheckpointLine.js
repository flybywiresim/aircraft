class CheckpointData {
    reset() {
        this.nPageId = -1;
        this.nCheckpointId = -1;
        this.bIsActualCheckpoint = true;
        this.sSubject = "";
        this.sExpectation = "";
        this.aChildren = [];
    }
    toString() {
        return Number(this.nPageId).toFixed(0) + "_" + Number(this.nCheckpointId).toFixed(0) + "/" + this.bIsActualCheckpoint;
    }
}
class ChecklistCheckpointLineElement extends ButtonElement {
    constructor(_evaluation, _configuration) {
        super();
        this.m_eyeVisible = true;
        this.m_depth = 0;
        this.m_fnEyeClick = null;
        this.data = new CheckpointData;
        this.bIsCursor = false;
        this.onSelect = () => {
            this.dispatchEvent(new Event('onSelectLine'));
        };
        this.onEyeClick = () => {
            this.dispatchEvent(new Event('eyeClick'));
        };
        this.setEyeVisible = (val) => {
            this.bIsEyeAlwaysVisible = val;
            if (val) {
                this.getEye().classList.remove("invisible");
            }
            else if (UINavigation.current != this.getEye() && (!this.m_selectZone || !this.m_selectZone.selected)) {
                this.getEye().classList.add("invisible");
            }
        };
        this.onActiveChildBlurred = (current) => {
            super.onActiveChildBlurred(current);
            if (UINavigation.current != this && !this.m_selectZone.selected && !this.bIsEyeAlwaysVisible) {
                this.getEye().classList.add("invisible");
            }
        };
        this.m_evaluation = _evaluation;
        this.m_config = _configuration;
        this.Reset();
    }
    get templateID() { return "ChecklistCheckpointLineTemplate"; }
    ;
    get defaultClick() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.classList.add('condensed-interactive');
        this.updateTexts();
        this.m_eyeElem = this.querySelector(".Eye");
        this.m_selectZone = this.querySelector(":scope > .background > .select-zone");
        if (this.m_eyeElem) {
            this.m_eyeElem.addEventListener("OnValidate", this.onEyeClick);
        }
        if (this.m_selectZone) {
            Object.defineProperty(this.m_selectZone, "defaultSoundType", {
                get() {
                    return "listbutton";
                }
            });
            this.m_selectZone.addEventListener("OnValidate", this.onSelect);
        }
        this.setVisualHelpAvailablity(this.bUIHelpAvailable);
        if (!this.hasAttribute('depth')) {
            this.setAttribute('depth', "0");
        }
        if (this.bUIHelpAvailable) {
            this.addEventListener("eyeClick", this.OnToggleHelp.bind(this), true);
        }
        else {
            this.setEyeClickEvent(null);
        }
        window.addEventListener("updateExternal:cursorModeOn", () => {
            this.setEyeVisible(true);
        });
        window.addEventListener("updateExternal:cursorModeOff", () => {
            this.setEyeVisible(false);
        });
    }
    updateTexts() {
        if (!this.data)
            return;
        let subject = this.querySelector(".Subject p");
        if (subject && this.data.sSubject)
            subject.innerText = this.data.sSubject;
        let expectation = this.querySelector(".Expectation p");
        if (expectation && this.data.sExpectation)
            expectation.innerText = this.data.sExpectation;
        this.m_depth = 0;
        let parent = this.parentElement;
        while (parent) {
            if (parent && parent.constructor == ChecklistCheckpointLineGroupElement) {
                ++this.m_depth;
            }
            parent = parent.parentElement;
        }
        this.setAttribute("depth", this.m_depth.toFixed(0));
    }
    getEye() {
        return this.m_eyeElem;
    }
    setVisualHelpAvailablity(availability) {
        if (!this.bIsEyeAlwaysVisible) {
            this.m_eyeVisible = availability;
            let eye = this.getEye();
            if (eye) {
                if (availability) {
                    eye.classList.remove("invisible");
                }
                else {
                    eye.classList.add("invisible");
                }
            }
        }
    }
    onHover() {
        super.onHover();
        if (this.getEye())
            this.getEye().classList.remove("invisible");
    }
    onLeave() {
        super.onLeave();
        if ((!this.m_selectZone || !this.m_selectZone.selected) && !this.bIsEyeAlwaysVisible) {
            this.getEye().classList.add("invisible");
        }
    }
    setEyeClickEvent(event) {
        this.m_fnEyeClick = event;
    }
    setBaseColor(color) {
        this.style.setProperty("--baseColor", color);
    }
    setChecked(val) {
        this.classList.toggle("checked", val);
    }
    setSelected(val) {
        if (!this.isConnected)
            return;
        this.m_selectZone.selected = val;
        if (this.getEye() && !this.bIsEyeAlwaysVisible) {
            this.getEye().classList.toggle("invisible", !val);
        }
        if (val) {
            this.scrollifOutOfView();
            let parent = this.parentElement;
            while (parent) {
                if (parent && parent.constructor == ChecklistCheckpointLineGroupElement) {
                    parent.expandChildren();
                }
                parent = parent.parentElement;
            }
        }
    }
    setCursor(val) {
        this.classList.toggle('cursor-on', val);
    }
    setCurrentAutocheck(val) {
        this.classList.toggle("unselectable", this.m_evaluation.isAutocheckActivated() && !val);
        this.classList.toggle("currentAutocheck", val);
    }
    setCurrentCopilot(val) {
        this.classList.toggle("currentCopilot", val);
    }
    setDisabled(val) {
        this.classList.toggle("disabled", val);
    }
    setCopilotAvailable(val) {
        this.classList.toggle("copilotAvailable", val);
    }
    Reset() {
        this.bUIChecked = false;
        this.bUISkipped = false;
        this.bUIHelpAvailable = false;
        this.bUIHelpActivated = false;
        this.bUICopilotAvailable = false;
        this.bManual = false;
        this.bIsSelected = false;
    }
    SetData(_oData) {
        this.data = _oData;
        this.updateTexts();
    }
    HTMLId() {
        if (this.data.bIsActualCheckpoint)
            return `id_Checkpoint_${this.data.nPageId}_${this.data.nCheckpointId}`;
        else
            return `id_Group_${this.data.nPageId}_${this.data.nCheckpointId}`;
    }
    Display() {
        return this;
    }
    getPageId() {
        if (!this.data)
            return null;
        return this.data.nPageId;
    }
    getId() {
        if (!this.data)
            return null;
        return this.data.nCheckpointId;
    }
    OnToggleHelp() {
        if (this.bUIHelpActivated === true) {
            Coherent.trigger("CHECKLIST_STOP_HELP", this.data.nPageId, this.data.nCheckpointId);
        }
        else {
            Coherent.trigger("CHECKLIST_START_HELP", this.data.nPageId, this.data.nCheckpointId);
        }
    }
    OnCopilotRequest() {
        Coherent.trigger("CHECKLIST_COPILOT_CHECKPOINT", this.data.nPageId, this.data.nCheckpointId);
    }
    OnForceFinishCopilot() {
        Coherent.trigger("CHECKLIST_FORCE_FINISH_COPILOT", this.data.nPageId, this.data.nCheckpointId);
    }
    collapse() {
    }
    UpdateHTMLState(_bUpdateChildren) {
        if (this.data.bIsActualCheckpoint) {
            this.setChecked(this.bUIChecked);
            this.setSelected(this.bIsSelected);
            this.setCursor(this.bIsCursor);
            this.setDisabled(this.bUISkipped);
            this.setCopilotAvailable(this.bUICopilotAvailable);
            this.setCurrentAutocheck(this.m_evaluation.IsAutocheckCurrentCheckpoint(this));
            this.setCurrentCopilot(this.m_evaluation.IsCopilotCurrentCheckpoint(this));
            let baseColor = (this.m_config.oHelpers.data.bAutoCheck) ? _CheckpointColors.cAutoComplete : _CheckpointColors.cManualValidation;
            this.setBaseColor(baseColor);
            if (this.bIsSelected && !Utils.isVisible(this)) {
                this.scrollifOutOfView();
            }
        }
    }
    scrollifOutOfView() {
        this.virtualScrollIntoView();
    }
    getChecklistHeight() {
        return document.getElementById('Checklist').offsetHeight;
    }
    getPageHeight() {
        return document.getElementById('ChecklistDiv').offsetHeight;
    }
    UpdateCompletion(_oData) {
        this.bUIChecked = (_oData.bUIChecked === true);
        this.bUISkipped = (_oData.bUISkipped === true);
        this.bUIHelpAvailable = (_oData.bUIHelpAvailable === true);
        this.bUIHelpActivated = (_oData.bUIHelpActivated === true);
        this.bUICopilotAvailable = (_oData.bUICopilotAvailable === true);
        this.bManual = (_oData.bManual === true);
    }
    get checkedState() {
        return this.bUIChecked ? " checked " : " not checked ";
    }
    get descriptionText() {
        let footer = document.getElementById("FooterText");
        if (footer)
            return footer.innerText;
        return "";
    }
}
window.customElements.define("checklist-checkpoint-line", ChecklistCheckpointLineElement);
class ChecklistCheckpointLineGroupElement extends ChecklistCheckpointLineElement {
    constructor(_checklist) {
        super(_checklist.m_evaluation, _checklist.m_config);
        this.aChildren = [];
        this.toggleChildren = () => {
            this.classList.toggle("collapse");
            this.m_childrenContainer.classList.toggle("hide", this.classList.contains("collapse"));
            this.sendSizeUpdate();
        };
        this.m_checklist = _checklist;
        this.reset();
    }
    reset() {
        this.aChildren = [];
    }
    get templateID() { return "ChecklistCheckpointLineGroupTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        this.m_lineHeader = this.querySelector('.line');
        this.m_childrenContainer = this.querySelector('.Children');
        this.m_lineHeader.addEventListener("OnValidate", this.toggleChildren);
        this.collapseChildren();
        if (!this.hasAttribute('depth')) {
            this.setAttribute('depth', "0");
        }
    }
    expandChildren() {
        this.classList.remove("collapse");
        this.sendSizeUpdate();
    }
    collapseChildren() {
        this.classList.add("collapse");
        this.sendSizeUpdate();
    }
    collapse() {
        if (!this.data.bIsActualCheckpoint) {
            this.collapseChildren();
            this.setDisabled(this.bUISkipped);
        }
    }
    addChild(_child) {
        this.aChildren.push(_child);
    }
    Reset() {
        super.Reset();
        this.aChildren = [];
    }
    SetData(_oData) {
        super.SetData(_oData);
        for (let i = 0; i < _oData.aChildren.length; i++) {
            let oCheckpoint = this.createCheckpointElement(_oData.aChildren[i]);
            this.aChildren.push(oCheckpoint);
        }
    }
    createCheckpointElement(_oData) {
        let checkpoint;
        if (_oData.bIsActualCheckpoint) {
            checkpoint = new ChecklistCheckpointLineElement(this.m_checklist.m_evaluation, this.m_checklist.m_config);
            checkpoint.addEventListener("onSelectLine", () => this.m_checklist.SelectCheckpoint(checkpoint, true));
        }
        else {
            checkpoint = new ChecklistCheckpointLineGroupElement(this.m_checklist);
        }
        checkpoint.SetData(_oData);
        return checkpoint;
    }
    updateTexts() {
        super.updateTexts();
        this.setVisualHelpAvailablity(false);
        let childContainer = this.querySelector(".Children");
        if (childContainer) {
            Utils.RemoveAllChildren(childContainer);
            for (let child of this.aChildren) {
                child.classList.add('inGroup');
                childContainer.appendChild(child);
            }
        }
    }
    UpdateHTMLState(_bUpdateChildren) {
        if (_bUpdateChildren) {
            for (let child of this.aChildren) {
                child.UpdateHTMLState(_bUpdateChildren);
            }
        }
    }
}
window.customElements.define("checklist-checkpoint-line-group", ChecklistCheckpointLineGroupElement);
class ChecklistPageElement extends TemplateElement {
    constructor(_checklist) {
        super();
        this.classList.add("Page");
        this.m_checklist = _checklist;
        this.Reset();
    }
    get templateID() { return "ChecklistPageTemplate"; }
    ;
    Reset() {
        this.nId = -1;
        this.sDesc = null;
        this.aCheckpoints = [];
        this.bUIComplete = false;
    }
    connectedCallback() {
        super.connectedCallback();
    }
    SetData(_oData) {
        this.Reset();
        this.nId = _oData.nPageId;
        this.sDesc = _oData.sDesc;
        for (let i = 0; i < _oData.aCheckpoints.length; ++i) {
            let oCheckpoint = this.createCheckpointElement(_oData.aCheckpoints[i]);
            this.aCheckpoints.push(oCheckpoint);
        }
    }
    createCheckpointElement(_oData) {
        let checkpoint;
        if (_oData.bIsActualCheckpoint) {
            checkpoint = new ChecklistCheckpointLineElement(this.m_checklist.m_evaluation, this.m_checklist.m_config);
            checkpoint.addEventListener("onSelectLine", () => this.m_checklist.SelectCheckpoint(checkpoint, true));
        }
        else {
            checkpoint = new ChecklistCheckpointLineGroupElement(this.m_checklist);
        }
        checkpoint.SetData(_oData);
        return checkpoint;
    }
    HTMLId() {
        return "id_Page_" + this.nId;
    }
    Display() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        this.id = this.HTMLId();
        for (let i = 0; i < this.aCheckpoints.length; ++i) {
            this.appendChild(this.aCheckpoints[i]);
        }
        return this;
    }
    UpdateHTMLState(_bUpdateChildren, _autoCheck) {
        this.classList.toggle("Completed", this.bUIComplete);
        this.classList.toggle("Current", !this.bUIComplete && _autoCheck);
        if (_bUpdateChildren === true) {
            for (let i = 0; i < this.aCheckpoints.length; ++i) {
                this.aCheckpoints[i].UpdateHTMLState(_bUpdateChildren);
            }
        }
    }
    UpdateCompletion(_oData) {
        let bPageCompleteEvent = (this.bUIComplete === false && _oData.bUIComplete === true);
        this.bUIComplete = (_oData.bUIComplete === true);
        if (bPageCompleteEvent) {
            this.dispatchEvent(new CustomEvent("completed"));
        }
    }
}
window.customElements.define('checklist-page', ChecklistPageElement);
checkAutoload();
//# sourceMappingURL=ChecklistCheckpointLine.js.map