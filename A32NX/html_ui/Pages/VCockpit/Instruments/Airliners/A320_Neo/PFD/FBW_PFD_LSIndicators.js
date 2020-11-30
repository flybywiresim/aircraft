class FBW_PFD_LSIndicators {
    constructor() {
        this.LSIdentText = document.getElementById("ILSIdent");
        this.LSFrequencyLeadingDigits = document.getElementById("ILSFreqLeading");
        this.LSFrequencyTrailingDigits = document.getElementById("ILSFreqTrailing");
        this.LSDistanceLeadingDigits = document.getElementById("ILSDistLeading");
        this.LSDistanceTrailingDigits = document.getElementById("ILSDistTrailing");

        this.ILSMarkerText = document.getElementById("ILSMarkerText");
        this.PrevMarkerState = 2;

        this.GlideslopeDiamond = document.getElementById("GlideSlopeDiamond");
        this.GlideslopeDiamondLower = document.getElementById("GlideSlopeDiamondLower");
        this.GlideslopeDiamondUpper = document.getElementById("GlideSlopeDiamondUpper");

        this.LocDiamond = document.getElementById("LocDiamond");
        this.LocDiamondRight = document.getElementById("LocDiamondRight");
        this.LocDiamondLeft = document.getElementById("LocDiamondLeft");

        this.VDevSymbol = document.getElementById("VDevSymbol");
        this.VDevSymbolUpper = document.getElementById("VDevSymbolUpper");
        this.VDevSymbolLower = document.getElementById("VDevSymbolLower");

        this.LSInfoGroup = document.getElementById("LSInfoGroup");
        this.ILSDistGroup = document.getElementById("ILSDistGroup");
        this.LSGroup = document.getElementById("LSGroup");
        this.VDevGroup = document.getElementById("VertDevSymbolsGroup");
        this.LDevGroup = document.getElementById("LatDeviationSymbolsGroup");

        this.LocNeutral = document.getElementById("LocalizerNeutralLine");

        this.RadNav = new RadioNav();

        this.PrevILSInfoVisible = true;
        this.PrevDistanceVisibe = true;
        this.PrevVdevVisible = true;

        this.LSButtonPressed = true;
        this.disp_index = NaN;
    }

    init(_index) {
        this.RadNav.init(NavMode.FOUR_SLOTS);

        this.LDevGroup.style.display = "none";

        this.disp_index = _index;

        if (!SimVar.GetSimVarValue(`L:BTN_LS_${this.disp_index}_FILTER_ACTIVE`, "Bool")) {
            this.onLSButtonPressed();
        }

    }

    onLSButtonPressed() {
        if (this.LSButtonPressed) {
            this.LSButtonPressed = false;
            this.LSGroup.style.display = "none";
            this.LocNeutral.style.display = "none";
        } else {
            this.LSButtonPressed = true;
            this.LSGroup.style.display = "block";
            this.LocNeutral.style.display = "block";
            this.VDevGroup.style.display = "none";
        }
    }

    update() {
        const isApproachLoaded = Simplane.getAutoPilotApproachLoaded();
        const approachType = Simplane.getAutoPilotApproachType();

        if (isApproachLoaded && approachType === 10 && !this.LSButtonPressed) {
            this.updateLSInfo(null);
            this.updateVDevIndications();

            if (!this.PrevVdevVisible) {
                this.PrevVdevVisible = true;
                this.VDevGroup.style.display = "block";
            }
        } else {
            if (this.PrevVdevVisible) {
                this.PrevVdevVisible = false;
                this.VDevGroup.style.display = "none";
            }
            const localizer = this.RadNav.getBestILSBeacon();
            this.updateLSInfo(localizer);
            this.updateLocalizerIndications(localizer);
            this.updateGlideslopeIndications(localizer);
            this.updateMarkerText(localizer);
        }
    }

    updateMarkerText() {
        const markerState = SimVar.GetSimVarValue("MARKER BEACON STATE", "Enum");

        if (markerState === this.PrevMarkerState) {
            return;
        }

        this.PrevMarkerState = markerState;
        if (markerState === 0) {
            this.ILSMarkerText.style.visibility = "hidden";
        } else if (markerState === 1) {
            this.ILSMarkerText.style.visibility = "visible";
            this.ILSMarkerText.textContent = "OM";
            this.ILSMarkerText.classList.remove("White", "Amber", "MiddleMarkerBlink", "InnerMarkerBlink");
            this.ILSMarkerText.classList.add("Cyan", "OuterMarkerBlink");
        } else if (markerState === 2) {
            this.ILSMarkerText.style.visibility = "visible";
            this.ILSMarkerText.textContent = "MM";
            this.ILSMarkerText.classList.remove("White", "Cyan", "OuterMarkerBlink", "InnerMarkerBlink");
            this.ILSMarkerText.classList.add("Amber", "MiddleMarkerBlink");
        } else {
            this.ILSMarkerText.style.visibility = "visible";
            this.ILSMarkerText.textContent = "IM";
            this.ILSMarkerText.classList.remove("Amber", "Cyan", "OuterMarkerBlink", "MiddleMarkerBlink");
            this.ILSMarkerText.classList.add("White", "InnerMarkerBlink");
        }
    }

    updateLocalizerIndications(localizer) {
        const hasLoc = SimVar.GetSimVarValue(`NAV HAS NAV:${localizer.id}`, "Bool");
        if (hasLoc) {
            const deviation = SimVar.GetSimVarValue(`NAV RADIAL ERROR:${localizer.id}`, "degrees");
            const dots = deviation / 0.8;
            if (Math.abs(dots) < 2) {
                this.LocDiamond.style.display = "block";
                this.LocDiamond.setAttribute("transform", `translate(${dots * 30.221 / 2} 0)`);
                this.LocDiamondLeft.style.display = "none";
                this.LocDiamondRight.style.display = "none";
            } else if (dots > 0) {
                this.LocDiamond.style.display = "none";
                this.LocDiamondLeft.style.display = "none";
                this.LocDiamondRight.style.display = "block";
            } else {
                this.LocDiamond.style.display = "none";
                this.LocDiamondLeft.style.display = "block";
                this.LocDiamondRight.style.display = "none";
            }
        } else {
            this.LocDiamond.style.display = "none";
            this.LocDiamondLeft.style.display = "none";
            this.LocDiamondRight.style.display = "none";
        }
    }

    updateGlideslopeIndications(localizer) {
        const hasGlideslope = SimVar.GetSimVarValue(`NAV HAS GLIDE SLOPE:${localizer.id}`, "Bool");
        if (hasGlideslope) {
            const deviation = SimVar.GetSimVarValue(`NAV GLIDE SLOPE ERROR:${localizer.id}`, "degrees");
            const dots = deviation / 0.4;
            if (Math.abs(dots) < 2) {
                this.GlideslopeDiamond.style.display = "block";
                this.GlideslopeDiamond.setAttribute("transform", `translate(0 ${dots * 30.238 / 2})`);
                this.GlideslopeDiamondUpper.style.display = "none";
                this.GlideslopeDiamondLower.style.display = "none";
            } else if (dots > 0) {
                this.GlideslopeDiamond.style.display = "none";
                this.GlideslopeDiamondUpper.style.display = "none";
                this.GlideslopeDiamondLower.style.display = "block";
            } else {
                this.GlideslopeDiamond.style.display = "none";
                this.GlideslopeDiamondUpper.style.display = "block";
                this.GlideslopeDiamondLower.style.display = "none";
            }
        } else {
            this.GlideslopeDiamond.style.display = "none";
            this.GlideslopeDiamondUpper.style.display = "none";
            this.GlideslopeDiamondLower.style.display = "none";
        }
    }

    updateVDevIndications() {
        const deviation = SimVar.GetSimVarValue("GPS VERTICAL ERROR", "feet");
        const dots = deviation / 100;

        if (Math.abs(dots) < 2) {
            this.VDevSymbol.style.display = "block";
            this.VDevSymbol.setAttribute("transform", `translate(0 ${dots * 30.238 / 2})`);
            this.VDevSymbolUpper.style.display = "none";
            this.VDevSymbolLower.style.display = "none";
        } else if (dots > 0) {
            this.VDevSymbol.style.display = "none";
            this.VDevSymbolUpper.style.display = "none";
            this.VDevSymbolLower.style.display = "block";
        } else {
            this.VDevSymbol.style.display = "none";
            this.VDevSymbolUpper.style.display = "block";
            this.VDevSymbolLower.style.display = "none";
        }
    }

    updateLSInfo(localizer) {
        if (this.LSButtonPressed && localizer && localizer.freq !== 0) {
            if (!this.PrevILSInfoVisible) {
                this.PrevILSInfoVisible = true;
                this.LSInfoGroup.style.display = "block";
            }
            // normally the ident and freq should be always displayed when an ILS freq is set, but currently it only show when we have a signal
            this.LSIdentText.textContent = localizer.ident;

            const freqTextSplit = localizer.freq.toString().split(".");
            this.LSFrequencyLeadingDigits.textContent = freqTextSplit[0];
            this.LSFrequencyTrailingDigits.textContent = "." + freqTextSplit[1];

            const hasDME = SimVar.GetSimVarValue(`NAV HAS DME:${localizer.id}`, "Bool");
            if (hasDME) {
                if (!this.PrevDistanceVisibe) {
                    this.ILSDistGroup.style.display = "block";
                    this.PrevDistanceVisibe = true;
                }
                const dist = Math.round(SimVar.GetSimVarValue(`NAV DME:${localizer.id}`, "nautical miles") * 10) / 10;

                if (dist < 20) {
                    const distSplit = dist.toString().split(".");

                    this.LSDistanceLeadingDigits.innerHTML = distSplit[0];
                    this.LSDistanceTrailingDigits.innerHTML = "." + (distSplit.length > 1 ? distSplit[1] : "0");
                } else {
                    this.LSDistanceLeadingDigits.innerHTML = Math.round(dist).toString();
                    this.LSDistanceTrailingDigits.innerHTML = "";
                }

            } else {
                if (this.PrevDistanceVisibe) {
                    this.ILSDistGroup.style.display = "none";
                    this.PrevDistanceVisibe = false;
                }
            }
        } else if (this.PrevILSInfoVisible) {
            this.PrevILSInfoVisible = false;
            this.LSInfoGroup.style.display = "none";
        }
    }
}
