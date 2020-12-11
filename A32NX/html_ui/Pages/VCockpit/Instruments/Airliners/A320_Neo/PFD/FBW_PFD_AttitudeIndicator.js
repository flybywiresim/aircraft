class FBW_PFD_AttitudeIndicator {
    constructor() {
        this.RollGroup = document.getElementById("RollGroup");
        this.PitchGroup = document.getElementById("PitchGroup");
        this.AttitudeSymbolsGroup = document.getElementById("AttitudeSymbolsGroup");

        this.AttFlag = document.getElementById("AttFailText");

        this.PitchProtUpper = document.getElementById("PitchProtUpper");
        this.PitchProtLower = document.getElementById("PitchProtLower");
        this.PitchProtUpperLost = document.getElementById("PitchProtLostUpper");
        this.PitchProtLowerLost = document.getElementById("PitchProtLostLower");

        this.RollProt = document.getElementById("RollProtGroup");
        this.RollProtLost = document.getElementById("RollProtLost");

        this.TailstrikeWarning = document.getElementById("TailstrikeWarning");

        this.RadioAlt = document.getElementById("RadioAlt");
        this.PrevRadioAltVisible = true;
        this.PrevRadioAltLargeFont = false;
        this.PrevRadioAltAmber = true;

        this.AttDHText = document.getElementById("AttDHText");
        this.PrevDHTextVisible = true;

        this.RadioAltDHGroup = document.getElementById("DHAndRAGroup");

        this.RisingGround = document.getElementById("HorizonGroundRectangle");

        this.FlightDirectorPitch = document.getElementById("FlightDirectorPitch");
        this.PrevFDPitchVisible = true;
        this.FlightDirectorRoll = document.getElementById("FlightDirectorRoll");
        this.PrevFDRollVisible = true;

        this.GroundYawBar = document.getElementById("GroundYawSymbol");

        this.FlightPathVectorSymbol = document.getElementById("FlightPathSymbol");
        this.FlightPathDirector = document.getElementById("FlightPathDirector");

        this.SidestickIndicatorGroup = document.getElementById("GroundCursorGroup");
        this.SidestickIndicatorCrosshair = document.getElementById("GroundCursorCrosshair");
        this.PrevSidestickIndicatorVisible = true;

        this.SideslipIndicator = document.getElementById("SideSlipIndicator");
        this.RollIndicatorTriangle = document.getElementById("RollTriangleGroup");

        this.Tick = document.getElementById("HorizonHeadingTick");
        this.SelectedHeadingBug = document.getElementById("HorizonHeadingBug");
        this.SelectedHeadingBugIndex = NaN;
        this.PrevSelectedHeadingBugVisible = true;
        this.HeadingTape = new FBW_PFD_HeadingTape(35, 10, 15, document.getElementById("HorizonHeadingTickGroup"));

        this.disp_index = NaN;
    }

    init(_index) {
        this.PitchProtUpperLost.style.display = "none";
        this.PitchProtLowerLost.style.display = "none";
        this.RollProtLost.style.display = "none";

        this.AttFlag.style.display = "none";

        this.GroundYawBar.style.display = "none";

        this.FlightPathVectorSymbol.style.display = "none";
        this.FlightPathDirector.style.display = "none";

        this.TailstrikeWarning.style.display = "none";

        this.HeadingTape.init(this.Tick, "HorizonHeadingTick");

        this.SelectedHeadingBugIndex = this.HeadingTape.addBug(this.SelectedHeadingBug);

        this.disp_index = _index;
    }

    update(isOnGround, radioAlt, decisionHeight, heading, selectedHeading) {
        const roll = SimVar.GetSimVarValue("PLANE BANK DEGREES", "degrees");
        const pitch = -SimVar.GetSimVarValue("PLANE PITCH DEGREES", "degrees"); //Pitch is negative for up? wtf

        const FDActive = SimVar.GetSimVarValue(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${this.disp_index}`, "Bool");

        this.updateFDBars(FDActive);

        this.HeadingTape.updateGraduation(heading, Math.max(Math.min(this.calculateOffsetFromPitch(pitch), 31.563), -31.563));

        if (!isNaN(selectedHeading) && !FDActive) {
            this.HeadingTape.updateBug(this.SelectedHeadingBugIndex, selectedHeading, heading, true);
        } else {
            this.HeadingTape.updateBug(this.SelectedHeadingBugIndex, 0, heading, false);
        }

        this.setAttitude(pitch, roll);
        this.updateSI(isOnGround);
        this.updateVerticalOffset(roll);
        this.updateRisingGround(radioAlt, pitch);
        this.updateRadioAlt(radioAlt, decisionHeight);
        this.updateSidestickIndicator(isOnGround);
    }

    updateSidestickIndicator(onGround) {
        if (!onGround && this.PrevSidestickIndicatorVisible) {
            this.SidestickIndicatorGroup.style.display = "none";
            this.PrevSidestickIndicatorVisible = false;
            return;
        } else if (onGround && !this.PrevSidestickIndicatorVisible) {
            this.SidestickIndicatorGroup.style.display = "block";
            this.PrevSidestickIndicatorVisible = true;
        }

        const SidestickPosX = SimVar.GetSimVarValue("YOKE X POSITION", "Position") * 29.56;
        const SidestickPosY = -SimVar.GetSimVarValue("YOKE Y POSITION", "Position") * 23.02;

        this.SidestickIndicatorCrosshair.setAttribute("transform", `translate(${SidestickPosX} ${SidestickPosY})`);
    }

    updateRadioAlt(radioAlt, decisionHeight) {
        if (radioAlt > 2500 && this.PrevRadioAltVisible) {
            this.RadioAlt.style.display = "none";
            this.PrevRadioAltVisible = false;
            return;
        } else if (radioAlt <= 2500 && !this.PrevRadioAltVisible) {
            this.RadioAlt.style.display = "block";
            this.PrevRadioAltVisible = true;
        }

        if (radioAlt <= 400 && !this.PrevRadioAltLargeFont) {
            this.RadioAlt.classList.add("FontLargest");
            this.RadioAlt.classList.remove("FontLarge");
            this.PrevRadioAltLargeFont = true;
        } else if (radioAlt > 400 && this.PrevRadioAltLargeFont) {
            this.RadioAlt.classList.remove("FontLargest");
            this.RadioAlt.classList.add("FontLarge");
            this.PrevRadioAltLargeFont = false;
        }

        const DHValid = decisionHeight >= 0;

        if ((radioAlt > 400 || (radioAlt > decisionHeight + 100 && DHValid)) && this.PrevRadioAltAmber) {
            this.RadioAlt.classList.add("Green");
            this.RadioAlt.classList.remove("Amber");
            this.PrevRadioAltAmber = false;
        } else if ((radioAlt <= 400 || (radioAlt <= decisionHeight + 100 && DHValid)) && !this.PrevRadioAltAmber) {
            this.RadioAlt.classList.add("Amber");
            this.RadioAlt.classList.remove("Green");
            this.PrevRadioAltAmber = true;
        }

        if (DHValid && radioAlt < decisionHeight && !this.PrevDHTextVisible) {
            this.PrevDHTextVisible = true;
            this.AttDHText.style.display = "block";
            this.AttDHText.classList.add("Blink9Seconds");
        } else if ((!DHValid || radioAlt > decisionHeight) && this.PrevDHTextVisible) {
            this.PrevDHTextVisible = false;
            this.AttDHText.style.display = "none";
            this.AttDHText.classList.remove("Blink9Seconds");
        }

        let text = "";

        if (radioAlt < 5) {
            text = Math.round(radioAlt).toString();
        } else if (radioAlt <= 50) {
            text = (Math.round(radioAlt / 5) * 5).toString();
        } else if (radioAlt > 50 || (radioAlt > decisionHeight + 100 && DHValid)) {
            text = (Math.round(radioAlt / 10) * 10).toString();
        }

        this.RadioAlt.textContent = text;
    }

    updateFDBars(FDActive) {
        // FD active handling to be improved

        if (!FDActive) {
            if (this.PrevFDPitchVisible) {
                this.PrevFDPitchVisible = false;
                this.FlightDirectorPitch.style.display = "none";
            }
            if (this.PrevFDRollVisible) {
                this.PrevFDRollVisible = false;
                this.FlightDirectorRoll.style.display = "none";
            }
            return;
        } else {
            if (!this.PrevFDPitchVisible) {
                this.PrevFDPitchVisible = true;
                this.FlightDirectorPitch.style.display = "block";
            }
            if (!this.PrevFDRollVisible) {
                this.PrevFDRollVisible = true;
                this.FlightDirectorRoll.style.display = "block";
            }
        }

        //pitch and roll bars should only should show up when a corresponding vertical or lateral mode is engaged. this is still to do.

        const FDRollOrder = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "Radians");
        const FDPitchOrder = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "Radians");

        const FDXOffset = Math.min(Math.max(-FDRollOrder * 180 / Math.PI, -45), 45) * 0.44;
        const FDYOffset = Math.min(Math.max(FDPitchOrder * 180 / Math.PI, -22.5), 22.5) * 0.89;

        this.FlightDirectorRoll.setAttribute("transform", `translate(${FDXOffset} 0)`);
        this.FlightDirectorPitch.setAttribute("transform", `translate(0 ${FDYOffset})`);
    }

    updateSI(isOnGround) {
        let SIIndexOffset = 0;

        if (isOnGround) {
            // on ground, lateral g is indicated. max 0.3g, max deflection is 15mm
            const latAcc = SimVar.GetSimVarValue("ACCELERATION BODY X", "G Force");
            const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
            SIIndexOffset = -accInG * 15 / 0.3;
        } else {
            // Not sure if this is accurate
            const turnCoordinator = -Simplane.getInclinometer();
            SIIndexOffset = turnCoordinator * 15;
        }

        this.SideslipIndicator.setAttribute("transform", `translate(${SIIndexOffset} 0)`);
    }

    updateRisingGround(radioAlt, pitch) {
        const targetPitch = -0.1 * radioAlt;

        const targetOffset = Math.max(Math.min(this.calculateOffsetFromPitch(pitch - targetPitch) - 31.563, 0), -63.093);

        this.RisingGround.setAttribute("transform", `translate(0 ${targetOffset})`);
    }

    updateVerticalOffset(roll) {
        let offset = 0;

        if (Math.abs(roll) > 60) {
            offset = Math.max(0, 41 - 35.87 / Math.sin(Math.abs(roll) / 180 * Math.PI));
        }

        this.RollIndicatorTriangle.setAttribute("transform", `translate(0 ${offset})`);
        this.RadioAltDHGroup.setAttribute("transform", `translate(0 ${-offset})`);
    }

    setAttitude(pitch, roll) {
        const pitchOffset = this.calculateOffsetFromPitch(pitch);

        this.PitchGroup.setAttribute("transform", `translate(0 ${pitchOffset})`);

        this.RollGroup.setAttribute("transform", `rotate(${roll} 68.814 80.730)`);
    }

    calculateOffsetFromPitch(pitch) {
        if (pitch > -5 && pitch <= 20) {
            return pitch * 1.8;
        } else if (pitch > 20 && pitch <= 30) {
            return -0.04 * Math.pow(pitch, 2) + 3.4 * pitch - 16;
        } else if (pitch > 30) {
            return 20 + pitch;
        } else if (pitch < -5 && pitch >= -15) {
            return 0.04 * Math.pow(pitch, 2) + 2.2 * pitch + 1;
        } else {
            return pitch - 8;
        }
    }
}
