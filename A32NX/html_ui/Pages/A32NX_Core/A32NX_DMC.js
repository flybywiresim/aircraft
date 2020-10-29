function updateDisplayDMC(displayName, displayElement, maintElement) {
    const dmcSwitchingKnob = SimVar.GetSimVarValue("L:A32NX_KNOB_SWITCHING_3_Position", "Enum");
    const dmc3displayTest = SimVar.GetSimVarValue("L:A32NX_DMC_DISPLAYTEST:3", "Enum");
    let dmc1displayTest = SimVar.GetSimVarValue("L:A32NX_DMC_DISPLAYTEST:1", "Enum");
    let dmc2displayTest = SimVar.GetSimVarValue("L:A32NX_DMC_DISPLAYTEST:2", "Enum");

    if (dmcSwitchingKnob == 0) {
        dmc1displayTest = dmc3displayTest;
    } else if (dmcSwitchingKnob == 2) {
        dmc2displayTest = dmc3displayTest;
    }

    let testActive = false;
    switch (displayName) {
        case "PFD1":
        case "MFD1":
        case "EICAS1":
            testActive = dmc1displayTest == 2 ? 1 : 0;
            maintMode = dmc1displayTest == 1 ? 1 : 0;
            break;
        case "PFD2":
        case "MFD2":
        case "EICAS2":
            testActive = dmc2displayTest == 2 ? 1 : 0;
            maintMode = dmc2displayTest == 1 ? 1 : 0;
            break;
    }

    const displayState = displayElement.getAttribute("display");
    if (testActive) {
        if (displayState != "block") {
            displayElement.setAttribute("display", "block");
        }
    } else {
        if (displayState != "none") {
            displayElement.setAttribute("display", "none");
        }
    }

    const maintState = maintElement.getAttribute("display");
    if (maintMode) {
        if (maintState != "block") {
            maintElement.setAttribute("display", "block");
        }
    } else {
        if (maintState != "none") {
            maintElement.setAttribute("display", "none");
        }
    }
}