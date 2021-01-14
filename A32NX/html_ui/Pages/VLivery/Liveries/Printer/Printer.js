class LiveryPrinter extends TemplateElement {
    constructor() {
        super();
        this.curTime = 0.0;
        this.bNeedUpdate = false;
        this._isConnected = false;
    }
    get templateID() {
        return "LiveryPrinter";
    }
    connectedCallback() {
        super.connectedCallback();
        this.lines = this.querySelector("#lines");
        this.lines.innerHTML = '<text x="20" y="100">ABCDEF</text>';
        const updateLoop = () => {
            if (!this._isConnected) {
                return;
            }
            this.Update();
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        requestAnimationFrame(updateLoop);
    }
    disconnectedCallback() {
    }
    Update() {
        const elements = [];
        let newLines = '';
        for (let i = 0; i < SimVar.GetSimVarValue('L:A32NX_PRINT_LINES', 'number'); i += 1) {
            let line = '';
            for (let j = 0; j < SimVar.GetSimVarValue(`L:A32NX_PRINT_LINE_LENGTH_${i}`, 'number'); j += 1) {
                line += String.fromCharCode(SimVar.GetSimVarValue(`L:A32NX_PRINT_${i}_${j}`, 'number'));
            }
            elements.push(line);
        }

        for (const [index, value] of elements.entries()) {
            newLines += `<text x="10" y="${((index) * 40) + 100}">${value}</text>`;
        }
        this.lines.innerHTML = newLines;
    }
}
registerLivery("livery-printer-element", LiveryPrinter);
//# sourceMappingURL=Registration.js.map
