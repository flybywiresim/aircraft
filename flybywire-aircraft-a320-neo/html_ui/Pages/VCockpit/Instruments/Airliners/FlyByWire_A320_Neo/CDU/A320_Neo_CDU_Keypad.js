class Keypad {
    constructor(mcdu) {
        this._mcdu = mcdu;
        this._keys = {
            "AIRPORT": () => mcdu.onAirport(),
            "ATC": () => CDUAtcMenu.ShowPage(mcdu),
            "DATA": () => CDUDataIndexPage.ShowPage1(mcdu),
            "DIR": () => {
                mcdu.eraseTemporaryFlightPlan();
                CDUDirectToPage.ShowPage(mcdu);
            },
            "FPLN": () => CDUFlightPlanPage.ShowPage(mcdu),
            "FUEL": () => mcdu.goToFuelPredPage(),
            "INIT": () => {
                if (mcdu.flightPhaseManager.phase === FmgcFlightPhases.DONE) {
                    mcdu.flightPhaseManager.changePhase(FmgcFlightPhases.PREFLIGHT);
                }
                CDUInitPage.ShowPage1(mcdu);
            },
            "MENU": () => CDUMenuPage.ShowPage(mcdu),
            "PERF": () => {
                if (mcdu.flightPhaseManager.phase === FmgcFlightPhases.DONE) {
                    mcdu.flightPhaseManager.changePhase(FmgcFlightPhases.PREFLIGHT);
                }
                CDUPerformancePage.ShowPage(mcdu);
            },
            "PROG": () => CDUProgressPage.ShowPage(mcdu),
            "RAD": () => CDUNavRadioPage.ShowPage(mcdu),
            "SEC": () => CDUSecFplnMain.ShowPage(mcdu),

            "PREVPAGE": () => mcdu.onPrevPage(),
            "NEXTPAGE": () => mcdu.onNextPage(),
            "UP": () => mcdu.onUp(),
            "DOWN": () => mcdu.onDown(),

            "CLR": () => mcdu.onClr(),
            "CLR_Held": () => mcdu.onClrHeld(),
            "DIV": () => mcdu.onDiv(),
            "DOT": () => mcdu.onDot(),
            "OVFY": () => mcdu.onOvfy(),
            "PLUSMINUS": () => mcdu.onPlusMinus(),
            "SP": () => mcdu.onSp()
        };

        for (const letter of FMCMainDisplay._AvailableKeys) {
            this._keys[letter] = () => this._mcdu.onLetterInput(letter);
        }
    }

    onKeyPress(value) {
        const action = this._keys[value];
        if (!action) {
            return false;
        }

        const cur = this._mcdu.page.Current;
        setTimeout(() => {
            if (this._mcdu.page.Current === cur) {
                action();
            }
        }, this._mcdu.getDelaySwitchPage());
        return true;
    }
}
